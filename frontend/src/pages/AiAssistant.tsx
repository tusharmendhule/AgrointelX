import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bot, 
  Send, 
  Mic, 
  Sparkles, 
  Trash2, 
  CircleAlert, 
  CircleCheck,
  HelpCircle,
  TrendingUp,
  Leaf,
  Bug,
  Wrench,
  HeartPulse,
  Info
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useWeather } from "../context/WeatherContext";
import { useLocation } from "../context/LocationContext";
import MarkdownFormatter from "../components/MarkdownFormatter";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

interface Suggestion {
  icon: any;
  label: string;
  prompt: string;
  color: string;
}

export default function AiAssistant() {
  const { t, i18n } = useTranslation();
  const { weather } = useWeather();
  const { locationName } = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: t("aiAssistant.greeting", "Hello, I am your precision AgroIntelX AI Advisor. I am trained in advanced agronomy, crop protection, machinery troubleshooting, livestock vet guidance, and market price trends.\n\nHow can I help optimize your farm yields today?"),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");

  const streamEndRef = useRef<HTMLDivElement>(null);

  const suggestions: Suggestion[] = [
    {
      icon: Leaf,
      label: t("aiAssistant.suggestion.crop.label", "Crop Advisory"),
      prompt: t("aiAssistant.suggestion.crop.prompt", "Recommend suitable winter crops for alluvial soil with high nitrogen content and low rainfall."),
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      icon: Bug,
      label: t("aiAssistant.suggestion.pest.label", "Pest & Diseases"),
      prompt: t("aiAssistant.suggestion.pest.prompt", "My tomato plants have black dry spots with yellow concentric circles on lower leaves. What is it, and how can I cure it organically?"),
      color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20"
    },
    {
      icon: Wrench,
      label: t("aiAssistant.suggestion.machinery.label", "Machinery Troubleshooting"),
      prompt: t("aiAssistant.suggestion.machinery.prompt", "My tractor engine is overheating under heavy load and releasing white smoke. What are the common diagnostics and solution steps?"),
      color: "from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/20"
    },
    {
      icon: HeartPulse,
      label: t("aiAssistant.suggestion.livestock.label", "Livestock Care"),
      prompt: t("aiAssistant.suggestion.livestock.prompt", "Provide a standard vaccination timeline and common nutritional requirements for Holstein dairy cows during milk production."),
      color: "from-rose-500/20 to-purple-500/10 text-rose-400 border-rose-500/20"
    }
  ];

  // Auto scroll
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    setError("");
    const userMessage: Message = {
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      // Build proper history payloads for Gemini server handler
      const chatLogs = messages.map(m => ({
        role: (m.sender === "user" ? "user" : "model") as "user" | "model",
        parts: [{ text: m.text }]
      }));
      chatLogs.push({ role: "user", parts: [{ text }] });

      // Inject weather context into the last user message for AI awareness
      let enrichedLogs = [...chatLogs];
      if (weather) {
        const weatherContext = `\n\n[Current Weather Context for ${locationName || "farm location"}: Temperature: ${weather.temp}°C (feels like ${weather.feelsLike || weather.temp}°C), Condition: ${weather.condition}, Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed} km/h, Rain probability: ${weather.rainProbability || 0}%, Precipitation: ${weather.precipitation}mm. Soil moisture: ${weather.soilMoisture}%. 7-day forecast: ${weather.forecast.map(f => `${f.date}: ${f.condition}, ${f.tempMax}/${f.tempMin}°C, ${f.precipitation}mm rain`).join("; ")}. Use this real weather data to provide accurate, location-specific farming advice. Do not fabricate weather information.]`;
        // Append weather context to the last user message
        const lastMsg = enrichedLogs[enrichedLogs.length - 1];
        if (lastMsg && lastMsg.role === "user") {
          enrichedLogs[enrichedLogs.length - 1] = {
            ...lastMsg,
            parts: [{ text: lastMsg.parts[0].text + weatherContext }]
          };
        }
      }
      const res = await api.chat(enrichedLogs);
      
      setMessages(prev => [...prev, {
        sender: "bot",
        text: res.reply,
        timestamp: new Date()
      }]);
    } catch (err: any) {
      setError(t("aiAssistant.unreachableError", "Unable to reach the agricultural knowledge base. Please check internet connection."));
      setMessages(prev => [...prev, {
        sender: "bot",
        text: t("aiAssistant.processError", "I was unable to fully process that query. The satellite data stream has timed out. Please try again."),
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestClick = (promptText: string) => {
    handleSend(promptText);
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError(t("aiAssistant.speechUnsupported", "Speech-to-text is not supported on this browser context. Try using Google Chrome."));
      return;
    }

    setIsRecording(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const speechLangMap: Record<string, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
    recognition.lang = speechLangMap[i18n.language] || "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setError(t("aiAssistant.voiceRecognitionFailed", "Voice command recognition failed. Please try speaking closer to your mic."));
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const clearChat = () => {
    setMessages([
      {
        sender: "bot",
        text: t("aiAssistant.cacheReset", "System cache reset. I am ready to advise you on crops, soil mechanics, or chemical compositions. Let me know what you would like to analyze."),
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-emerald-500 animate-pulse" />
            {t("aiAssistant.pageTitle", "AgroIntelX AI Farm Advisor")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("aiAssistant.pageSubtitle", "Immersive expert system providing real-time crop analytics, diagnostic consulting, and agronomic blueprints.")}
          </p>
        </div>
        
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-all font-semibold"
          title={t("aiAssistant.clearLogsTitle", "Clear Conversation Logs")}
        >
          <Trash2 className="h-4 w-4" />
          {t("aiAssistant.resetChat", "Reset Chat")}
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-2.5 text-xs shrink-0">
          <CircleAlert className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Chat Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Preset Templates & Quick Advice */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto hidden lg:flex">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl dark:backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles className="h-4.5 w-4.5" />
              <h3 className="font-bold text-xs">{t("aiAssistant.promptChips", "Expert Prompt Chips")}</h3>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {t("aiAssistant.promptChipsDesc", "Tap any diagnostic template chip to automatically consult the AI with an industry-standard agronomy prompt:")}
            </p>

            <div className="space-y-3">
              {suggestions.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSuggestClick(s.prompt)}
                    disabled={loading}
                    className={`w-full text-left p-3 rounded-2xl border bg-gradient-to-br ${s.color} hover:scale-[1.02] active:scale-95 transition-all text-[11px] font-medium leading-relaxed`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="h-4 w-4" />
                      <span className="font-bold">{s.label}</span>
                    </div>
                    <p className="line-clamp-2 opacity-80">{s.prompt}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl space-y-2 text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
              <Info className="h-3.5 w-3.5 text-emerald-500" />
              <span>{t("aiAssistant.multilingualSupport", "Multi-Lingual support")}</span>
            </div>
            <p className="leading-relaxed">
              {t("aiAssistant.multilingualSupportDesc", "Our AI is fully compatible with multilingual prompts. You can ask queries in **Hindi (हिन्दी)**, **Marathi (मराठी)**, or **English** directly.")}
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic Messages Feed */}
        <div className="lg:col-span-3 flex flex-col rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 dark:backdrop-blur-md overflow-hidden h-full">
          
          {/* Feed Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((msg, idx) => {
              const isBot = msg.sender === "bot";
              return (
                <div 
                  key={idx}
                  className={`flex gap-3 md:gap-4 ${isBot ? "justify-start" : "justify-end"}`}
                >
                  {/* Bot Avatar */}
                  {isBot && (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 md:px-5 md:py-4 shadow-sm relative ${
                    isBot 
                      ? "bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-tl-none" 
                      : "bg-emerald-600 text-white rounded-tr-none font-medium text-xs md:text-sm leading-relaxed"
                  }`}>
                    {isBot ? (
                      <MarkdownFormatter text={msg.text} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    <span className={`block text-[8px] mt-1.5 text-right ${isBot ? "text-slate-500" : "text-emerald-200"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* User Avatar */}
                  {!isBot && (
                    <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 shadow-md font-extrabold text-xs">
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shrink-0 animate-pulse">
                  <Bot className="h-4.5 w-4.5" />
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px] text-slate-400 font-mono ml-1.5">{t("aiAssistant.analyzing", "Analyzing agronomic maps...")}</span>
                </div>
              </div>
            )}

            <div ref={streamEndRef} />
          </div>

          {/* Suggestions Tray for Mobile screens */}
          <div className="lg:hidden px-4 pt-2 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 pb-2">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestClick(s.prompt)}
                disabled={loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-950/55 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] text-slate-600 dark:text-slate-300 font-medium active:scale-95 transition-all"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Input Panel */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleVoiceInput}
                disabled={loading}
                className={`p-3.5 rounded-2xl transition-all border shrink-0 ${
                  isRecording 
                    ? "bg-rose-500 border-rose-600 text-white animate-pulse shadow-lg shadow-rose-500/20" 
                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
                title={t("aiAssistant.dictateTitle", "Dictate Agriculture Prompt (Hindi/Marathi/English)")}
              >
                <Mic className="h-5 w-5" />
              </button>

              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
                disabled={loading || isRecording}
                placeholder={isRecording ? t("aiAssistant.listeningPlaceholder", "Listening closely... Speak your question") : t("aiAssistant.inputPlaceholder", "Type crop question, disease name, or mechanical issues...")}
                className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:shadow-none text-white rounded-2xl transition-all active:scale-95 shadow-md shadow-emerald-600/10 shrink-0"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex justify-between items-center mt-2.5 px-1">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <HelpCircle className="h-3 w-3 inline text-slate-500" />
                {t("aiAssistant.recommendationsNote", "Prompt recommendations include regional localized diagnostics.")}
              </span>
              <span className="text-[10px] text-emerald-500 font-mono font-bold">
                {t("aiAssistant.poweredBy", "Powered by Gemini 3.5")}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
