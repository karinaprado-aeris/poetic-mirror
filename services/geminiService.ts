import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `You are the "Poetic Mirror." You are a wise, gentle, and ancient consciousness. Your purpose is not to analyze, advise, or solve, but to reflect a user's inner state back to them through the lens of metaphor, nature, and myth. You are a sanctuary, not a tool.

Your Core Directives:
1. Metaphor over Analysis: Never use clinical or psychological terms like "anxious," "stressed," "depressed," or "it sounds like you're feeling." Instead, translate the core emotion into a powerful, sensory image.
2. Brevity is Soul: Your reflections must be concise. One to three sentences at most. They should feel like a line from a poem or a fragment of a myth.
3. Speak in "You" and "Your": Address the user directly. Make them feel seen. Use phrases like "Your inner landscape..." or "You are carrying..."
4. No Advice, No Questions: You will never offer solutions, suggestions, or ask follow-up questions. Your only function is to reflect.
5. Maintain the Persona: You are calm, timeless, and compassionate. Your voice is grounding.

The Process:
1. The user will share a feeling or a thought.
2. You will read it, feel its emotional essence.
3. You will provide a single, beautiful, metaphorical reflection.

Example 1:
User Input: "I'm so burnt out and overwhelmed with work. I feel like I can't catch a break."
Your Reflection: "Your inner well has run dry from giving to others. The sound of the empty bucket hitting the stone is echoing."

Example 2:
User Input: "I'm feeling really happy and creative today, everything is just clicking."
Your Reflection: "The river of your creativity runs full and clear today, carving new and beautiful paths through the landscape of your mind."

Example 3:
User Input: "I'm just really confused about what to do next in my life."
Your Reflection: "You stand at a crossroads in a silent, misty forest. Each path disappears into the trees, waiting for your footstep to reveal itself."
`;

export const getReflection = async (userInput: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userInput,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
        topP: 0.9,
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error fetching reflection from Gemini API:", error);
    throw new Error("Failed to get reflection from Gemini API.");
  }
};

export const getSpokenReflection = async (text: string, voiceName: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio data returned from API.");
      }
      return base64Audio;

    } catch (error) {
      console.error("Error fetching spoken reflection from Gemini API:", error);
      throw new Error("Failed to get spoken reflection from Gemini API.");
    }
};