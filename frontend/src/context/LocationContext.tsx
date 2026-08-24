import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";
import { LocationState } from "../types";

interface LocationContextType extends LocationState {
  requestLocation: () => void;
  setManualLocation: (name: string, lat?: number, lon?: number) => void;
  refreshLocation: () => void;
  searchLocations: (query: string) => Promise<Array<{ lat: number; lon: number; name: string }>>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_STORAGE_KEY = "agrointelx_location";

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [state, setState] = useState<LocationState>(() => {
    // Try to restore from localStorage
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          lat: parsed.lat || null,
          lon: parsed.lon || null,
          locationName: parsed.locationName || "",
          accuracy: null,
          permissionState: "unknown",
          isLoading: false,
          error: null,
          lastUpdated: parsed.lastUpdated || null
        };
      }
    } catch {}

    return {
      lat: null,
      lon: null,
      locationName: user?.farmLocation || "",
      accuracy: null,
      permissionState: "unknown",
      isLoading: false,
      error: null,
      lastUpdated: null
    };
  });

  // Save to localStorage whenever location changes
  useEffect(() => {
    if (state.lat && state.lon && state.locationName) {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
        lat: state.lat,
        lon: state.lon,
        locationName: state.locationName,
        lastUpdated: state.lastUpdated
      }));
    }
  }, [state.lat, state.lon, state.locationName, state.lastUpdated]);

  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<string> => {
    try {
      const result = await api.reverseGeocode(lat, lon);
      return result.location;
    } catch {
      // Fallback to user's farm location or generic
      return user?.farmLocation || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
    }
  }, [user]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocation is not supported by your browser.",
        permissionState: "denied"
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const locationName = await reverseGeocode(latitude, longitude);
          setState({
            lat: latitude,
            lon: longitude,
            locationName,
            accuracy,
            permissionState: "granted",
            isLoading: false,
            error: null,
            lastUpdated: Date.now()
          });
        } catch {
          setState({
            lat: latitude,
            lon: longitude,
            locationName: `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`,
            accuracy,
            permissionState: "granted",
            isLoading: false,
            error: null,
            lastUpdated: Date.now()
          });
        }
      },
      (error) => {
        let errorMsg = "Unable to retrieve your location.";
        let permState: LocationState["permissionState"] = "denied";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location access was denied. You can set your farm location manually.";
            permState = "denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information is unavailable. Please enter your location manually.";
            permState = "denied";
            break;
          case error.TIMEOUT:
            errorMsg = "Location request timed out. Please try again or enter manually.";
            permState = "denied";
            break;
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMsg,
          permissionState: permState
        }));
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  }, [reverseGeocode]);

  const setManualLocation = useCallback(async (name: string, lat?: number, lon?: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    if (lat !== undefined && lon !== undefined) {
      setState({
        lat,
        lon,
        locationName: name,
        accuracy: null,
        permissionState: "granted",
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      });
    } else {
      // Try to geocode the name
      try {
        const result = await api.searchLocation(name);
        setState({
          lat: result.lat,
          lon: result.lon,
          locationName: result.name || name,
          accuracy: null,
          permissionState: "granted",
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        });
      } catch {
        // If geocoding fails, just use the name without coordinates
        setState({
          lat: null,
          lon: null,
          locationName: name,
          accuracy: null,
          permissionState: "granted",
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        });
      }
    }
  }, []);

  const refreshLocation = useCallback(() => {
    if (state.permissionState === "granted" && state.lat && state.lon) {
      // Re-reverse geocode to get updated location name
      requestLocation();
    } else if (state.locationName) {
      // Re-geocode the name
      setManualLocation(state.locationName);
    }
  }, [state.permissionState, state.lat, state.lon, state.locationName, requestLocation, setManualLocation]);

  const searchLocations = useCallback(async (query: string) => {
    try {
      const result = await api.searchLocation(query);
      return [result];
    } catch {
      return [];
    }
  }, []);

  // Auto-request location on mount if no saved location
  useEffect(() => {
    if (!state.lat && !state.lon && !state.locationName && state.permissionState === "unknown") {
      // Don't auto-request, let the UI handle it
    }
  }, []);

  return (
    <LocationContext.Provider value={{
      ...state,
      requestLocation,
      setManualLocation,
      refreshLocation,
      searchLocations
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
