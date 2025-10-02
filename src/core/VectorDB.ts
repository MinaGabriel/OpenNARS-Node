// VectorDB.ts — A richly commented LanceDB wrapper for tokens (keyphrases) and chunks
// ---------------------------------------------------------------------------------
// This file demonstrates:
//   • How to set up TWO logical tables: `tokens` (keyphrases) and `chunks` (retrieval units)
//   • How to add tokens (id, text, vector, chunk)
//   • How to add whole chunks by averaging (weighted) keyword vectors
//   • How to search chunks semantically
//   • Small, concrete examples are included in the comments for clarity
//
// Design highlights
// -----------------
// 1) `tokens` table (keyphrase-level):
//      id:       deterministic id for (keyphrase, chunk)
//      text:     the keyphrase string (lowercased)
//      vector:   embedding of the keyphrase string (L2-normalized)
//      chunk:    the raw chunk text (for filtering/explainability)
//      chunk_id: foreign-key ref to the chunks table (string)
//      weight:   importance weight for that keyphrase inside the chunk
//
// 2) `chunks` table (chunk-level):
//      id:          deterministic id for the chunk
//      document_id: id/path/url of the source document
//      text:        the chunk text (what you'll display on retrieval)
//      vector:      chunk embedding (L2-normalized)
//      keywords:    compact JSON summary [{item, weight}, ...] for explainability
//
// Why two tables?
// • The `chunks` table gives you fast retrieval (one vector per chunk).
// • The `tokens` table keeps the granular keyphrase inventory (for debugging, vocab analytics,
//   literal direction math, and rebuilding chunk vectors later if you change weights).
//
// NOTE on schema with LanceDB JS:
// • The JS API often infers schema from your first insert; to avoid inference issues,
//   we insert a bootstrap row then delete it. Alternatively, you can use explicit Arrow schemas
//   if you prefer (omitted here for brevity and portability across versions).

import * as lancedb from "@lancedb/lancedb";
import { z } from "zod";
import { LLMs } from "./LLMs"; // we assume LLMs.embed(text: string) => Promise<number[]> (384-dim MiniLM)
import crypto from "crypto";

// ============================================================================
// Zod Schemas & Type Definitions
// ============================================================================

/**
 * Schema for a token (keyphrase) row.
 * Tokens represent individual keyphrases within chunks.
 */
export const TokenRowSchema = z.object({
  id: z.string(),              // stable id for (keyphrase, chunk_id): e.g., sha1(`${keyphrase}||${chunk_id}`)
  text: z.string(),            // keyphrase normalized (e.g., lowercased)
  vector: z.array(z.number()), // keyphrase embedding (L2-normalized)
  chunk: z.string(),           // the raw chunk text (for filtering/explainability)
  chunk_id: z.string(),        // FK to chunks.id
  weight: z.number(),          // importance weight within chunk (0..1)
});

export type TokenRow = z.infer<typeof TokenRowSchema>;

/**
 * Input schema for adding tokens (without pre-computed vector).
 */
export const TokenRowInputSchema = z.object({
  id: z.string(),
  text: z.string(),
  chunk: z.string(),
  chunk_id: z.string(),
  weight: z.number(),
});

export type TokenRowInput = z.infer<typeof TokenRowInputSchema>;

/**
 * Schema for a chunk row.
 * Chunks are the main retrieval units.
 */
export const ChunkRowSchema = z.object({
  id: z.string(),              // chunk id (stable, deterministic)
  document_id: z.string(),     // source doc id/path/url
  text: z.string(),            // raw chunk text
  vector: z.array(z.number()), // chunk embedding (L2-normalized)
  keywords: z.string(),        // JSON string: [{item, weight}, ...]
});

export type ChunkRow = z.infer<typeof ChunkRowSchema>;

/**
 * Schema for keyword items used in chunk creation.
 */
export const KeywordSchema = z.object({
  item: z.string(),
  weight: z.number(),
});

export type Keyword = z.infer<typeof KeywordSchema>;

export const keywordsArraySchema = z.array(KeywordSchema).min(1);
export type keywordsArrayType = z.infer<typeof keywordsArraySchema>;

/**
 * Type for the result of extractItemsAndWeights.
 */
export type keyWords = {
  keywords: Keyword[];
};

/**
 * Schema for addChunkFromKeywords arguments.
 */
export const AddChunkFromKeywordsArgsSchema = z.object({
  chunk_id: z.string(),
  document_id: z.string(),
  text: z.string(),
  keywords: z.array(KeywordSchema),
});

export type AddChunkFromKeywordsArgs = z.infer<typeof AddChunkFromKeywordsArgsSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * L2-normalize a vector (makes it unit length).
 * This ensures dot product equals cosine similarity.
 */
