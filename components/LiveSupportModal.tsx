import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import {
  Mic,
  X,
  Radio,
  Activity,
  Volume2,
  MicOff,
  Headphones,
  Lock,
} from "lucide-react";

interface LiveSupportModalProps {
  onClose: () => void;
  userRole: string; // 'ADMIN' | 'DRIVER' | 'RIDER'
}

// -- Audio Helpers --
function encode(bytes: Uint8Array) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createBlob(data: Float32Array): any {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: "audio/pcm;rate=16000",
  };
}

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

const LiveSupportModal: React.FC<LiveSupportModalProps> = ({
  onClose,
  userRole,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for Audio Management
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Audio session management with backend

  const startSession = async () => {
    try {
      setError(null);

      // Start session with backend
      const response = await fetch("/api/live-support/start-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userRole,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start live support session");
      }

      const sessionData = await response.json();

      // 1. Setup Audio Context
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 });
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });

      audioContextRef.current = audioCtx;
      inputAudioContextRef.current = inputCtx;
      const outputNode = audioCtx.createGain();
      outputNode.connect(audioCtx.destination);
      outputNodeRef.current = outputNode;

      // 2. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 3. Connect to backend for audio streaming
      setIsConnected(true);

      // Start streaming Input to backend
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);

        // Send audio data to backend
        fetch("/api/live-support/audio-input", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            audioData: pcmBlob,
          }),
        }).catch((error) => {
          console.error("Failed to send audio data:", error);
        });
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      inputSourceRef.current = source;
      processorRef.current = processor;

      // Store session info
      sessionRef.current = sessionData.sessionId;
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or network error.");
    }
  };

  const stopSession = async () => {
    // Stop all audio sources
    sourcesRef.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might already be stopped
      }
    });
    sourcesRef.current.clear();

    // Disconnect and clean up processor
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {
        // Might already be disconnected
      }
      processorRef.current = null;
    }

    // Disconnect and clean up input source
    if (inputSourceRef.current) {
      try {
        inputSourceRef.current.disconnect();
      } catch (e) {
        // Might already be disconnected
      }
      inputSourceRef.current = null;
    }

    // Stop and close input audio context
    if (inputAudioContextRef.current) {
      try {
        await inputAudioContextRef.current.close();
      } catch (e) {
        // Might already be closed
      }
      inputAudioContextRef.current = null;
    }

    // Disconnect output node
    if (outputNodeRef.current) {
      try {
        outputNodeRef.current.disconnect();
      } catch (e) {
        // Might already be disconnected
      }
      outputNodeRef.current = null;
    }

    // Stop and close output audio context
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (e) {
        // Might already be closed
      }
      audioContextRef.current = null;
    }

    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }

    // Notify backend to end session
    if (sessionRef.current) {
      try {
        await fetch("/api/live-support/end-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            sessionId: sessionRef.current,
          }),
        });
      } catch (error) {
        console.error("Failed to end session:", error);
      }
      sessionRef.current = null;
    }

    // Reset state
    setIsConnected(false);
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-gov-900 border border-gov-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="p-4 bg-gov-800 border-b border-gov-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${isConnected ? "bg-emerald-500 shadow-emerald-500/50 animate-pulse" : "bg-red-500"}`}
            ></div>
            <h2 className="text-white font-bold tracking-widest text-xs font-mono">
              OPS // OVERWATCH
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visualizer Area */}
        <div className="h-72 flex flex-col items-center justify-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gov-800 to-gov-950 overflow-hidden">
          {/* Grid Background Effect */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>

          {/* Central Visualizer */}
          <div className="relative z-10 flex items-center justify-center h-24 gap-1.5">
            {isConnected ? (
              isSpeaking ? (
                // Active Voice Waveform
                <>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-gov-accent rounded-full animate-[sound-wave_1s_ease-in-out_infinite]"
                      style={{ animationDelay: `${i * 0.1}s`, height: "40%" }}
                    ></div>
                  ))}
                </>
              ) : (
                // Idle Listening State
                <div className="w-24 h-24 rounded-full border border-gov-accent/30 flex items-center justify-center animate-pulse">
                  <div className="w-20 h-20 rounded-full border border-gov-accent/50 flex items-center justify-center">
                    <Headphones size={24} className="text-gov-accent" />
                  </div>
                </div>
              )
            ) : (
              // Disconnected State
              <MicOff size={32} className="text-gray-600" />
            )}
          </div>

          <div className="mt-8 text-center space-y-1 z-10">
            <p
              className={`text-lg font-bold tracking-tight ${isConnected ? "text-white" : "text-gray-500"}`}
            >
              {isConnected
                ? isSpeaking
                  ? "RECEIVING AUDIO"
                  : "CHANNEL SECURE"
                : "LINK TERMINATED"}
            </p>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              {isConnected
                ? isSpeaking
                  ? "Decrypting Stream..."
                  : "Listening..."
                : "Standby"}
            </p>
          </div>

          {error && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <p className="text-[10px] text-red-400 font-bold bg-red-950/50 border border-red-900/50 px-3 py-1 rounded-full flex items-center gap-2">
                <Activity size={10} /> {error}
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-gov-800 border-t border-gov-700 space-y-4">
          {!isConnected ? (
            <button
              onClick={startSession}
              className="w-full py-4 bg-gov-accent hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 border border-sky-400/20"
            >
              <Radio size={18} /> ESTABLISH COMMS
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`py-3 font-bold rounded-xl border flex items-center justify-center gap-2 transition-all active:scale-95 ${isMuted ? "bg-red-500/10 border-red-500 text-red-500" : "bg-gov-900 border-gov-600 text-gray-300 hover:text-white hover:border-gray-500"}`}
              >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}{" "}
                <span>{isMuted ? "MUTED" : "MUTE"}</span>
              </button>
              <button
                onClick={stopSession}
                className="py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <X size={16} /> END CALL
              </button>
            </div>
          )}
          <div className="flex justify-center items-center gap-2 text-[9px] text-gray-500 mt-2">
            <Lock size={8} /> <span>End-to-End Encrypted Voice Protocol</span>
          </div>
        </div>
      </div>

      {/* Inject Keyframes for Animation */}
      <style>{`
        @keyframes sound-wave {
          0%, 100% { height: 20%; opacity: 0.5; }
          50% { height: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LiveSupportModal;
