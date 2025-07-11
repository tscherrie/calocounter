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
import { Pencil, TrendingUp, Flame, Zap, Droplets, Cookie } from "lucide-react";
import { EditFoodEntryDialog } from "./EditFoodEntryDialog";
import type { FoodEntry } from "@/lib/db";
import { updateFoodEntry as updateFoodEntryInDb } from "@/lib/db";
import { searchFood } from "@/lib/openfoodfacts";

import { format } from 'date-fns';

export function FoodLog({ targetDate }: { targetDate: Date }) {
  const { foodEntries, updateFoodEntry: updateFoodEntryInStore } = useStore();
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  const handleSave = async (newQuantity: number) => {
    if (!editingEntry) return;

    // We need the original nutrient data per 100g.
    // We can re-fetch it, or store it. Let's re-fetch for simplicity.
    const searchResults = await searchFood(editingEntry.name);
    if (!searchResults || searchResults.length === 0) {
      // Handle case where food is not found anymore
      alert("Could not update entry: original food not found.");
      return;
    }

    const product = searchResults[0];
    const updatedEntry: FoodEntry = {
      ...editingEntry,
      quantity: newQuantity,
      calories: Math.round((product.nutriments?.['energy-kcal_100g'] || 0) * newQuantity / 100),
      protein: Math.round((product.nutriments?.proteins_100g || 0) * newQuantity / 100),
      carbs: Math.round((product.nutriments?.carbohydrates_100g || 0) * newQuantity / 100),
      fat: Math.round((product.nutriments?.fat_100g || 0) * newQuantity / 100),
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

  // Daily goals (these could be made configurable)
  const dailyGoals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67
  };

  const getNutritionPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getNutritionColor = (percentage: number) => {
    if (percentage < 50) return 'from-rose-500 to-sunset-500';
    if (percentage < 80) return 'from-sunset-500 to-emerald-500';
    return 'from-emerald-500 to-ocean-500';
  };

  const NutritionCard = ({ 
    title, 
    current, 
    goal, 
    unit, 
    icon: Icon, 
    gradient 
  }: {
    title: string;
    current: number;
    goal: number;
    unit: string;
    icon: any;
    gradient: string;
  }) => {
    const percentage = getNutritionPercentage(current, goal);
    
    return (
      <div className="nutrition-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-glass-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">{unit}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground">{Math.round(current)}</p>
            <p className="text-xs text-muted-foreground">/ {goal}</p>
          </div>
        </div>
        
        <div className="progress-bar h-2 mb-2">
          <div 
            className={`progress-fill bg-gradient-to-r ${getNutritionColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(percentage)}% of goal</span>
          <span>{Math.round(goal - current)} {unit} remaining</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-semibold gradient-text">
          Nutrition Log
        </h2>
        <p className="text-muted-foreground">
          {format(targetDate, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Nutrition Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NutritionCard
          title="Calories"
          current={totals.calories}
          goal={dailyGoals.calories}
          unit="kcal"
          icon={Flame}
          gradient="from-rose-500 to-sunset-500"
        />
        <NutritionCard
          title="Protein"
          current={totals.protein}
          goal={dailyGoals.protein}
          unit="g"
          icon={Zap}
          gradient="from-emerald-500 to-ocean-500"
        />
        <NutritionCard
          title="Carbs"
          current={totals.carbs}
          goal={dailyGoals.carbs}
          unit="g"
          icon={Cookie}
          gradient="from-sunset-500 to-luxury-500"
        />
        <NutritionCard
          title="Fat"
          current={totals.fat}
          goal={dailyGoals.fat}
          unit="g"
          icon={Droplets}
          gradient="from-ocean-500 to-luxury-500"
        />
      </div>

      {/* Food Entries Table */}
      {foodEntries.length > 0 ? (
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-semibold">Food Entries</h3>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-muted/50">
                  <TableHead className="font-medium text-foreground">Food</TableHead>
                  <TableHead className="text-right font-medium text-foreground">Quantity</TableHead>
                  <TableHead className="text-right font-medium text-foreground">Calories</TableHead>
                  <TableHead className="text-right font-medium text-foreground">Protein (g)</TableHead>
                  <TableHead className="text-right font-medium text-foreground">Carbs (g)</TableHead>
                  <TableHead className="text-right font-medium text-foreground">Fat (g)</TableHead>
                  <TableHead className="text-right font-medium text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {foodEntries.map((entry, index) => (
                  <TableRow 
                    key={entry.id || index} 
                                         className="border-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-ocean-500" />
                        <span>{entry.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {entry.quantity} {entry.unit}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {Math.round(entry.calories)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Math.round(entry.protein)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Math.round(entry.carbs)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Math.round(entry.fat)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingEntry(entry)}
                        className="glass-light hover:glass-heavy transition-all duration-200 hover:scale-105"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="border-muted bg-muted/20">
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {Math.round(totals.calories)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {Math.round(totals.protein)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {Math.round(totals.carbs)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {Math.round(totals.fat)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-ocean-500/20 flex items-center justify-center">
            <Flame className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
          <p className="text-muted-foreground mb-6">
            Start tracking your nutrition by recording a meal above
          </p>
          <div className="flex justify-center">
            <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 to-ocean-500 rounded-full" />
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingEntry && (
        <EditFoodEntryDialog
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          entry={editingEntry}
          onSave={handleSave}
        />
      )}
    </div>
  );
} 