function l2Normalize(vec: number[]): number[] {
  let sumSquares = 0;
  for (const x of vec) {
    sumSquares += x * x;
  }
  const norm = Math.sqrt(sumSquares) || 1;
  return vec.map((x) => x / norm);
}

/**
 * Compute weighted mean of multiple vectors.
 * Used to combine keyword embeddings into a single chunk embedding.
 */
function weightedMean(vectors: number[][], weights: number[]): number[] {
  if (vectors.length === 0) return [];

  const dimensions = vectors[0].length;
  const accumulated = new Array(dimensions).fill(0);
  let weightSum = 0;

  for (let i = 0; i < vectors.length; i++) {
    const weight = weights[i];
    weightSum += weight;
    const vector = vectors[i];

    for (let j = 0; j < dimensions; j++) {
      accumulated[j] += weight * vector[j];
    }
  }

  if (weightSum === 0) return accumulated;

  return accumulated.map(val => val / weightSum);
}

/**
 * Generate a deterministic SHA-1 hash for stable IDs.
 */
export function sha1Id(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex");
}

// ============================================================================
// VectorDB Class
// ============================================================================

export class VectorDB {
  private dbPath: string = "./mydb";           // default database path
  private tokensTableName: string = "tokens";  // default tokens table name
  private chunksTableName: string = "chunks";  // default chunks table name
  private db!: lancedb.Connection;
  private tokensTable!: lancedb.Table;
  private chunksTable!: lancedb.Table;


  /**
   * Initialize database and recreate both tables from scratch.
   * This drops existing tables and creates fresh ones.
   */
  async init(): Promise<void> {
    this.db = await lancedb.connect(this.dbPath);
    const tableNames = await this.db.tableNames();

    // Drop and recreate tokens table
    if (tableNames.includes(this.tokensTableName)) {
      await this.db.dropTable(this.tokensTableName);
    }

    const bootstrapToken: TokenRow = {
      id: "init-token",
      text: "initialization",
      vector: Array(384).fill(0),
      chunk: "",
      chunk_id: "init-chunk",
      weight: 0,
    };

    this.tokensTable = await this.db.createTable(
      this.tokensTableName,
      [TokenRowSchema.parse(bootstrapToken)]
    );
    await this.tokensTable.delete("id = 'init-token'");

    // Drop and recreate chunks table
    if (tableNames.includes(this.chunksTableName)) {
      await this.db.dropTable(this.chunksTableName);
    }

    const bootstrapChunk: ChunkRow = {
      id: "init-chunk",
      document_id: "init-doc",
      text: "initialization",
      vector: Array(384).fill(0),
      keywords: "[]",
    };

    this.chunksTable = await this.db.createTable(
      this.chunksTableName,
      [ChunkRowSchema.parse(bootstrapChunk)]
    );
    await this.chunksTable.delete("id = 'init-chunk'");
  }

  // ==========================================================================
  // Token Operations
  // ==========================================================================

  /**
   * Add token (keyphrase) rows to the database.
   * 
   * Example usage:
   *   const chunkText = "A doctor treats patients at the clinic.";
   *   const chunkId = sha1Id(chunkText);
   *   const keywords = [
   *     { item: "doctor", weight: 0.9 },
   *     { item: "patients", weight: 0.7 },
   *     { item: "clinic", weight: 0.8 }
   *   ];
   *   
   *   const tokenRows: TokenRowInput[] = keywords.map(k => ({
   *     id: sha1Id(`${k.item}||${chunkId}`),
   *     text: k.item,
   *     chunk: chunkText,
   *     chunk_id: chunkId,
   *     weight: k.weight
   *   }));
   *   
   *   await db.addTokens(tokenRows);
   */
  async addTokens(rows: TokenRowInput[]): Promise<number> {
    if (!rows?.length) return 0;

    // Validate input
    const validatedRows = rows.map(row => TokenRowInputSchema.parse(row));

    const processedRows: TokenRow[] = [];

    for (const row of validatedRows) {
      const normalizedText = row.text.toLowerCase();
      const embedding = await LLMs.embed(normalizedText);
      const normalizedVector = l2Normalize(embedding);

      const tokenRow: TokenRow = {
        id: row.id,
        text: normalizedText,
        vector: normalizedVector,
        chunk: row.chunk,
        chunk_id: row.chunk_id,
        weight: row.weight,
      };

      processedRows.push(TokenRowSchema.parse(tokenRow));
    }

    await this.tokensTable.add(processedRows);
    return processedRows.length;
  }

