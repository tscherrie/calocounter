import { useStore } from "@/lib/store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Pencil } from "lucide-react";
import { EditFoodEntryDialog } from "./EditFoodEntryDialog";
import type { FoodEntry } from "@/lib/db";
import { updateFoodEntry as updateFoodEntryInDb } from "@/lib/db";
import { searchFood } from "@/lib/openfoodfacts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function FoodLog() {
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
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Today's Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Food</TableHead>
                <TableHead className="text-right">Grams</TableHead>
                <TableHead className="text-right">Calories</TableHead>
                <TableHead className="text-right">Protein (g)</TableHead>
                <TableHead className="text-right">Carbs (g)</TableHead>
                <TableHead className="text-right">Fat (g)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foodEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell className="text-right">{entry.grams.toFixed(0)}</TableCell>
                  <TableCell className="text-right">{entry.calories.toFixed(0)}</TableCell>
                  <TableCell className="text-right">{entry.protein.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{entry.carbs.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{entry.fat.toFixed(1)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditingEntry(entry)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-bold">
                <TableCell>Total</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">{totals.calories.toFixed(0)}</TableCell>
                <TableCell className="text-right">{totals.protein.toFixed(1)}</TableCell>
                <TableCell className="text-right">{totals.carbs.toFixed(1)}</TableCell>
                <TableCell className="text-right">{totals.fat.toFixed(1)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
      <EditFoodEntryDialog
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={handleSave}
      />
    </div>
  );
} 