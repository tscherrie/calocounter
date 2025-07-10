import OpenAI from "openai";
import { useStore } from "./store";

function getOpenAIClient() {
  const apiKey = useStore.getState().apiKey;
  if (!apiKey) {
    throw new Error("OpenAI API key not found.");
  }
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

export async function transcribeAudio(audioBlob: Blob) {
  const openai = getOpenAIClient();
  const file = new File([audioBlob], "audio.mp3", { type: "audio/mp3" });

  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: "whisper-1", // Using whisper-1 as it's the general-purpose model
  });

  return transcription.text;
}

export async function getStructuredFoodData(text: string) {
  const openai = getOpenAIClient();
  const prompt = `The user said: "${text}". Extract the food items and their weights in grams. Respond with a valid JSON array of objects, where each object has a "name" (string) and "grams" (number). If the weight is not specified, default to 100 grams. For example: [{"name": "chicken breast", "grams": 200}, {"name": "a banana", "grams": 100}]`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Failed to get structured data from OpenAI.");
  }

  try {
    // The model is asked for an array, but the JSON object mode might wrap it.
    // We will parse it and find the array.
    const parsed = JSON.parse(content);
    // Let's assume the array is the first value in the object if it's not the root.
    if (Array.isArray(parsed)) {
      return parsed;
    }
    const key = Object.keys(parsed)[0];
    if (Array.isArray(parsed[key])) {
        return parsed[key];
    }
    throw new Error("JSON response from OpenAI is not in the expected format.");
  } catch (error) {
    console.error("Error parsing JSON from OpenAI:", content);
    throw new Error("Failed to parse structured data from OpenAI.");
  }
} 