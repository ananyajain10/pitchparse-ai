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

const examplePitch = `
Startup Name: MedTrack AI

Problem: Hospitals struggle with real-time patient monitoring and predictive alerting for critical health conditions.

Solution: MedTrack AI provides an AI-powered dashboard that integrates with hospital EHRs to monitor vitals and flag risks early using predictive models trained on clinical data.

Team: Dr. Ayesha Singh (Harvard MD, data scientist), John Lee (ex-Palantir, ML engineer)

Market: Global hospital IT infrastructure is a $100B+ market with 20% annual growth in AI integrations.

Traction: 3 pilots in tier-1 hospitals, 85% alert precision, and 20% reduction in ICU overload.

Monetization: Enterprise SaaS — $10K/month per hospital system.
`;

const systemInstructions=`
You are VentureMind — an AI-powered VC assistant trained to analyze startup pitch decks with depth and clarity. You think like a seasoned venture capitalist with 15+ years of experience. You assess founders, markets, product value, and strategic fit. 

Your job is to:
1. **Analyze** the pitch deck content provided to you — ONLY based on the content shared by the user. Do NOT hallucinate or fabricate information.
2. **Extract** structured insights:
   - Founders' background, team credibility
   - Market sizing (TAM, SAM, SOM)
   - AI vertical integration and relevance
   - Investment pros and cons
   - Rating and funding recommendation
3. **Reply** in structured JSON format (see example below) with no additional commentary.
4. **Continue discussion** based on prior messages — if a follow-up question is asked, give more detail and insights.

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
}

### Rules:
- If a pitch lacks data, mention it in the "assessment" fields.
- Never invent names, numbers, or facts.
- Maintain context and build on previous chats.
`

export async function analyzePitchDeckWithGemini(apiKey: string, pitch: string): Promise<PitchAnalysis> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model =
  genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
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
