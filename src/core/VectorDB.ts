// LanceDB.ts
import * as lancedb from "@lancedb/lancedb";
import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";

export class VectorDB {
  private dbPath: string;
  private tableName: string;
  private embedFn!: (text: string) => Promise<number[]>;
  private db!: lancedb.Connection;
  private table!: lancedb.Table;

  constructor(dbPath = "./mydb", tableName = "tokens") {
    this.dbPath = dbPath;
    this.tableName = tableName;
  }

  /** Initialize database, table, and embedding pipeline */
  async init() {
    this.db = await lancedb.connect(this.dbPath);

    const tableNames = await this.db.tableNames();
    if (tableNames.includes(this.tableName)) {
      this.table = await this.db.openTable(this.tableName);
    } else {
      // ⬇️ use non-nullable values so schema infers cleanly
      this.table = await this.db.createTable(this.tableName, [
        {
          id: "init",
          text: "initialization",
          // keep it numeric; Float32Array also works if you prefer
          vector: Array.from({ length: 384 }, () => 0),
          chunk: "",           // ⬅️ IMPORTANT: not null, infer Utf8
        },
      ]);
      await this.table.delete("id = 'init'");
    }

    // embedding pipeline...
    const pipe: FeatureExtractionPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    this.embedFn = async (text: string): Promise<number[]> => {
      const out = await pipe(text, { pooling: "mean", normalize: true });
      return Array.from(out.data as Float32Array);
    }; 
  }

  /** Add documents with automatic embeddings */
  async addToken(tokens: { id: string; text: string; chunk?: string }[]) { 
    if (!tokens?.length) return 0;

    const vectors = await Promise.all(
      tokens.map(async (t) => ({
        id: t.id,
        text: t.text,
        vector: await this!.embedFn!(t.text),
        chunk: t.chunk ?? "",
      }))
    );

    await this.table.add(vectors);
    return vectors.length;
  }

  /** Semantic search with optional metadata filter */
  async search(query: string, topK = 3, chunkFilter?: string) {
    const qvec = await this.embedFn(query);
    let search = this.table.vectorSearch(qvec).limit(topK);
    
    if (chunkFilter) {
      search = search.where(`chunk = '${chunkFilter}'`);
    }
    
    return await search.toArray();
  }

  /** Get total number of records */
  async count(): Promise<number> {
    const result = await this.table.countRows();
    return result;
  }

  /** Delete records by ID */
  async deleteById(id: string): Promise<void> {
    await this.table.delete(`id = '${id}'`);
  }

  /** Close the database connection */
  async close(): Promise<void> {
    // LanceDB connections are automatically managed
  }
}