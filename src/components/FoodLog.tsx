import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { EditFoodEntryDialog } from "./EditFoodEntryDialog";
import type { FoodEntry } from "@/lib/db";
import { updateFoodEntry as updateFoodEntryInDb, deleteFoodEntry as deleteFoodEntryInDb } from "@/lib/db";
import { searchFood } from "@/lib/openfoodfacts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { format } from 'date-fns';

export function FoodLog({ targetDate }: { targetDate: Date }) {
  const { foodEntries, updateFoodEntry: updateFoodEntryInStore, removeFoodEntry } = useStore();
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
  
  const handleDelete = async (id: number) => {
    await deleteFoodEntryInDb(id);
    removeFoodEntry(id);
  }

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

  if (foodEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">No food logged for this day yet.</p>
        <p>Tap the microphone to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Summary for {format(targetDate, 'EEEE, MMM d')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{totals.calories.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Calories</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{totals.protein.toFixed(0)}g</p>
            <p className="text-sm text-muted-foreground">Protein</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{totals.carbs.toFixed(0)}g</p>
            <p className="text-sm text-muted-foreground">Carbs</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{totals.fat.toFixed(0)}g</p>
            <p className="text-sm text-muted-foreground">Fat</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-3">
        {foodEntries.map((entry) => (
          <Card key={entry.id} className="overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{entry.name}</h3>
                <p className="text-muted-foreground">{entry.grams.toFixed(0)}g &bull; {entry.calories.toFixed(0)} kcal</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditingEntry(entry)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(entry.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EditFoodEntryDialog
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={handleSave}
      />
    </div>
  );
} 