// src/context/LocationContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

export interface SavedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationContextType {
  location: SavedLocation | null;
  setLocation: (loc: SavedLocation) => void;
  clearLocation: () => void;
}

const STORAGE_KEY = "zipmartDeliveryLocation";

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [location, setLocationState] = useState<SavedLocation | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as SavedLocation) : null;
    } catch {
      return null;
    }
  });

  const setLocation = (loc: SavedLocation) => {
    setLocationState(loc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch (e) {
      console.error("Error saving location:", e);
    }
  };

  const clearLocation = () => {
    setLocationState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Error clearing location:", e);
    }
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationCtx = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationCtx must be used within a LocationProvider");
  }
  return context;
};