  /**
   * Search tokens directly (useful for term-level analytics).
   */
  async searchTokens(query: string, topK: number): Promise<TokenRow[]> {
    const queryEmbedding = await LLMs.embed(query.toLowerCase());
    const normalizedQuery = l2Normalize(queryEmbedding);

    const search = this.tokensTable.vectorSearch(normalizedQuery).limit(topK);
    const results = await search.toArray();
    return results.map(row => TokenRowSchema.parse(row));
  }

  // ==========================================================================
  // Chunk Operations
  // ==========================================================================

  /**
   * Add a chunk by averaging its keyword embeddings.
   * Always writes token rows for analytics/explainability.
   * 
   * Example usage:
   *   const chunkText = "A doctor treats patients at the clinic.";
   *   const chunkId = sha1Id(chunkText);
   *   const documentId = "doc-123";
   *   const keywords: Keyword[] = [
   *     { item: "doctor", weight: 0.9 },
   *     { item: "patients", weight: 0.7 },
   *     { item: "clinic", weight: 0.8 },
   *   ];
   *   
   *   await db.addChunkFromKeywords({
   *     chunk_id: chunkId,
   *     document_id: documentId,
   *     text: chunkText,
   *     keywords,
   *   });
   */
  async addChunkFromKeywords(args: AddChunkFromKeywordsArgs): Promise<number> {
    const validatedArgs = AddChunkFromKeywordsArgsSchema.parse(args);
    const { chunk_id, document_id, text } = validatedArgs;

    // Normalize keywords
    const normalizedKeywords = validatedArgs.keywords.map((k) => ({
      item: k.item.toLowerCase(),
      weight: k.weight,
    }));

    // Embed each keyword and compute weighted mean
    const vectors: number[][] = [];
    const weights: number[] = [];

    for (const keyword of normalizedKeywords) {
      const embedding = await LLMs.embed(keyword.item);
      const normalizedEmbedding = l2Normalize(embedding);
      vectors.push(normalizedEmbedding);
      weights.push(keyword.weight);
    }

    const meanVector = weightedMean(vectors, weights);
    const chunkVector = l2Normalize(meanVector);

    // Write chunk row
    const chunkRow: ChunkRow = {
      id: chunk_id,
      document_id,
      text,
      vector: chunkVector,
      keywords: JSON.stringify(normalizedKeywords),
    };

    const validatedChunkRow = ChunkRowSchema.parse(chunkRow);
    await this.chunksTable.add([validatedChunkRow]);

    // Persist token rows for analytics/explainability
    const tokenRows: TokenRowInput[] = normalizedKeywords.map((k) => ({
      id: sha1Id(`${k.item}||${chunk_id}`),
      text: k.item,
      chunk: text,
      chunk_id,
      weight: k.weight,
    }));

    await this.addTokens(tokenRows);

    return 1;
  }

