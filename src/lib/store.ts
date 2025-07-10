import { create } from 'zustand';
import type { FoodEntry } from './db';

interface AppState {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  foodEntries: FoodEntry[];
  setFoodEntries: (entries: FoodEntry[]) => void;
  addFoodEntry: (entry: FoodEntry) => void;
  updateFoodEntry: (entry: FoodEntry) => void;
}

export const useStore = create<AppState>((set) => ({
  apiKey: null,
  setApiKey: (key) => set({ apiKey: key }),
  foodEntries: [],
  setFoodEntries: (entries) => set({ foodEntries: entries }),
  addFoodEntry: (entry) => set((state) => ({ foodEntries: [...state.foodEntries, entry] })),
  updateFoodEntry: (entry) => set((state) => ({
    foodEntries: state.foodEntries.map((e) => e.id === entry.id ? entry : e),
  })),
})); 