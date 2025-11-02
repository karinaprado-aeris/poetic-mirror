import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Inlined Services ---

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

const getReflection = async (userInput: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

const getSpokenReflection = async (text: string, voiceName: string): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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


// --- Inlined Components ---

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center" aria-label="Loading reflection">
      <div className="w-12 h-12 border-4 border-t-blue-500 border-r-blue-500 border-b-gray-800 border-l-gray-800 rounded-full animate-spin"></div>
    </div>
  );
};

const FeatherIcon: React.FC = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
    <line x1="16" y1="8" x2="2" y2="22"></line>
    <line x1="17.5" y1="15" x2="9" y2="15"></line>
  </svg>
);

const SpeakerIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

const StopIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="6" y="6" width="12" height="12"></rect>
  </svg>
);


// --- Main App Component ---

const { useState, useCallback, useEffect, useRef } = React;

// Helper function to decode base64 string to Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper function to decode raw audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const availableVoices = [
  { id: 'Kore', name: 'Kore' },
  { id: 'Puck', name: 'Puck' },
  { id: 'Charon', name: 'Charon' },
  { id: 'Fenrir', name: 'Fenrir' },
  { id: 'Zephyr', name: 'Zephyr' },
];


const App: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [reflection, setReflection] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isFetchingAudio, setIsFetchingAudio] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopPlayback = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null; // Avoid onended callback on manual stop
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  const handleListen = useCallback(async (text: string) => {
    if (isSpeaking) {
      stopPlayback();
      return;
    }
    if (isFetchingAudio) return;

    setIsFetchingAudio(true);
    setError(null);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      
      // Resume context if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const base64Audio = await getSpokenReflection(text, selectedVoice);
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      source.onended = () => {
        setIsSpeaking(false);
        audioSourceRef.current = null;
      };

      source.start();
      audioSourceRef.current = source;
      setIsSpeaking(true);

    } catch (err) {
      setError("Sorry, the reflection could not be spoken at this time.");
      console.error(err);
      setIsSpeaking(false);
    } finally {
      setIsFetchingAudio(false);
    }
  }, [isSpeaking, isFetchingAudio, stopPlayback, selectedVoice]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    // Stop any ongoing speech
    stopPlayback();

    setIsLoading(true);
    setError(null);
    setReflection('');

    try {
      const result = await getReflection(userInput);
      setReflection(result);
      setUserInput(''); // Clear input on success
    } catch (err) {
      setError('A reflection could not be generated. The engine is offline. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, stopPlayback]);

  return (
    <div className="bg-black text-slate-200 min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500">
      <main className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
        
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl text-white font-bold mb-2">
            Reflection Engine
          </h1>
          <p className="text-lg text-slate-400">
            Input your state. Receive a reflection.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="w-full mb-8">
          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Share a feeling, a thought, a fragment of your day..."
              className="w-full h-32 p-4 pr-12 bg-transparent border border-gray-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-300 text-lg placeholder-gray-500"
              disabled={isLoading}
              aria-label="Your thoughts and feelings"
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="absolute bottom-3 right-3 p-2 text-blue-500 hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-400"
              aria-label="Get Reflection"
            >
              <FeatherIcon />
            </button>
          </div>
        </form>
        
        <div className="w-full min-h-[10rem] flex items-center justify-center">
          {isLoading && <LoadingSpinner />}
          {error && <p className="text-red-400" role="alert">{error}</p>}
          
          {!isLoading && !error && reflection && (
            <div className="w-full animate-fade-in flex items-start gap-4">
              <blockquote className="flex-grow border-l-4 border-blue-500 pl-6 py-2 text-left">
                <p className="text-xl md:text-2xl text-slate-100 leading-relaxed">
                  {reflection}
                </p>
              </blockquote>
               <button
                onClick={() => handleListen(reflection)}
                disabled={isLoading || isFetchingAudio}
                className={`flex-shrink-0 p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-400 ${isFetchingAudio ? 'animate-pulse text-blue-400' : ''}`}
                aria-label={isSpeaking ? "Stop speaking" : (isFetchingAudio ? "Loading audio..." : "Listen to reflection")}
              >
                {isSpeaking ? <StopIcon /> : <SpeakerIcon />}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 w-full max-w-xs">
          <label htmlFor="voice-select" className="block text-sm font-medium text-slate-400 mb-2">
            Narrator Voice
          </label>
          <select
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSpeaking || isFetchingAudio}
            aria-label="Select narrator voice"
          >
            {availableVoices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>

      </main>
       <footer className="absolute bottom-4 text-center text-gray-600 text-sm">
          <p>An Aeris AI Lab experiment, powered by Gemini.</p>
        </footer>
    </div>
  );
};


// --- App Mount ---

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
