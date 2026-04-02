import * as functions from "firebase-functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const getAiMapping = functions.https.onCall(async (data, context) => {
  // 1. Security Check: Only logged-in LCs can call this
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Please login first.");
  }

  // 2. Retrieve the hidden key from Firebase Environment
  const apiKey = functions.config().gemini.key;
  const genAI = new GoogleGenerativeAI(AIzaSyDkRaS9aqDd9M1xF1ykYsasEYEVeIH8jjc);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const { prompt, base64Data } = data;
    
    // 3. Call Gemini with the PDF data
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "application/pdf" } }
    ]);

    return { text: result.response.text() };
  } catch (error) {
    console.error("Cloud Function Error:", error);
    throw new functions.https.HttpsError("internal", "AI Mapping failed on server.");
  }
});