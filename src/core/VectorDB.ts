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

  /** Initialize database, drop existing table, recreate, and load embedding pipeline */
  async init() {
    this.db = await lancedb.connect(this.dbPath);

    // Drop table if it exists
    const tableNames = await this.db.tableNames();
    if (tableNames.includes(this.tableName)) {
      await this.db.dropTable(this.tableName);
    }

    // Create a fresh table
    this.table = await this.db.createTable(this.tableName, [
      {
        id: "init",
        text: "initialization",
        vector: Array.from({ length: 384 }, () => 0),
        chunk: "",
      },
    ]);
    await this.table.delete("id = 'init'");

    // Initialize embedding pipeline
    const pipe: FeatureExtractionPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    this.embedFn = async (text: string): Promise<number[]> => {
      const out = await pipe(text, { pooling: "mean", normalize: true });
      return Array.from(out.data as Float32Array);
    };
  }

  /** Drop the table completely */
  async drop(): Promise<void> {
    await this.db.dropTable(this.tableName);
  }

  /** Add documents with automatic embeddings */
  async addToken(tokens: { id: string; text: string; chunk?: string }[]) {
    if (!tokens?.length) return 0;

    const vectors = await Promise.all(
      tokens.map(async (t) => ({
        id: t.id,
        text: t.text,
        vector: await this.embedFn(t.text),
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
    return await this.table.countRows();
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
