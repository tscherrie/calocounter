import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FoodEntry } from '@/lib/db';

interface EditFoodEntryDialogProps {
  entry: FoodEntry | null;
  onClose: () => void;
  onSave: (newGrams: number) => void;
}

export function EditFoodEntryDialog({ entry, onClose, onSave }: EditFoodEntryDialogProps) {
  const [grams, setGrams] = useState(entry?.grams || 0);

  if (!entry) {
    return null;
  }

  const handleSave = () => {
    onSave(grams);
    onClose();
  };

  return (
    <AlertDialog open={!!entry} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Grams for {entry.name}</AlertDialogTitle>
          <AlertDialogDescription>
            Update the weight for this food item. The nutritional values will be recalculated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center grid-cols-4 gap-4">
            <Label htmlFor="grams" className="text-right">
              Grams
            </Label>
            <Input
              id="grams"
              type="number"
              value={grams}
              onChange={(e) => setGrams(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave}>Save</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 