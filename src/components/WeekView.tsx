import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getFoodEntriesForDate } from '@/lib/db';
import type { FoodEntry } from '@/lib/db';
import { eachDayOfInterval, startOfWeek, endOfWeek, format, subWeeks, addWeeks } from 'date-fns';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekViewProps {
  targetDate: Date;
  onDayClick: (date: Date) => void;
}

// This is a simplified approach. For a real app, you'd want to fetch all data once
// and filter it, or have more complex DB queries.
async function getEntriesForWeek(date: Date): Promise<Map<string, FoodEntry[]>> {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const entriesByDay = new Map<string, FoodEntry[]>();
  for (const day of days) {
    const dateString = format(day, 'yyyy-MM-dd');
    const entries = await getFoodEntriesForDate(dateString);
    entriesByDay.set(dateString, entries);
  }
  return entriesByDay;
}

export function WeekView({ targetDate, onDayClick }: WeekViewProps) {
  const [currentDate, setCurrentDate] = useState(targetDate);
  const [entries, setEntries] = useState<Map<string, FoodEntry[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useMemo(() => {
    setIsLoading(true);
    getEntriesForWeek(currentDate).then(data => {
      setEntries(data);
      setIsLoading(false);
    });
  }, [currentDate]);

  const dailyTotals = useMemo(() => {
    const totals = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
    entries.forEach((dayEntries, date) => {
      const dayTotal = dayEntries.reduce(
        (acc, entry) => {
          acc.calories += entry.calories;
          acc.protein += entry.protein;
          acc.carbs += entry.carbs;
          acc.fat += entry.fat;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      totals.set(date, dayTotal);
    });
    return totals;
  }, [entries]);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrevWeek}><ChevronLeft /></Button>
          <CardTitle>
            Week of {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleNextWeek}><ChevronRight /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {Array.from(dailyTotals.entries()).map(([date, total]) => (
              <button 
                key={date}
                className="flex justify-between p-2 rounded-lg odd:bg-muted w-full text-left"
                onClick={() => onDayClick(new Date(date))}
              >
                <p className="font-semibold">{format(new Date(date), 'EEEE, MMM d')}</p>
                <div className="text-right">
                  <p>{total.calories.toFixed(0)} kcal</p>
                  <p className="text-sm text-muted-foreground">
                    P: {total.protein.toFixed(0)}g | C: {total.carbs.toFixed(0)}g | F: {total.fat.toFixed(0)}g
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 