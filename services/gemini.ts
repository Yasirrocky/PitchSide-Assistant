import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingChunk, DashboardData, LeagueTableRow, ScorerRow } from "../types";

const apiKey = process.env.API_KEY;
// Safe initialization
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export interface GeminiResponse {
  text: string;
  groundingChunks?: GroundingChunk[];
}

const SYSTEM_INSTRUCTION = "You are an expert football (soccer) analyst and researcher. You provide detailed, up-to-date information, statistics, and tactical analysis. When asked for tables or lists, format them as Markdown tables. Always use Google Search to get the latest data. Be concise but thorough.";

export const generateFootballContent = async (
  prompt: string, 
  customSystemInstruction?: string,
  useThinking: boolean = false
): Promise<GeminiResponse> => {
  if (!ai) {
    throw new Error("API Key not found. Please check your environment variables.");
  }

  const model = useThinking ? "gemini-3-pro-preview" : "gemini-2.5-flash";
  const config: any = {
    tools: [{ googleSearch: {} }],
    systemInstruction: customSystemInstruction || SYSTEM_INSTRUCTION,
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });

    const text = response.text || "No information found.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;

    return { text, groundingChunks };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// Streaming function for faster perceived latency
export const streamFootballContent = async (
  prompt: string,
  onChunk: (text: string, groundingChunks?: GroundingChunk[]) => void,
  useThinking: boolean = false
): Promise<void> => {
  if (!ai) {
    throw new Error("API Key not found.");
  }

  const model = useThinking ? "gemini-3-pro-preview" : "gemini-2.5-flash";
  const config: any = {
    tools: [{ googleSearch: {} }],
    systemInstruction: SYSTEM_INSTRUCTION,
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  try {
    const result = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config,
    });

    let fullText = "";
    
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      const newText = c.text || "";
      fullText += newText;
      
      const groundingChunks = c.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
      
      onChunk(fullText, groundingChunks);
    }
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
};

// Robust Helper to parse JSON from potentially messy model output
const extractJson = (text: string): any => {
  try {
    // 1. Remove markdown code blocks if present
    let cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    // 2. Attempt to find the outermost JSON array or object
    const firstOpenBrace = cleanText.indexOf("{");
    const firstOpenBracket = cleanText.indexOf("[");

    // If no JSON structure found, return empty
    if (firstOpenBrace === -1 && firstOpenBracket === -1) {
       console.warn("No JSON structure found in response");
       return [];
    }

    // Determine if it looks like an Object or Array starts first
    const isObject = firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket);
    
    let jsonString = cleanText;

    if (isObject) {
      const lastCloseBrace = cleanText.lastIndexOf("}");
      if (lastCloseBrace !== -1) {
        jsonString = cleanText.substring(firstOpenBrace, lastCloseBrace + 1);
      }
    } else {
      const lastCloseBracket = cleanText.lastIndexOf("]");
      if (lastCloseBracket !== -1) {
        jsonString = cleanText.substring(firstOpenBracket, lastCloseBracket + 1);
      }
    }

    return JSON.parse(jsonString);
  } catch (e) {
    console.error("JSON Parse failed, attempting fallback regex", e);
    // Fallback: Try to find a JSON array pattern using regex
    try {
      const match = text.match(/\[.*\]/s);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e2) {
      // Ignore
    }
    return [];
  }
}

// "Real Agency" API Simulation - Fetches structured dashboard data
export const fetchAgencyDashboardData = async (): Promise<DashboardData> => {
  if (!ai) throw new Error("API Key missing");

  const prompt = `
  You are the official data feed for "PitchSide". Fetch the latest football data using Google Search.
  
  OUTPUT INSTRUCTIONS:
  Return a valid JSON object. No markdown.
  
  JSON Structure:
  {
    "matches": [
      { "homeTeam": "Team A", "awayTeam": "Team B", "score": "2-1", "status": "LIVE/FT/UPCOMING", "league": "EPL", "minute": "45+2'" }
    ],
    "news": [
      { "title": "Headline", "summary": "Short summary", "category": "Transfer/Match", "imageSearchQuery": "search term", "timestamp": "2m ago" }
    ]
  }

  Requirements:
  1. "matches": 6-8 important matches happening TODAY. Prioritize LIVE games. Include minute for live games in score or status.
  2. "news": 6 trending global football news stories right now.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    return extractJson(response.text || "{}") as DashboardData;
  } catch (e) {
    console.error("Agency API Error", e);
    return { matches: [], news: [] };
  }
};

// Fetch Structured League Data (Table or Scorers)
export const fetchLeagueData = async (leagueName: string, type: 'table' | 'scorers'): Promise<any> => {
  if (!ai) throw new Error("API Key missing");

  let prompt = "";
  let jsonStructure = "";

  if (type === 'table') {
    prompt = `Get the CURRENT, LIVE standings table for ${leagueName}. Use Google Search.`;
    jsonStructure = `
    [
      { 
        "position": 1, 
        "team": "Team Name", 
        "played": 10, 
        "won": 8, 
        "drawn": 1, 
        "lost": 1, 
        "gd": 15, 
        "points": 25,
        "form": ["W", "W", "D", "L", "W"] 
      }
    ]
    `;
  } else {
    prompt = `Get the CURRENT top goal scorers for ${leagueName}. Use Google Search.`;
    jsonStructure = `
    [
      { 
        "rank": 1, 
        "player": "Name", 
        "team": "Team", 
        "goals": 10, 
        "matches": 12 
      }
    ]
    `;
  }

  const fullPrompt = `
  ${prompt}
  
  CRITICAL OUTPUT INSTRUCTIONS:
  1. Return ONLY valid, minified JSON.
  2. Do not include markdown formatting (like \`\`\`json).
  3. Do not include any conversational text.
  4. Ensure the JSON is a valid Array.
  5. For 'form', use an array of strings: "W", "D", "L". Last 5 matches only.

  Expected JSON Structure:
  ${jsonStructure}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    
    return extractJson(response.text || "[]");
  } catch (e) {
    console.error("League API Error", e);
    return [];
  }
};
