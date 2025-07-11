import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Sun, Moon } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { useStore } from "@/lib/store";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { getFoodEntriesForDate } from "@/lib/db";
import { FoodLog } from "@/components/FoodLog";
import { WeekView } from "./components/WeekView";
import { MonthView } from "./components/MonthView";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(isDarkMode ? 'light' : 'dark');
    root.classList.add(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-16"
      >
        {isDarkMode ? <Sun /> : <Moon />}
      </Button>
      {children}
    </div>
  );
}


function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { setApiKey, setFoodEntries } = useStore();
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

  return (
    <ThemeProvider>
      <div className="flex justify-center w-full font-sans">
        <div className="w-full max-w-4xl flex flex-col min-h-screen p-4 md:p-8">
          <header className="flex items-center justify-between p-4 border-b rounded-t-lg glassmorphism">
            <h1 className="text-3xl font-bold text-foreground">Calo Counter</h1>
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-6 h-6 text-foreground" />
            </Button>
          </header>
          <main className="flex-grow p-4 rounded-b-lg glassmorphism">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-transparent">
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
    </ThemeProvider>
  );
}

export default App;
