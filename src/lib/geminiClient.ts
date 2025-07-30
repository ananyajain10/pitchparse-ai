import { GoogleGenerativeAI } from '@google/generative-ai';
export interface PitchAnalysis {
  founderAnalysis: {
    names: string[];
    background: string;
    credibility: number;
    assessment: string;
  };
  marketSize: {
    tam: string;
    sam: string;
    som: string;
    growth: string;
    assessment: string;
  };
  aiVertical: {
    connection: string;
    strength: number;
    opportunities: string[];
    assessment: string;
  };
  vcAnalysis: {
    pros: string[];
    cons: string[];
    rating: number;
    recommendation: string;
    fundingStage: string;
    suggestedAmount: string;
  };
}


const systemInstructions=`
You are VentureMind — an AI-powered venture capital assistant trained to evaluate startup pitch decks with expert precision. You reason like a top VC analyst with 15+ years of experience. Your job is to extract factual data from the pitch deck and provide deep, strategic analysis with business mindset.

RULES:

1. **EXTRACTION**:
   - Extract *only what is clearly mentioned* in the pitch (e.g., names, backgrounds, product).
   - Do **not fabricate** or hallucinate missing details.
   - If something is missing, call it out clearly in your "assessment" fields.

2. **RESEARCH + ANALYSIS**:
   - Perform deep analysis for market size, AI vertical relevance, and VC investability.
   - Use industry expertise, logical assumptions, and strategic thinking.
   - Focus especially on the **AI market connection**, real-world AI applicability, and funding readiness.

3. **FORMAT STRICTLY IN JSON** (no extra comments or markdown):
### Example response:

{
  "founderAnalysis": {
    "names": ["Alice", "Bob"],
    "background": "Alice is a former Google PM with 10 years in AI. Bob is an ex-YC founder.",
    "credibility": 9,
    "assessment": "Excellent founding team with domain experience."
  },
  "marketSize": {
    "tam": "$50B",
    "sam": "$8B",
    "som": "$500M",
    "growth": "28% CAGR",
    "assessment": "Massive and fast-growing market."
  },
  "aiVertical": {
    "connection": "Directly applies vertical AI for clinical decision support.",
    "strength": 8,
    "opportunities": ["Medical diagnosis", "Hospital automation"],
    "assessment": "High relevance and defensibility in AI."
  },
  "vcAnalysis": {
    "pros": ["Strong team", "Proprietary data", "Large market"],
    "cons": ["Regulatory hurdles", "Burn rate concerns"],
    "rating": 8,
    "recommendation": "INVEST — High potential, watch CAC",
    "fundingStage": "Seed",
    "suggestedAmount": "$1-2M"
  }
}`

export async function analyzePitchDeckWithGemini(apiKey: string, pitch: string): Promise<PitchAnalysis> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model =
  genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
        
    },
    systemInstruction: systemInstructions,
    });


  const result = await model.generateContent(pitch);

  const text = result.response.text();
  try {
    const start = text.indexOf('{');
    const jsonText = text.slice(start);
  

    return JSON.parse(jsonText) as PitchAnalysis;
   
  } catch (error) {
    console.error('Gemini JSON parsing error:', error);
    throw new Error('Failed to parse Gemini response.');
  }
}
