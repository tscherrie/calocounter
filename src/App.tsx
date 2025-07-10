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

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { setApiKey, setFoodEntries } = useStore();
  const [activeTab, setActiveTab] = useState("today");
  const [targetDate, setTargetDate] = useState(new Date());

  const handleSetTargetDate = (date: Date) => {
    setTargetDate(date);
    // You might want a different logic here, e.g. not always switching to today
    // For now, this provides a way to navigate
  };

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

  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-4xl flex flex-col min-h-screen">
        <header className="flex items-center justify-between p-4 border-b">
          <h1 className="text-2xl font-bold">Calo Counter</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-6 h-6" />
          </Button>
        </header>
        <main className="flex-grow p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              <div className="flex justify-center py-8">
                <VoiceRecorder />
              </div>
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
