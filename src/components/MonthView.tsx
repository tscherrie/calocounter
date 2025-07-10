import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getFoodEntriesForDate } from '@/lib/db';
import type { FoodEntry } from '@/lib/db';
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  subMonths,
  addMonths,
  getWeek,
} from 'date-fns';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

async function getEntriesForMonth(date: Date): Promise<FoodEntry[]> {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const allEntries: FoodEntry[] = [];
  for (const day of days) {
    const dateString = format(day, 'yyyy-MM-dd');
    const entries = await getFoodEntriesForDate(dateString);
    allEntries.push(...entries);
  }
  return allEntries;
}

export function MonthView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback((date: Date) => {
    setIsLoading(true);
    getEntriesForMonth(date).then(data => {
      setEntries(data);
      setIsLoading(false);
    });
  }, []);

  useMemo(() => {
    fetchEntries(currentDate);
  }, [currentDate, fetchEntries]);

  const weeklyTotals = useMemo(() => {
    const totals = new Map<number, { calories: number; protein: number; carbs: number; fat: number; startDate: Date }>();
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const weekNumber = getWeek(entryDate, { weekStartsOn: 1 });

      const weekData = totals.get(weekNumber) || {
        calories: 0, protein: 0, carbs: 0, fat: 0,
        startDate: startOfWeek(entryDate, { weekStartsOn: 1 }),
      };

      weekData.calories += entry.calories;
      weekData.protein += entry.protein;
      weekData.carbs += entry.carbs;
      weekData.fat += entry.fat;
      
      totals.set(weekNumber, weekData);
    });
    return Array.from(totals.values()).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [entries]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}><ChevronLeft /></Button>
          <CardTitle>
            {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}><ChevronRight /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {weeklyTotals.map(week => (
              <div key={week.startDate.toISOString()} className="flex justify-between p-2 rounded-lg odd:bg-muted">
                <p className="font-semibold">
                  Week of {format(week.startDate, 'MMM d')}
                </p>
                <div className="text-right">
                  <p>{(week.calories / 7).toFixed(0)} kcal / day</p>
                  <p className="text-sm text-muted-foreground">
                    Avg Daily: P: {(week.protein / 7).toFixed(0)}g | C: {(week.carbs / 7).toFixed(0)}g | F: {(week.fat / 7).toFixed(0)}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 