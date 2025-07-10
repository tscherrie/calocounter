import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface FoodEntry {
  id: number;
  date: string; // YYYY-MM-DD
  name: string;
  grams: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface CaloCounterDB extends DBSchema {
  'food-entries': {
    key: number;
    value: FoodEntry;
    indexes: { 'date': string };
  };
}

let db: IDBPDatabase<CaloCounterDB> | null = null;

async function getDb() {
  if (db) {
    return db;
  }
  db = await openDB<CaloCounterDB>('CaloCounterDB', 1, {
    upgrade(db) {
      const store = db.createObjectStore('food-entries', {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('date', 'date');
    },
  });
  return db;
}

export async function addFoodEntry(entry: Omit<FoodEntry, 'id' | 'date'> & { date?: string }): Promise<FoodEntry> {
  const db = await getDb();
  const tx = db.transaction('food-entries', 'readwrite');
  const store = tx.objectStore('food-entries');
  const date = entry.date || new Date().toISOString().split('T')[0];
  const newEntry = { ...entry, date };
  // We cast to `any` here because the store is auto-incrementing the ID,
  // so we don't have an ID when we add the object.
  const id = await store.add(newEntry as any);
  await tx.done;
  return { ...newEntry, id: id as number };
}

export async function getFoodEntriesForDate(date: string): Promise<FoodEntry[]> {
  const db = await getDb();
  const tx = db.transaction('food-entries', 'readonly');
  const store = tx.objectStore('food-entries');
  const index = store.index('date');
  return index.getAll(date);
}

export async function updateFoodEntry(entry: FoodEntry): Promise<FoodEntry> {
  const db = await getDb();
  const tx = db.transaction('food-entries', 'readwrite');
  await tx.store.put(entry);
  await tx.done;
  return entry;
}

export async function deleteFoodEntry(id: number): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('food-entries', 'readwrite');
  await tx.store.delete(id);
  await tx.done;
} 