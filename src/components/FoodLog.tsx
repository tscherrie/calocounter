import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Pencil } from "lucide-react";
import { EditFoodEntryDialog } from "./EditFoodEntryDialog";
import type { FoodEntry } from "@/lib/db";
import { updateFoodEntry as updateFoodEntryInDb } from "@/lib/db";
import { searchFood } from "@/lib/openfoodfacts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { format } from 'date-fns';

export function FoodLog({ targetDate }: { targetDate: Date }) {
  const { foodEntries, updateFoodEntry: updateFoodEntryInStore } = useStore();
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  const handleSave = async (newGrams: number) => {
    if (!editingEntry) return;

    // We need the original nutrient data per 100g.
    // We can re-fetch it, or store it. Let's re-fetch for simplicity.
    const nutrientData = await searchFood(editingEntry.name);
    if (!nutrientData) {
      // Handle case where food is not found anymore
      alert("Could not update entry: original food not found.");
      return;
    }

    const updatedEntry: FoodEntry = {
      ...editingEntry,
      grams: newGrams,
      calories: (nutrientData.calories / 100) * newGrams,
      protein: (nutrientData.protein / 100) * newGrams,
      carbs: (nutrientData.carbs / 100) * newGrams,
      fat: (nutrientData.fat / 100) * newGrams,
    };
    
    await updateFoodEntryInDb(updatedEntry);
    updateFoodEntryInStore(updatedEntry);
  };

  const totals = useMemo(() => {
    return foodEntries.reduce(
      (acc, entry) => {
        acc.calories += entry.calories;
        acc.protein += entry.protein;
        acc.carbs += entry.carbs;
        acc.fat += entry.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [foodEntries]);

  return (
    <div className="mt-8 space-y-4">
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-2xl">Summary for {format(targetDate, 'EEEE, MMM d')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-2xl font-bold">{totals.calories.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Calories</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-2xl font-bold">{totals.protein.toFixed(0)}g</p>
            <p className="text-sm text-muted-foreground">Protein</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-2xl font-bold">{totals.carbs.toFixed(0)}g</p>
            <p className="text-sm text-muted-foreground">Carbs</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-2xl font-bold">{totals.fat.toFixed(0)}g</p>
            <p className="text-sm text-muted-foreground">Fat</p>
          </div>
        </CardContent>
      </Card>
      
      {foodEntries.map((entry) => (
        <Card key={entry.id} className="glassmorphism flex items-center p-4">
          <div className="flex-grow">
            <p className="text-lg font-bold">{entry.name}</p>
            <p className="text-muted-foreground">{entry.grams.toFixed(0)}g &bull; {entry.calories.toFixed(0)} kcal</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setEditingEntry(entry)}>
            <Pencil className="w-5 h-5" />
          </Button>
        </Card>
      ))}

      <EditFoodEntryDialog
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={handleSave}
      />
    </div>
  );
} 