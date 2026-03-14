
import { GoogleGenAI, Type } from "@google/genai";
import { Language, Question } from "../types";

const LANGUAGE_NAMES = {
  am: "Amharic (አማርኛ)",
  om: "Afan Oromo (Oromoo)",
  en: "English"
};

export const askTutor = async (question: string, language: Language = 'en', context?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: ${context || 'General Education'}\nQuestion: ${question}`,
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
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Extract all multiple-choice questions from this document. Return them in the specified JSON format. Ensure you extract the options, the correct answer index (0-3), points per question, and a category for each question."
          }
        ]
      },
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
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Generate ${count} questions for Subject: ${subject}, Topic: ${topic}. 
      Difficulty Level: ${difficulty}. 
      Question Formats: ${questionTypes.join(', ')}.
      
      Rules:
      1. For 'multiple-choice', provide 4 options and a correctAnswer index (0-3).
      2. For 'true-false', provide 2 options ["True", "False"] and a correctAnswer index (0 or 1).
      3. For 'fill-in-the-blank', options should be an empty array and correctAnswer should be the exact string answer.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING, description: "One of: multiple-choice, true-false, fill-in-the-blank" },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING, description: "Index (as string) for MC/TF, or the word for fill-in-the-blank" },
              points: { type: Type.INTEGER },
              category: { type: Type.STRING }
            },
            required: ["text", "type", "options", "correctAnswer", "points", "category"]
          }
        }
      }
    });
    
    const parsed = JSON.parse(response.text || "[]");
    // Ensure correctAnswer is number if it's MC or TF
    return parsed.map((q: any) => ({
      ...q,
      correctAnswer: (q.type === 'fill-in-the-blank') ? q.correctAnswer : parseInt(q.correctAnswer)
    }));
  } catch (error) { 
    console.error("Generation Error:", error);
    return []; 
  }
};

export const findNearbyColleges = async (lat: number, lng: number, type: 'TVET' | 'High School' = 'TVET') => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `List 5 prominent ${type} institutions near lat: ${lat}, lng: ${lng}.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
      }
    });
    return {
      text: response.text,
      places: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.maps?.title || "Educational Institution",
        uri: chunk.maps?.uri || "#",
        snippet: chunk.maps?.placeAnswerSources?.[0]?.reviewSnippets?.[0] || ""
      })) || []
    };
  } catch (error) { return null; }
};
