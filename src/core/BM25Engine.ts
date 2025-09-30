// src/core/BM25Engine.ts
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bm25 = require('wink-bm25-text-search')();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nlp = require('wink-nlp-utils');

export class BM25Engine {
  private docs: { body: string }[] = [];
  private consolidated = false;

  constructor() {
    // 1) Define config FIRST
    bm25.defineConfig({
      fldWeights: { body: 1 },
      bm25Params: { k1: 1.2, b: 0.75 }
    });

    // 2a) Field-specific prep for 'body' (used on documents)
    bm25.definePrepTasks(
      [
        nlp.string.lowerCase,
        nlp.string.removeExtraSpaces,
        nlp.string.tokenize0,
        nlp.tokens.removeWords, // ok with default stopwords
        nlp.tokens.stem
      ],
      'body'
    );

    // 2b) DEFAULT prep (used on queries in bm25.search)
    bm25.definePrepTasks([
      nlp.string.lowerCase,
      nlp.string.removeExtraSpaces,
      nlp.string.tokenize0,
      nlp.tokens.removeWords,
      nlp.tokens.stem
    ]);
  }

  add(text: string): number {
    const id = this.docs.length;
    const doc = { body: text };
    this.docs.push(doc);
    bm25.addDoc(doc, id);
    this.consolidated = false;
    return id;
  }

  private consolidateIfReady(): void {
    if (this.consolidated) return;
    if (this.docs.length < 3) return;     // wink prefers a few docs before building
    bm25.consolidate();
    this.consolidated = true;
  }

  search(query: string, topK = 5): { id: number; score: number; body: string }[] {
    if (this.docs.length < 3) {
      console.log(`[BM25] Add at least 3 docs before searching. Currently: ${this.docs.length}.`);
      return [];
    }
    this.consolidateIfReady();
    const hits: [number, number][] = bm25.search(query).slice(0, topK);
    return hits.map(([docId, score]) => ({
      id: docId,
      score,
      body: this.docs[docId].body
    }));
  }

  count(): number {
    return this.docs.length;
  }
}
