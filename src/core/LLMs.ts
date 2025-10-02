// src/extractKeyphrases.ts
import "dotenv/config";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";
import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";
import { keywordsArraySchema, keywordsArrayType } from "./VectorDB";

export class LLMs {
  // ---- static singletons ----
  private static chatOpenAI: ChatOpenAI | null = null;
  private static chatOllama: ChatOllama | null = null; // optional; pick one
  private static embedPipe: FeatureExtractionPipeline | null = null;

  // choose which chat to use; here we default to OpenAI
  private static get chat() {
    if (!this.chatOpenAI) {
      this.chatOpenAI = new ChatOpenAI({
        model: "gpt-5-nano",
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.chatOpenAI;
  }

  private static async getEmbedPipe(): Promise<FeatureExtractionPipeline> {
    if (!this.embedPipe) {
      this.embedPipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    return this.embedPipe;
  }

  // ---------------------------
  // STATIC METHODS
  // ---------------------------

  // input: "Dog is an animal"
  // output: [{ item: "dog", weight: 0.9 }, { item: "animal", weight: 0.8 }]
  static async extractItemsAndWeights(text: string): Promise<keywordsArrayType> {
    const prompt = ChatPromptTemplate.fromTemplate(`
      You are an expert at extracting keyphrases from text.
      Return ONLY a valid JSON array of objects, each with:
      - "item": string (non-empty)
      - "weight": number in [0,1] 
      - no explanations, no prose, no code fences
      - single words only
      Do not include any prose or extra keys.
      Text:
      {input_text}`);

    const formatted = await prompt.format({ input_text: text });
    const msg = await this.chat.invoke(formatted);

    const jsonParser = new JsonOutputParser<any>();
    const raw = await jsonParser.parse(String(msg.content));
    return keywordsArraySchema.parse(raw);
  }

  // input: ["dog","animal"]
  // output: [{ item:"canine", weight:0.85 }, ...]
  static async expandItemsAndWeights(items: string[]): Promise<keywordsArrayType> {
    const prompt = ChatPromptTemplate.fromTemplate(`
      You are an expert at expanding keyphrases.
      Given the following items: {items}
      Return ONLY a valid JSON array of objects, each with:
      - "item": string (non-empty)
      - "weight": number in [0,1] 
      - no explanations, no prose, no code fences
      - single words only
      - you may return at least 3 new synonyms or related terms
      - do not return the original items
      Do not include any prose or extra keys.`);

    const formatted = await prompt.format({ items });
    const msg = await this.chat.invoke(formatted);

    const jsonParser = new JsonOutputParser<any>();
    const raw = await jsonParser.parse(String(msg.content));
    return keywordsArraySchema.parse(raw);
  }

  // embedder used by VectorDB
  static async embed(text: string): Promise<number[]> {
    const pipe = await this.getEmbedPipe();
    const out = await pipe(text, { pooling: "mean", normalize: true });
    return Array.from(out.data as Float32Array);
  }
}
