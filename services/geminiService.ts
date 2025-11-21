import { GoogleGenAI } from "@google/genai";
import { Registration } from "../types";

// NOTE: Using the Gemini 2.5 Flash model for fast analysis of data
const MODEL_NAME = "gemini-2.5-flash";

export const analyzeAttendance = async (registrations: Registration[]): Promise<string> => {
  try {
    const apiKey = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return "⚠️ La API key de Gemini no está configurada. Agrega GEMINI_API_KEY o VITE_GEMINI_API_KEY en tu archivo .env.local";
    }
    const ai = new GoogleGenAI({ apiKey });

    // Prepare a minified version of data to save tokens, focusing on status and types
    const dataSummary = registrations.map(r => ({
      type: r.ticketType,
      status: r.status,
      name: r.name // Included for "VIP" recognition if needed
    }));

    const prompt = `
      Act as an Event Logistics Manager. Analyze the following registration data (JSON format).
      
      Data: ${JSON.stringify(dataSummary)}

      Please provide a brief, high-level strategic summary containing:
      1. Current validation rate (percentage of people inside vs pending).
      2. Breakdown by ticket type (VIP vs General vs Promo).
      3. A specific tip for the door staff based on the current flow (e.g., if many VIPs are pending, prepare the VIP lane).
      
      Keep the tone professional and encouraging. Output in Markdown.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error al conectar con el asistente de IA. Verifique su clave API.";
  }
};