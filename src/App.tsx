import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { useStore } from "@/lib/store";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { getFoodEntriesForDate } from "@/lib/db";
import { FoodLog } from "@/components/FoodLog";
import { WeekView } from "./components/WeekView";
import { MonthView } from "./components/MonthView";
import { useMemo } from 'react';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { foodEntries, setApiKey, setFoodEntries } = useStore();
  const [activeTab, setActiveTab] = useState("today");
  const [targetDate, setTargetDate] = useState(new Date());

  useEffect(() => {
    const storedApiKey = localStorage.getItem("openai_api_key");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    
    if (activeTab === "today") {
      const dateString = new Date(targetDate).toISOString().split("T")[0];
      getFoodEntriesForDate(dateString).then(setFoodEntries);
    }
  }, [setApiKey, setFoodEntries, activeTab, targetDate]);

  const totalCaloriesToday = useMemo(() => {
    return foodEntries.reduce((acc, entry) => acc + entry.calories, 0);
  }, [foodEntries]);

  return (
    <div className="flex justify-center w-full min-h-screen bg-muted/40">
      <div className="w-full max-w-4xl flex flex-col">
        <header className="flex items-center justify-between p-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Calo Counter</h1>
            <p className="text-muted-foreground">
              {activeTab === 'today' ? `${totalCaloriesToday.toFixed(0)} calories logged today` : `Viewing ${activeTab}`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-6 h-6" />
          </Button>
        </header>
        <main className="flex-grow p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              <VoiceRecorder />
              <FoodLog targetDate={targetDate} />
            </TabsContent>
            <TabsContent value="week">
              <WeekView 
                targetDate={targetDate} 
                onDayClick={(date) => {
                  setTargetDate(date);
                  setActiveTab("today");
                }}
              />
            </TabsContent>
            <TabsContent value="month">
              <MonthView 
                onWeekClick={(date) => {
                  setTargetDate(date);
                  setActiveTab("week");
                }}
              />
            </TabsContent>
          </Tabs>
        </main>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
      </div>
  );
}

export default App;
