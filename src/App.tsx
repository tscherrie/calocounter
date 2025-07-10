import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { useStore } from "@/lib/store";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { getFoodEntriesForDate } from "@/lib/db";
import { FoodLog } from "@/components/FoodLog";

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { setApiKey, setFoodEntries } = useStore();

  useEffect(() => {
    const storedApiKey = localStorage.getItem("openai_api_key");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    
    const today = new Date().toISOString().split("T")[0];
    getFoodEntriesForDate(today).then(setFoodEntries);

  }, [setApiKey, setFoodEntries]);

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
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              <div className="flex justify-center py-8">
                <VoiceRecorder />
              </div>
              <FoodLog />
            </TabsContent>
            <TabsContent value="week">
              Week's content will go here.
            </TabsContent>
            <TabsContent value="month">
              Month's content will go here.
            </TabsContent>
          </Tabs>
        </main>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
      </div>
  );
}

export default App;
