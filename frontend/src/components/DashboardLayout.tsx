import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  CloudSun, 
  Leaf, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  Award, 
  Wrench, 
  HeartPulse, 
  Bot, 
  Bell, 
  LogOut, 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X, 
  ChevronRight,
  MessageSquare,
  Sparkles,
  MapPin,
  Mic,
  Send,
  Check
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { AppNotification, WeatherData } from "../types";
import LanguageSwitcher from "./LanguageSwitcher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [weatherBrief, setWeatherBrief] = useState<WeatherData | null>(null);

  // Chat States
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    { sender: "bot", text: t("chat.greeting", "Hello! I am AgroIntelX AI, your precision agricultural assistant. Ask me anything about soil health, crop diagnostics, weather patterns, or machinery!") }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Fetch Header Details
  useEffect(() => {
    async function loadHeaderData() {
      if (!user) return;
      try {
        const [notifs, weather] = await Promise.all([
          api.getNotifications(),
          api.getWeather()
        ]);
        setNotifications(notifs);
        setWeatherBrief(weather);
      } catch (err) {
        console.error("Failed to load header dashboard briefs:", err);
      }
    }
    loadHeaderData();
    // Poll notifications every 45 seconds
    const interval = setInterval(loadHeaderData, 45000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearNotifs = async () => {
    try {
      await api.clearNotifications();
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text }]);
    setChatInput("");
    setIsTyping(true);

    try {
      const chatLogs = chatMessages.map(m => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.text }]
      }));
      chatLogs.push({ role: "user", parts: [{ text }] });

      const response = await api.chat(chatLogs);
      setChatMessages(prev => [...prev, { sender: "bot", text: response.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: "bot", text: t("chat.error", "I'm having trouble analyzing the satellite data. Please rephrase.") }]);
    } finally {
      setIsTyping(false);
    }
  };

  const triggerVoiceCommand = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert(t("chat.speechUnsupported", "Speech recognition is not fully supported in your current browser session. Try opening in a new tab or Chrome."));
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
      setChatInput(speechToText);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const menuItems = [
    { name: t("nav.dashboard", "Dashboard"), path: "/dashboard", icon: LayoutDashboard },
    { name: t("nav.aiAdvisor", "AI Farm Advisor"), path: "/ai-assistant", icon: Bot },
    { name: t("nav.weather", "Weather Intel"), path: "/weather", icon: CloudSun },
    { name: t("nav.cropRecommendation", "Crop Recommendation"), path: "/crop-recommendation", icon: Leaf },
    { name: t("nav.diseaseDiagnostic", "Disease Diagnostic"), path: "/disease-detection", icon: Sparkles },
    { name: t("nav.yieldForecasting", "Yield Forecasting"), path: "/yield-prediction", icon: TrendingUp },
    { name: t("nav.expenseLedger", "Expense Ledger"), path: "/expenses", icon: Wallet },
    { name: t("nav.agriCalendar", "Agri Calendar"), path: "/calendar", icon: Calendar },
    { name: t("nav.govtSchemes", "Govt Schemes"), path: "/schemes", icon: Award },
    { name: t("nav.equipmentRent", "Equipment Rent"), path: "/equipment", icon: Wrench },
    { name: t("nav.livestockLog", "Livestock Log"), path: "/livestock", icon: HeartPulse },
  ];

  return (
    <div className={`min-h-screen flex ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors duration-200 font-sans`}>
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 ${theme === "dark" ? "bg-slate-900/50 backdrop-blur-md" : "bg-white"} sticky top-0 h-screen z-20`}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/30">
            <Leaf className="h-6 w-6" id="logo-icon" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">AgroIntelX</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono font-bold">{t("landing.tagline", "Decision Suite")}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                  active 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-400 group-hover:text-emerald-500 transition-colors"}`} />
                {item.name}
                <ChevronRight className={`h-4 w-4 ml-auto transition-all ${active ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-100 text-slate-400"}`} />
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT CONTAINER */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-4 bg-slate-100 dark:bg-slate-800/40">
            <div className="h-9 w-9 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 font-bold border border-emerald-500/20">
              {user?.name?.[0] || "F"}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{t(`roles.${user?.role}`, user?.role || "")}</p>
            </div>
            <button 
              onClick={() => navigate("/settings")} 
              className="text-slate-400 hover:text-emerald-500 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700/50"
              title={t("settings.profileSettings", "Profile Settings")}
            >
              <User className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3">
            <LanguageSwitcher className="w-full" />
          </div>

          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {t("nav.signOut", "Sign Out")}
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER/SIDEBAR WRAPPER */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            
            {/* Drawer */}
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className={`fixed top-0 bottom-0 left-0 w-72 border-r border-slate-200 dark:border-slate-800 ${theme === "dark" ? "bg-slate-900" : "bg-white"} z-50 flex flex-col p-6`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 rounded-lg text-white">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <h1 className="text-lg font-bold">AgroIntelX</h1>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <LanguageSwitcher className="w-full" />
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const active = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                        active 
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-400"}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => { logout(); setSidebarOpen(false); }}
                  className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  {t("nav.signOut", "Sign Out")}
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* MASTER CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* TOP HEADER PANELS */}
        <header className={`sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 backdrop-blur-md ${theme === "dark" ? "bg-slate-950/70" : "bg-slate-50/70"}`}>
          
          {/* MOBILE SIDEBAR BUTTON */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors"
              id="mobile-menu-btn"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Weather status summary */}
            {weatherBrief && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800/50 text-xs text-slate-600 dark:text-slate-300">
                <CloudSun className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold">{weatherBrief.temp}°C</span>
                <span className="text-slate-400 dark:text-slate-500">|</span>
                <span className="truncate max-w-[120px]">{weatherBrief.condition}</span>
                <span className="text-slate-400 dark:text-slate-500">|</span>
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3 inline" /> {user?.farmLocation || t("dashboard.defaultLocation", "Punjab, IN")}
                </span>
              </div>
            )}
          </div>

          {/* UTILITY BUTTONS */}
          <div className="flex items-center gap-2">

            {/* Language switcher */}
            <LanguageSwitcher compact />

            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95"
              title={theme === "dark" ? t("common.switchToLight", "Switch to Light Mode") : t("common.switchToDark", "Switch to Dark Mode")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
            </button>

            {/* Notifications panel toggle */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 relative transition-all active:scale-95"
                title={t("dashboard.climateAlerts", "Climate and Crop Alerts")}
                id="bell-icon"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 mt-2 w-80 lg:w-96 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 ${theme === "dark" ? "bg-slate-900" : "bg-white"} overflow-hidden z-40`}
                    >
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
                        <span className="font-semibold text-sm">{t("dashboard.climateAndCropAlerts", "Climate & Crop Alerts")}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleClearNotifs}
                            className="text-[11px] text-rose-500 hover:underline font-medium"
                          >
                            {t("common.clearAll", "Clear All")}
                          </button>
                        </div>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400">
                            {t("dashboard.noAlerts", "No active soil or weather warnings. You're set!")}
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              className={`p-4 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${!n.read ? "bg-emerald-50/10 dark:bg-emerald-500/5" : ""}`}
                            >
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <span className={`font-semibold ${
                                  n.type === "warning" ? "text-amber-500" : 
                                  n.type === "alert" ? "text-rose-500" : 
                                  n.type === "success" ? "text-emerald-500" : "text-slate-500"
                                }`}>
                                  {n.title}
                                </span>
                                {!n.read && (
                                  <button 
                                    onClick={() => handleMarkRead(n.id)}
                                    className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                                    title={t("common.markRead", "Mark Read")}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-1">{n.message}</p>
                              <span className="text-[10px] text-slate-400">{new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Trigger (Bot Icon) */}
            <button
              onClick={() => setChatOpen(true)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 relative transition-all active:scale-95"
              title={t("chat.openAssistant", "Open AI Agricultural Assistant")}
              id="ai-assistant-btn"
            >
              <Bot className="h-5 w-5 text-emerald-500" />
            </button>

            {/* Divider */}
            <span className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Profile Avatar Button */}
            <button 
              onClick={() => navigate("/settings")}
              className="h-8 w-8 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-md border border-emerald-400"
            >
              {user?.name?.[0] || "U"}
            </button>
          </div>
        </header>

        {/* PAGES WRAPPED IN SMOTH ANIMATIONS */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* FLOATING AI ASSISTANT SIDE-DRAWER */}
      <AnimatePresence>
        {chatOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Dark Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setChatOpen(false)} />

            {/* Right Drawer */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                className={`w-screen max-w-md ${theme === "dark" ? "bg-slate-900 border-l border-slate-800" : "bg-white border-l border-slate-200"}`}
              >
                <div className="h-full flex flex-col">
                  {/* Chat Header */}
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-600 rounded-xl text-white">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-sm">{t("chat.advisorTitle", "AgroIntelX AI Advisor")}</h2>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          {t("chat.online", "Online")}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setChatOpen(false)}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Messages Stream */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          msg.sender === "user" 
                            ? "bg-emerald-600 text-white rounded-br-none" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-slate-700/50"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Voice Activation & Text Input */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={triggerVoiceCommand}
                        className={`p-2.5 rounded-xl transition-all border ${
                          isRecording 
                            ? "bg-rose-500 border-rose-600 text-white animate-pulse" 
                            : "bg-slate-200 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                        }`}
                        title={t("chat.voiceInputTitle", "Voice Input (Hindi/Marathi/English)")}
                      >
                        <Mic className="h-4.5 w-4.5" />
                      </button>
                      
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                        placeholder={isRecording ? t("chat.listening", "Listening to voice...") : t("chat.inputPlaceholder", "Ask advisor about crop choice, urea, diseases...")}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500"
                      />

                      <button
                        onClick={handleSendChat}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-600/20"
                      >
                        <Send className="h-4.5 w-4.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                      {t("chat.speechSupportNote", "Supports English, Hindi & Marathi Speech-to-Text commands.")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
