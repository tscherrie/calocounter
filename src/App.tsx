import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Sparkles, TrendingUp, Calendar } from "lucide-react";
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

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "today": return <Sparkles className="w-4 h-4" />;
      case "week": return <TrendingUp className="w-4 h-4" />;
      case "month": return <Calendar className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-ocean-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-luxury-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex justify-center w-full p-4 safe-area-inset">
        <div className="w-full max-w-6xl flex flex-col min-h-screen">
          
          {/* Glassmorphism Header */}
          <header className="glass-card mb-8 animate-in">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-ocean-500 flex items-center justify-center shadow-glow">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold gradient-text">
                    Calo Counter
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your AI-powered nutrition companion
                  </p>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSettingsOpen(true)}
                className="glass-light hover:glass-heavy transition-all duration-300 hover:scale-110 focus-ring"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Enhanced Tab Navigation */}
          <div className="glass-card mb-8 animate-in" style={{ animationDelay: '0.1s' }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-transparent p-2 h-auto">
                {[
                  { value: "today", label: "Today", description: "Track your daily intake" },
                  { value: "week", label: "Week", description: "Weekly progress overview" },
                  { value: "month", label: "Month", description: "Monthly trends & insights" }
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className="relative flex flex-col items-center p-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500/20 data-[state=active]:to-ocean-500/20 data-[state=active]:text-foreground hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getTabIcon(tab.value)}
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{tab.description}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Main Content Area */}
          <main className="flex-grow space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              
              {/* Today Tab */}
              <TabsContent value="today" className="space-y-8 animate-in">
                {/* Voice Recorder Section */}
                <div className="glass-card p-8 text-center">
                  <div className="max-w-md mx-auto space-y-6">
                    <div>
                      <h2 className="text-2xl font-display font-semibold gradient-text mb-2">
                        Record Your Meal
                      </h2>
                      <p className="text-muted-foreground">
                        Speak naturally about what you ate, and AI will track the nutrition
                      </p>
                    </div>
                    <VoiceRecorder />
                  </div>
                </div>

                {/* Food Log */}
                <div className="glass-card animate-in" style={{ animationDelay: '0.2s' }}>
                  <FoodLog targetDate={targetDate} />
                </div>
              </TabsContent>

              {/* Week Tab */}
              <TabsContent value="week" className="animate-in">
                <div className="glass-card">
                  <WeekView 
                    targetDate={targetDate} 
                    onDayClick={(date) => {
                      setTargetDate(date);
                      setActiveTab("today");
                    }}
                  />
                </div>
              </TabsContent>

              {/* Month Tab */}
              <TabsContent value="month" className="animate-in">
                <div className="glass-card">
                  <MonthView 
                    onWeekClick={(date) => {
                      setTargetDate(date);
                      setActiveTab("week");
                    }}
                  />
                </div>
              </TabsContent>

            </Tabs>
          </main>

          {/* Footer */}
          <footer className="mt-12 text-center text-sm text-muted-foreground animate-in" style={{ animationDelay: '0.3s' }}>
            <p>Made with ❤️ for your wellness journey</p>
          </footer>

        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
