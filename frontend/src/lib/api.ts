import { 
  User, 
  WeatherData, 
  CropRecommendationParams, 
  CropRecommendationResult, 
  DiseaseDetectionResult, 
  YieldPredictionParams, 
  YieldPredictionResult, 
  Expense, 
  FarmCalendarTask, 
  GovScheme, 
  Equipment, 
  Livestock, 
  AppNotification, 
  WeatherRisk, 
  WeatherRecommendation 
} from "../types";

// Base URL of the backend API. In dev, Vite proxies "/api" to the backend
// (see vite.config.ts), so this can stay empty. In production, set
// VITE_API_URL to the deployed backend's origin, e.g. https://api.example.com
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const TOKEN_KEY = "agrointelx_token";

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Global API Request Helper
async function apiRequest<T>(endpoint: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: any): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status} failed`);
    }

    return data as T;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

// Expose All Core Features
export const api = {
  // Authentication
  login: async (credentials: any) => {
    const res = await apiRequest<{ user: User; token: string }>("/api/auth/login", "POST", credentials);
    setToken(res.token);
    return res;
  },

  googleLogin: async (details: { email: string; name: string; id: string; photoURL?: string }) => {
    const res = await apiRequest<{ user: User; token: string }>("/api/auth/google", "POST", details);
    setToken(res.token);
    return res;
  },

  register: async (details: any) => {
    const res = await apiRequest<{ user: User; token: string }>("/api/auth/register", "POST", details);
    setToken(res.token);
    return res;
  },

  requestOtp: async (phoneNumber: string) => {
    return apiRequest<{ success: boolean; otp: string; isNewUser: boolean; message: string }>("/api/auth/request-otp", "POST", { phoneNumber });
  },

  verifyOtp: async (phoneNumber: string, otp: string) => {
    const res = await apiRequest<{ user: User; token: string; isNewUser: boolean }>("/api/auth/verify-otp", "POST", { phoneNumber, otp });
    setToken(res.token);
    return res;
  },

  me: async () => {
    return apiRequest<{ user: User }>("/api/auth/me", "GET");
  },

  updateProfile: async (profileUpdates: Partial<User>) => {
    return apiRequest<{ user: User }>("/api/auth/profile", "PUT", profileUpdates);
  },

  // Weather Intelligence
  getWeather: async (lat?: number, lon?: number) => {
    let url = "/api/weather";
    const params = new URLSearchParams();
    if (lat !== undefined) params.set("lat", lat.toString());
    if (lon !== undefined) params.set("lon", lon.toString());
    const qs = params.toString();
    if (qs) url += `?${qs}`;
    return apiRequest<WeatherData>(url, "GET");
  },

  getWeatherByCoordinates: async (latitude: number, longitude: number) => {
    return apiRequest<WeatherData>("/api/weather/coordinates", "POST", { latitude, longitude });
  },

  reverseGeocode: async (latitude: number, longitude: number) => {
    return apiRequest<{ location: string; lat: number; lon: number }>("/api/location/reverse", "POST", { latitude, longitude });
  },

  searchLocation: async (query: string) => {
    return apiRequest<{ lat: number; lon: number; name: string }>("/api/location/search", "POST", { query });
  },

  getWeatherRisk: async (latitude?: number, longitude?: number, location?: string) => {
    return apiRequest<{ weather: WeatherData; risk: WeatherRisk; recommendations: WeatherRecommendation[] }>("/api/weather/risk", "POST", { latitude, longitude, location });
  },

  getWeatherRecommendations: async (latitude?: number, longitude?: number, location?: string) => {
    return apiRequest<{ recommendations: WeatherRecommendation[] }>("/api/weather/recommendations", "POST", { latitude, longitude, location });
  },

  updateFarmLocation: async (farmLocation: string, farmLat?: number, farmLon?: number) => {
    return apiRequest<{ user: User }>("/api/auth/location", "PUT", { farmLocation, farmLat, farmLon });
  },

  // Crop recommendation NPK
  recommendCrop: async (params: CropRecommendationParams) => {
    return apiRequest<CropRecommendationResult>("/api/ai/crop-recommendation", "POST", params);
  },

  // Disease detection visual
  detectDisease: async (base64Image: string, textContext?: string) => {
    return apiRequest<DiseaseDetectionResult>("/api/ai/disease-detection", "POST", { image: base64Image, textContext });
  },

  // Yield Forecasting
  predictYield: async (params: YieldPredictionParams) => {
    return apiRequest<YieldPredictionResult>("/api/ai/yield-prediction", "POST", params);
  },

  // AI Chat Assistant
  chat: async (messages: Array<{ role: "user" | "model"; parts: { text: string }[] }>) => {
    return apiRequest<{ reply: string }>("/api/ai/chat", "POST", { messages });
  },

  // Expenses Financials
  getExpenses: async () => {
    return apiRequest<Expense[]>("/api/expenses", "GET");
  },

  addExpense: async (expense: Omit<Expense, "id" | "userId">) => {
    return apiRequest<Expense>("/api/expenses", "POST", expense);
  },

  deleteExpense: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/api/expenses/${id}`, "DELETE");
  },

  // Farm Tasks Planner
  getTasks: async () => {
    return apiRequest<FarmCalendarTask[]>("/api/tasks", "GET");
  },

  addTask: async (task: Omit<FarmCalendarTask, "id" | "userId" | "completed">) => {
    return apiRequest<FarmCalendarTask>("/api/tasks", "POST", task);
  },

  toggleTask: async (id: string) => {
    return apiRequest<FarmCalendarTask>(`/api/tasks/${id}/toggle`, "PUT");
  },

  deleteTask: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/api/tasks/${id}`, "DELETE");
  },

  // Government Schemes Catalogs
  getSchemes: async () => {
    return apiRequest<GovScheme[]>("/api/schemes", "GET");
  },

  applyScheme: async (id: string) => {
    return apiRequest<GovScheme>(`/api/schemes/${id}/apply`, "PUT");
  },

  // Equipment Catalog
  getEquipment: async () => {
    return apiRequest<Equipment[]>("/api/equipment", "GET");
  },

  addEquipment: async (eq: any) => {
    return apiRequest<Equipment>("/api/equipment", "POST", eq);
  },

  rentEquipment: async (id: string, durationDays: number) => {
    return apiRequest<Equipment>(`/api/equipment/${id}/rent`, "PUT", { durationDays });
  },

  deleteEquipment: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/api/equipment/${id}`, "DELETE");
  },

  // Livestock Manager
  getLivestock: async () => {
    return apiRequest<Livestock[]>("/api/livestock", "GET");
  },

  addLivestock: async (animal: any) => {
    return apiRequest<Livestock>("/api/livestock", "POST", animal);
  },

  updateLivestockHealth: async (id: string, status: Livestock["healthStatus"]) => {
    return apiRequest<Livestock>(`/api/livestock/${id}/health`, "PUT", { status });
  },

  deleteLivestock: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/api/livestock/${id}`, "DELETE");
  },

  // Notification Operations
  getNotifications: async () => {
    return apiRequest<AppNotification[]>("/api/notifications", "GET");
  },

  markNotificationRead: async (id: string) => {
    return apiRequest<AppNotification>(`/api/notifications/${id}/read`, "PUT");
  },

  clearNotifications: async () => {
    return apiRequest<{ success: boolean }>("/api/notifications/clear", "POST");
  }
};
