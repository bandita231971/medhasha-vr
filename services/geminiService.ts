import { GoogleGenAI } from "@google/genai";
import { SessionStats, ExerciseType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCoachingTip = async (
  exercise: ExerciseType,
  stats: SessionStats
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      You are a gentle, patient, and encouraging medical rehabilitation assistant named "MEDHASHA".
      The user is an elderly person or a patient recovering from neurological issues.
      Current Exercise: ${exercise}.
      Reps completed: ${stats.reps}.
      
      Provide a very short, kind, and clear encouragement.
      Focus on "slow movement", "breathing", and "doing your best".
      Avoid high-energy fitness slang. Use soothing language.
      Max 10 words.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Take your time. Breathe deeply.";
  }
};

export const generateWorkoutSummary = async (
  exercise: ExerciseType,
  stats: SessionStats
): Promise<string> => {
   try {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      The user is an elderly/neuro patient who just finished a therapy session of ${exercise}.
      Stats: ${stats.reps} repetitions performed.
      Stability Score: ${Math.round(stats.accuracy)}%.
      
      Write a 2-sentence summary. Be extremely positive, validating their effort regardless of the numbers.
      Mention that consistent movement is key to recovery.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Session Complete. Wonderful effort today. Rest well.";
  }
}