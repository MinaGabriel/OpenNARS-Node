// src/extractKeyphrases.ts
import "dotenv/config";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";

//Schema Definitions:
const itemsAndWeightsArraySchema = z.array(
    z.object({ 
        item: z.string().min(1), 
        weight: z.number().min(0).max(1) 
    })).min(1);
export type itemsAndWeightsArrayType = z.infer<typeof itemsAndWeightsArraySchema>;

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
    // input Example: Dog is an animal 
    // output Example: [ { item: 'dog', weight: 0.9 }, { item: 'animal', weight: 0.8 } ]
    //Math: T(q)  or P(x) for query and chuncks respectively
    async extractItemsAndWeights(text: string): Promise<itemsAndWeightsArrayType> { 
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
        const validated = itemsAndWeightsArraySchema.parse(raw); 
        return validated;  
    }

    // Input Example: [ { item: 'dog', weight: 0.9 }, { item: 'animal', weight: 0.8 } ]
    // output Example: [ { item: 'canine', weight: 0.85 }, { item: 'pet', weight: 0.75 }, { item: 'mammal', weight: 0.8 } ]
    // Math E(T(q)) or E(P(x)) for query and chuncks respectively
    async expandItemsAndWeights(items: string[]): Promise<itemsAndWeightsArrayType> {  
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
            Do not include any explanations, no prose, no code fences.
            Do not include any prose or extra keys. 
            Text:
            {input_text}`);

        const formatted = await prompt.format({ items, input_text: items }); 
        const msg = await this.chat.invoke(formatted);
        const jsonParser = new JsonOutputParser<any>(); 
        const raw = await jsonParser.parse(String(msg.content));  
        const validated = itemsAndWeightsArraySchema.parse(raw); 
        return validated;  
    }

}




