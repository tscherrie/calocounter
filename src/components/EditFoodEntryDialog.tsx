import { useState } from 'react';
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
  isOpen: boolean;
  entry: FoodEntry | null;
  onClose: () => void;
  onSave: (newQuantity: number) => void;
}

export function EditFoodEntryDialog({ isOpen, entry, onClose, onSave }: EditFoodEntryDialogProps) {
  const [quantity, setQuantity] = useState(entry?.quantity || 0);

  if (!entry) {
    return null;
  }

  const handleSave = () => {
    onSave(quantity);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="glass-card border-0 bg-background/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="gradient-text">Edit Food Entry</AlertDialogTitle>
          <AlertDialogDescription>
            Update the quantity for <span className="font-medium">{entry.name}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">
              Quantity ({entry.unit})
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="glass-light border-border/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              min="0"
              step="0.1"
            />
          </div>
        </div>
        
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            onClick={onClose}
            className="glass-light hover:glass-heavy border-border/50"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSave}
            className="btn-gradient text-white border-0 shadow-glow"
          >
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 