
import { GoogleGenAI, Type } from "@google/genai";
import { Language, Question } from "../types";
import * as mammoth from "mammoth";

const LANGUAGE_NAMES = {
  am: "Amharic (አማርኛ)",
  om: "Afan Oromo (Oromoo)",
  en: "English"
};

export const askTutor = async (
  question: string, 
  language: Language = 'en', 
  context?: string,
  attachment?: { data: string, mimeType: string }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
  try {
    const parts: any[] = [
      { text: context ? `Document/Context:\n${context}\n\nQuestion: ${question}` : `Context: General Education\nQuestion: ${question}` }
    ];
    
    if (attachment) {
      if (attachment.mimeType === 'application/msword') {
        throw new Error("Unsupported MIME type: application/msword. Please convert .doc files to .docx or .pdf.");
      }
      if (attachment.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const binaryString = atob(attachment.data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
        parts.push({ text: `Attached Document Content:\n${result.value}` });
      } else {
        parts.push({
          inlineData: {
            data: attachment.data,
            mimeType: attachment.mimeType
          }
        });
      }
    }

    const response = await ai.models.generateContent({
      model: attachment ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: `You are IFTU AI, the official digital tutor for the Ethiopian National Curriculum (EAES Standards). 
        You MUST support the following languages: English, Amharic, and Afan Oromo.
        The student is currently using ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES] || 'English'}.`,
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, the connection to the National AI Lab was interrupted.";
  }
};

/**
 * Parses questions directly from a document (PDF or DOCX) using Gemini's multi-modal capabilities.
 */
export const parseExamFromDocument = async (base64Data: string, mimeType: string): Promise<Partial<Question>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
  try {
    let parts: any[] = [];

    if (mimeType === 'application/msword') {
      throw new Error("Unsupported MIME type: application/msword. Please convert .doc files to .docx or .pdf.");
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
      parts = [
        { text: result.value },
        { text: "Extract all multiple-choice questions from this document text. Return them in the specified JSON format. Ensure you extract the options, the correct answer index (0-3), points per question, and a category for each question." }
      ];
    } else {
      parts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        {
          text: "Extract all multiple-choice questions from this document. Return them in the specified JSON format. Ensure you extract the options, the correct answer index (0-3), points per question, and a category for each question."
        }
      ];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
              points: { type: Type.INTEGER },
              category: { type: Type.STRING }
            },
            required: ["text", "options", "correctAnswer", "points", "category"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Document Parsing Error:", error);
    return [];
  }
};

export const getRegionalIntelligence = async (region: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a detailed educational status report for the region of ${region}, Ethiopia. Include mapping of 3 major TVET hubs and secondary school density metrics.`,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
      }
    });
    
    const insights = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text,
      mapData: insights
    };
  } catch (error) {
    console.error("Intelligence Error:", error);
    return null;
  }
};

export const fetchLatestEducationNews = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "What are the latest news updates from the Ethiopian Ministry of Education (MoE) regarding national exams and TVET for 2025?",
      config: { tools: [{ googleSearch: {} }] }
    });
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Official Update",
        uri: chunk.web?.uri || "#"
      })) || []
    };
  } catch (error) { return null; }
};

export const getLessonDeepDive = async (text: string, type: 'simpler' | 'advanced', language: Language = 'en') => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
  const prompt = type === 'simpler' ? `Simpler explanation of: ${text}` : `Advanced technical context for: ${text}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction: `Explain in ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES] || 'English'}.` }
    });
    return response.text;
  } catch (error) { return "Deep dive failed."; }
};

export const parseExamDocument = async (text: string): Promise<Partial<Question>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Extract multiple-choice questions from: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER },
              points: { type: Type.INTEGER },
              category: { type: Type.STRING }
            },
            required: ["text", "options", "correctAnswer", "points", "category"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) { return []; }
};

export const generateExamQuestions = async (
  subject: string, 
  topic: string, 
  difficulty: string, 
  questionTypes: string[],
  count: number = 5
): Promise<Partial<Question>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Generate ${count} high-quality educational questions for Subject: ${subject}, Topic: ${topic}. 
      Difficulty Level: ${difficulty}. 
      Question Formats to include: ${questionTypes.join(', ')}.
      
      Strict Rules for Question Types:
      1. 'multiple-choice': Provide exactly 4 distinct options. 'correctAnswer' MUST be the index (0, 1, 2, or 3) of the correct option.
      2. 'true-false': Provide exactly 2 options: ["True", "False"]. 'correctAnswer' MUST be 0 for True or 1 for False.
      3. 'fill-in-the-blank': 'options' MUST be an empty array []. 'correctAnswer' MUST be the exact string of the correct word or phrase.
      4. 'short-answer': 'options' MUST be an empty array []. 'correctAnswer' MUST be a concise model answer string.
      
      Each question must have:
      - 'text': The question prompt.
      - 'type': Exactly one of the requested formats.
      - 'points': An appropriate integer value (e.g., 2, 5, or 10).
      - 'category': A specific sub-topic or skill area (e.g., "Mechanics", "Grammar", "Logic").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING, description: "One of: multiple-choice, true-false, fill-in-the-blank, short-answer" },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING, description: "Index (0-3) as string for MC/TF, or the answer text for others" },
              points: { type: Type.INTEGER },
              category: { type: Type.STRING }
            },
            required: ["text", "type", "options", "correctAnswer", "points", "category"]
          }
        }
      }
    });
    
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((q: any) => {
      // Normalize correctAnswer based on type
      let normalizedAnswer: string | number = q.correctAnswer;
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        normalizedAnswer = parseInt(q.correctAnswer);
        if (isNaN(normalizedAnswer)) normalizedAnswer = 0; // Fallback
      }
      
      return {
        ...q,
        correctAnswer: normalizedAnswer
      };
    });
  } catch (error) { 
    console.error("Generation Error:", error);
    return []; 
  }
};

export const findNearbyColleges = async (lat: number, lng: number, type: 'TVET' | 'High School' = 'TVET') => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.error('Gemini API key is not defined. Set NEXT_PUBLIC_GEMINI_API_KEY or GEMINI_API_KEY.');
    return { text: 'API key not available', places: [] };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `List 5 prominent ${type} institutions near lat: ${lat}, lng: ${lng}.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const places = Array.isArray(chunks)
      ? chunks.map((chunk: any) => ({
          title: chunk.maps?.title || 'Educational Institution',
          uri: chunk.maps?.uri || '#',
          snippet: chunk.maps?.placeAnswerSources?.[0]?.reviewSnippets?.[0] || ''
        }))
      : [];

    return {
      text: response.text || '',
      places
    };
  } catch (error) {
    console.error('findNearbyColleges error:', error);
    return { text: 'Could not retrieve nearby institutions', places: [] };
  }
};

export const getSovereignInsights = async (data: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following educational data and provide 3-5 strategic "Sovereign Insights" for the school administrator. 
      Focus on student performance, course engagement, and resource allocation.
      Data: ${JSON.stringify(data)}
      
      Format the response as a JSON array of objects with 'title', 'insight', and 'impact' (High/Medium/Low).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              insight: { type: Type.STRING },
              impact: { type: Type.STRING }
            },
            required: ["title", "insight", "impact"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Insights Error:", error);
    return [];
  }
};
