
import { GoogleGenAI } from "@google/genai";

export const refineNarration = async (text: string, additionalNotes: string) => {
  // Always initialize with the direct environment variable as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    I am an immigration consultant at Xpatweb. 
    Below is a standardized invoice narration. 
    I need to integrate some additional custom coordination details into this paragraph smoothly while maintaining the formal professional tone.
    
    ORIGINAL TEMPLATE:
    ${text}
    
    ADDITIONAL DETAILS TO INTEGRATE:
    ${additionalNotes}
    
    RULES:
    1. Keep the professional tone.
    2. Do NOT remove or modify the following exact sentence: "Fee does not include follow-up or escalation services which will be quoted for separately as required." It must appear exactly as is.
    3. Ensure the result is one coherent paragraph.
    4. Return ONLY the refined paragraph text.
  `;

  try {
    // Correct method: use ai.models.generateContent directly with required parameters
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Correct method: access .text property directly (not a method)
    return response.text || text;
  } catch (error) {
    console.error("Gemini Refinement Error:", error);
    return text;
  }
};
