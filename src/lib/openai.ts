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
  console.log(`[OpenAI] Getting structured data for text: "${text}"`);
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
    const parsed = JSON.parse(content);

    // Case 1: The response is already the array we want.
    if (Array.isArray(parsed)) {
      return parsed;
    }

    // Case 2: The array is wrapped in an object, e.g., { "foods": [...] }
    const key = Object.keys(parsed)[0];
    if (key && Array.isArray(parsed[key])) {
        return parsed[key];
    }

    // Case 3: The response is a single object for a single food item.
    if (typeof parsed === 'object' && parsed !== null && 'name' in parsed && 'grams' in parsed) {
      return [parsed]; // Wrap the single object in an array
    }

    throw new Error("JSON response from OpenAI is not in the expected format.");
  } catch (error) {
    console.error("Error parsing JSON from OpenAI:", content, error);
    throw new Error("Failed to parse structured data from OpenAI.");
  }
} 