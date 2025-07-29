import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/db';
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

const systemInstructions = `
You are a expert venture capitalist with experience of 10+ years. 

Do smart analysis, deep research and modern calculations based of relevancy of the project, future scope and potential impact with respect to the following categories:
Vertical AI, Market Size, Founder Analysis, and VC Analysis.

You will be given a startup pitch. Your job is to extract the following structured JSON format from the pitch only based on what is explicitly mentioned. Do not assume, hallucinate, or invent any information not present in the pitch. If data is missing, use null or empty strings or 0.

Example Pitch:
"""${examplePitch}"""


Return only a valid JSON object:
{
  founderAnalysis: {
    names: [...],
    background: "...",
    credibility: 0-10,
    assessment: "..."
  },
  marketSize: {
    tam: "...",
    sam: "...",
    som: "...",
    growth: "...",
    assessment: "..."
  },
  aiVertical: {
    connection: "...",
    strength: 0-10,
    opportunities: [...],
    assessment: "..."
  },
  vcAnalysis: {
    pros: [...],
    cons: [...],
    rating: 0-10,
    recommendation: "...",
    fundingStage: "...",
    suggestedAmount: "..."
  }
}
`;

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
    const analysis: PitchAnalysis = JSON.parse(jsonText);

    await prisma.pitch.create({
      data: {
        content: pitch,
        analysis: analysis as any, 
      },
    });

    return analysis;
   
  } catch (error) {
    console.error('Gemini JSON parsing error:', error);
    throw new Error('Failed to parse Gemini response.');
  }
}
