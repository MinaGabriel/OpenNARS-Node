// src/extractKeyphrases.ts
import "dotenv/config";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";

export class LLMs {
    private chat: ChatOpenAI | ChatOllama; 

    constructor() {
        // Initialize chat model once
        
        this.chat = new ChatOpenAI({
            model: "gpt-5-nano", // or "gpt-4o", "gpt-4.1", 
            apiKey: process.env.OPENAI_API_KEY, // reads key from .env (OPENAI_API_KEY) 
        }); 

        // this.chat = new ChatOpenAI({
        //   model: "llama-4-scout",
        //   apiKey: process.env.JET_STREAM_API_KEY, // reads key from .env (JET_STREAM_API_KEY)
        //   configuration: {
        //     baseURL: "https://llm.jetstream-cloud.org/api",  
        //   },
        // });


        // this.chat = new ChatOllama({
        //   baseUrl: "http://192.168.68.157:11436",
        //   model: "qwen2.5:3b-instruct-q4_K_M",
        //   // temperature: 0,
        // });
 
    }

    async extractKeyphrases(text: string): Promise<Array<{ item: string; weight: number }>> {
        const KeyphraseArray = z.array(
            z.object({
                item: z.string().min(1, "keyphrase cannot be empty"),
                weight: z.number().min(0).max(1),
            })
        ).min(1); 
        const prompt = ChatPromptTemplate.fromTemplate(`
            You are an expert at extracting keyphrases from text.
            Return ONLY a valid JSON array of objects, each with:
            - "item": string (non-empty)5
            - "weight": number in [0,1] 
            - no explanations, no prose, no code fences
            - single words only
            Do not include any prose or extra keys. 
            Text:
            {input_text}`);

        const formatted = await prompt.format({ input_text: text }); 
        // --- Call model and parse JSON ---
        const msg = await this.chat.invoke(formatted);
        const jsonParser = new JsonOutputParser<any>(); // parse JSON as JS
        const raw = await jsonParser.parse(String(msg.content)); 
        // --- Validate with Zod (throws with a clear error if invalid) ---
        const validated = KeyphraseArray.parse(raw); 
        return validated; // strongly typed: { item: string; weight: number }[]
    }

}




