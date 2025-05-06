
import {genkit} from 'genkit';
 import {googleAI} from '@genkit-ai/googleai';
// import {openai} from 'genkitx-openai'; // Removed OpenAI plugin

 export const ai = genkit({
   promptDir: './prompts', // Adjust if your prompts directory is different
   plugins: [
     googleAI({
       // Ensure GEMINI_API_KEY is set in your environment variables
       apiKey: process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE", // Added fallback for safety
       apiVersion: "v1beta" // Explicitly using v1beta for stability if needed
     }),
    //  openai({ // Removed OpenAI plugin configuration
    //    apiKey: process.env.OPENAI_API_KEY, // Requires OPENAI_API_KEY env var
    //  }),
   ],
   logLevel: 'debug', // Optional: for more detailed logs during development
   flowStateStore: 'firebase', // Example: configure flow state storage if needed
   traceStore: 'firebase',      // Example: configure trace storage if needed
 });