  /**
   * Vector search over chunks (primary retrieval method).
   * 
   * Example usage:
   *   const query = "physician for asthma";
   *   const topK = 5;
   *   const results = await db.searchChunks(query, topK);
   *   
   *   // results contain: id, text, document_id, vector, keywords
   *   for (const hit of results) {
   *     console.log(hit.text);
   *     const keywords = JSON.parse(hit.keywords);
   *     console.log("Keywords:", keywords);
   *   }
   */
  async searchChunks(keyWords: keywordsArrayType, topK: number): Promise<ChunkRow[]> { 

    // ==========================================================================
    // Literal query direction v̂(q)
    // ==========================================================================
    const literalTermEmbeddings: number[][] = []; // v̂(q) inputs
    for (const kw of keyWords) {
      const emb = await LLMs.embed(kw.item);
      literalTermEmbeddings.push(emb);
    }
    const sumLiteralVec = literalTermEmbeddings.reduce((acc, vec) => acc.map((val, i) => val + vec[i]));
    const normSumLiteralVec = Math.sqrt(sumLiteralVec.reduce((acc, v) => acc + v * v, 0));
    const vhatDirectionVector = sumLiteralVec.map(v => v / (normSumLiteralVec + 1e-9)); // v̂(q)

    // ==========================================================================
    // Expanded query direction v̄(q)
    // ==========================================================================
    // merge literal + expanded, normalize items, dedupe by item (keep max weight)
    const expandedKeywordsRaw: keywordsArrayType =
      await LLMs.expandItemsAndWeights(keyWords.map(k => k.item));

    const mergedExpandedKeywords: keywordsArrayType = [
      ...keyWords,
      ...expandedKeywordsRaw.map(k => ({ item: k.item.toLowerCase(), weight: k.weight })),
    ];
const deDuplicationMap: Record<string, { item: string; weight: number }> = Object.create(null);
    // keep the maximum weight for duplicates from both.
    for (const k of mergedExpandedKeywords) {
      const key = k.item.toLowerCase();
      const prev = deDuplicationMap[key];
      // Keep whichever has the larger weight
      if (!prev || k.weight > prev.weight) {
        deDuplicationMap[key] = { item: key, weight: k.weight };
      }
    }

    // Convert the map back into an array
    const uniqueExpandedKeywords: keywordsArrayType = Object.values(deDuplicationMap);


    // embed expanded terms and collect weights
    const expandedEmbeddings: number[][] = [];
    const expandedWeights: number[] = [];
    for (const kw of uniqueExpandedKeywords) {
      const emb = await LLMs.embed(kw.item);
      expandedEmbeddings.push(emb);
      expandedWeights.push(kw.weight);
    }

    // weighted mean → normalize to get v̄(q)
    const vbarWeightedMean = weightedMean(expandedEmbeddings, expandedWeights);
    const normVbarWeightedMean = Math.sqrt(vbarWeightedMean.reduce((acc, v) => acc + v * v, 0));
    const vbarDirectionVector = vbarWeightedMean.map(v => v / (normVbarWeightedMean + 1e-9)); // v̄(q)

    // ==========================================================================
    // Blended query vector v*(q) = 0.5·v̂(q) + 0.5·v̄(q)  (λ = 0.5)
    // ==========================================================================
    const vStarBlended = vhatDirectionVector.map((v, i) => 0.5 * v + 0.5 * vbarDirectionVector[i]); // v*(q)
    const normVStar = Math.sqrt(vStarBlended.reduce((acc, v) => acc + v * v, 0));
    const vStarDirectionVector = vStarBlended.map(v => v / (normVStar + 1e-9)); // normalized v*(q)

    // ==========================================================================
    // Search chunks with the final query vector
    // ==========================================================================
    const search = this.chunksTable.vectorSearch(vStarDirectionVector).limit(topK);
    const results = await search.toArray();

    return results.map((row: any) => {
      // Coerce vector -> number[]
      const vectorArray: number[] = Array.isArray(row.vector)
        ? row.vector
        : Array.from(row.vector ?? []); // handles Float32Array / Arrow Vector

      // Coerce keywords -> string (your schema expects a string)
      const keywordsStr: string =
        typeof row.keywords === "string"
          ? row.keywords
          : JSON.stringify(row.keywords ?? []);

      // Ensure text/document_id are strings (defensive)
      const textStr = String(row.text ?? "");
      const docIdStr = String(row.document_id ?? "");

      // Now validate against Zod
      return ChunkRowSchema.parse({
        ...row,
        vector: vectorArray,
        keywords: keywordsStr,
        text: textStr,
        document_id: docIdStr,
      });
    });

  }

  // ==========================================================================
  // Maintenance & Utility Methods
  // ==========================================================================

  async countTokens(): Promise<number> {
    return await this.tokensTable.countRows();
  }

  async countChunks(): Promise<number> {
    return await this.chunksTable.countRows();
  }

  async deleteTokenById(id: string): Promise<void> {
    await this.tokensTable.delete(`id = '${id}'`);
  }

  async deleteChunkById(id: string): Promise<void> {
    await this.chunksTable.delete(`id = '${id}'`);
  }
}

// ============================================================================
// Quick Reference
// ============================================================================
//
// Ingestion flow (keywords → chunk vector):
//
//   const db = new VectorDB("./mydb", "tokens", "chunks");
//   await db.init(); // drops and recreates tables
//
//   const chunkText = "A doctor treats patients at the clinic.";
//   const chunkId = sha1Id(chunkText);
//   const docId = "doc-123";
//   const keywords: Keyword[] = [
//     { item: "doctor", weight: 0.9 },
//     { item: "patients", weight: 0.7 },
//     { item: "clinic", weight: 0.8 },
//   ];
//
//   await db.addChunkFromKeywords({
//     chunk_id: chunkId,
//     document_id: docId,
//     text: chunkText,
//     keywords,
//   });
//
// Retrieval flow (semantic):
//
//   const query = "physician for asthma";
//   const topK = 5;
//   const hits = await db.searchChunks(query, topK);
//   
//   // Display results and explain via keywords
//   for (const hit of hits) {
//     console.log(hit.text);
//     const keywords = JSON.parse(hit.keywords);
//     console.log("Relevant keywords:", keywords);
//   }
//
// Notes:
// • LLMs.embed is expected to return 384-dim vectors (like MiniLM). Adjust if using a different model.
// • We L2-normalize both query and stored vectors so dot product = cosine similarity.
// • For hybrid search (BM25 + vectors), run BM25 in parallel and combine scores in your app layer.
// • All inputs are validated using Zod schemas for type safety at runtime.
// • init() always recreates tables from scratch, dropping any existing data.