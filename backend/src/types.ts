/**
 * AgroIntelX Type Definitions
 * Shared types across frontend and backend API layers.
 */

export enum UserRole {
  FARMER = "farmer",
  ADMIN = "admin",
  EXPERT = "expert"
}

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  name: string;
  role: UserRole;
  farmLocation?: string;
  farmSize?: number; // in acres
  soilType?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  precipitation: number;
  soilMoisture: number;
  soilTemp: number;
  forecast: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    condition: string;
    precipitation: number;
  }>;
}

export interface CropRecommendationParams {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  soilType: string;
}

export interface CropRecommendationResult {
  crop: string;
  confidence: number;
  suitabilityReason: string;
  fertilizerTips: string;
  irrigationNeeds: string;
  marketDemand: "High" | "Medium" | "Low";
  growthDurationDays: number;
  alternativeCrops: string[];
}

export interface DiseaseDetectionResult {
  plantName: string;
  diseaseName: string;
  confidence: number;
  symptoms: string[];
  organicCure: string;
  chemicalCure: string;
  preventionTips: string[];
  expertOpinionNeeded: boolean;
}

export interface YieldPredictionParams {
  crop: string;
  area: number; // acres
  soilType: string;
  fertilizerUsed: string;
  irrigationType: string;
  expectedRainfall: number;
}

export interface YieldPredictionResult {
  predictedYieldTonnes: number;
  predictedYieldPerAcre: number;
  confidenceScore: number;
  limitingFactors: string[];
  optimizationRecommendations: string[];
}

export interface MarketPriceData {
  crop: string;
  currentPrice: number; // per quintal
  unit: string;
  priceTrend: "up" | "down" | "stable";
  monthlyForecast: Array<{ month: string; predictedPrice: number }>;
  historicalPrices: Array<{ year: number; price: number }>;
}

export interface Expense {
  id: string;
  userId: string;
  category: "seeds" | "fertilizer" | "pesticides" | "labor" | "fuel" | "equipment" | "other";
  amount: number;
  date: string;
  description: string;
}

export interface FarmCalendarTask {
  id: string;
  userId: string;
  title: string;
  date: string;
  crop: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  category: "sowing" | "irrigation" | "fertilizing" | "harvesting" | "spraying";
}

export interface GovScheme {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  subsidyPercentage: number;
  link: string;
  category: "subsidies" | "loans" | "crop insurance" | "tech acquisition";
  applied?: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: "Available" | "In Use" | "Maintenance";
  rentalCostPerDay?: number;
  lastServicedDate?: string;
  operatorName?: string;
}

export interface Livestock {
  id: string;
  tagId: string;
  type: "Cattle" | "Sheep" | "Goat" | "Poultry" | "Other";
  breed: string;
  ageMonths: number;
  healthStatus: "Healthy" | "Sick" | "Quarantined" | "Vaccination Due";
  vaccinations: Array<{ name: string; date: string }>;
  feedPlan: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "alert";
  date: string;
  read: boolean;
}
