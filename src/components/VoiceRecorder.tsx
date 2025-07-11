import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Zap } from 'lucide-react';
import { transcribeAudio, getStructuredFoodData } from '@/lib/openai';
import { useStore } from '@/lib/store';
import { searchFood } from '@/lib/openfoodfacts';
import { addFoodEntry as addFoodEntryToDb } from '@/lib/db';

type PermissionState = 'prompt' | 'granted' | 'denied';

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  const [transcript, setTranscript] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { addFoodEntry: addFoodEntryToStore } = useStore();

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleRecordingStop = useCallback(async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
    console.log(`[VoiceRecorder] Audio blob size: ${audioBlob.size} bytes`);
    audioChunksRef.current = [];
    setIsProcessing(true);
    
    try {
      const transcriptResult = await transcribeAudio(audioBlob);
      console.log(`[VoiceRecorder] Transcript received: "${transcriptResult}"`);
      setTranscript(transcriptResult);
      
      if (!transcriptResult || transcriptResult.trim().length === 0) {
        alert("Could not understand audio. Please try speaking clearly.");
        setIsProcessing(false);
        setTranscript('');
        return;
      }

      const foodData = await getStructuredFoodData(transcriptResult);
      if (!Array.isArray(foodData)) {
        throw new Error("AI response was not an array of food items.");
      }

      for (const food of foodData) {
        const searchResults = await searchFood(food.name);
        if (searchResults.length > 0) {
          const product = searchResults[0];
          const entry = {
            id: Date.now() + Math.random(),
            name: food.name,
            quantity: food.quantity,
            unit: food.unit,
            calories: Math.round((product.nutriments?.['energy-kcal_100g'] || 0) * food.quantity / 100),
            protein: Math.round((product.nutriments?.proteins_100g || 0) * food.quantity / 100),
            carbs: Math.round((product.nutriments?.carbohydrates_100g || 0) * food.quantity / 100),
            fat: Math.round((product.nutriments?.fat_100g || 0) * food.quantity / 100),
            date: new Date().toISOString().split('T')[0],
          };
          await addFoodEntryToDb(entry);
          addFoodEntryToStore(entry);
        }
      }
    } catch (error) {
      console.error('[VoiceRecorder] Error processing audio:', error);
      alert(`Error processing audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  }, [addFoodEntryToStore]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      setPermissionStatus('granted');
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = handleRecordingStop;
      
      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error('[VoiceRecorder] Error accessing microphone:', error);
      setPermissionStatus('denied');
      alert('Please allow microphone access to record audio.');
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getButtonContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          </div>
          <span className="text-sm font-medium text-white">Processing...</span>
        </div>
      );
    }
    
    if (isRecording) {
      return (
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <MicOff className="w-8 h-8 text-white" />
            <div className="absolute -inset-2 rounded-full bg-rose-500/30 animate-ping" />
            <div className="absolute -inset-1 rounded-full bg-rose-500/50 animate-pulse" />
          </div>
          <span className="text-sm font-medium text-white">Recording...</span>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          <Mic className="w-8 h-8 text-white" />
          <Zap className="w-3 h-3 text-emerald-300 absolute -top-1 -right-1" />
        </div>
        <span className="text-sm font-medium text-white">Tap to Record</span>
      </div>
    );
  };

  const getStatusMessage = () => {
    if (permissionStatus === 'denied') {
      return (
        <div className="text-center space-y-2">
          <p className="text-rose-500 font-medium">Microphone access denied</p>
          <p className="text-xs text-muted-foreground">Please enable microphone permissions in your browser settings</p>
        </div>
      );
    }
    
    if (transcript) {
      return (
        <div className="glass-card p-4 max-w-md mx-auto">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Transcribed:</p>
              <p className="text-sm text-foreground italic">"{transcript}"</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (isRecording) {
      return (
        <div className="text-center space-y-2">
          <p className="text-emerald-500 font-medium">Listening...</p>
          <p className="text-xs text-muted-foreground">Speak clearly about what you ate</p>
        </div>
      );
    }
    
    if (isProcessing) {
      return (
        <div className="text-center space-y-2">
          <p className="text-ocean-500 font-medium">Analyzing your meal...</p>
          <p className="text-xs text-muted-foreground">AI is extracting nutrition information</p>
        </div>
      );
    }
    
    return (
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">Ready to track your nutrition</p>
        <p className="text-xs text-muted-foreground">Tap the button and describe what you ate</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Main Recording Button */}
      <div className="relative">
        {/* Ambient Glow Effect */}
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
          isRecording ? 'bg-rose-500/20 scale-150 animate-pulse' : 
          isProcessing ? 'bg-ocean-500/20 scale-125 animate-spin' :
          'bg-emerald-500/20 scale-110'
        }`} />
        
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || permissionStatus === 'denied'}
          className={`
            relative w-32 h-32 rounded-full border-0 transition-all duration-300 transform hover:scale-105 active:scale-95 focus-ring
            ${isRecording 
              ? 'voice-button recording bg-gradient-to-br from-rose-500 to-rose-600 shadow-glow-lg' 
              : isProcessing
              ? 'bg-gradient-to-br from-ocean-500 to-ocean-600 shadow-glow'
              : 'voice-button bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-glow'
            }
            ${permissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {getButtonContent()}
        </Button>
      </div>

      {/* Status Message */}
      <div className="min-h-[60px] flex items-center">
        {getStatusMessage()}
      </div>

      {/* Visual Feedback - Audio Waves */}
      {isRecording && (
        <div className="flex items-center justify-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-emerald-500 to-ocean-500 rounded-full animate-pulse"
              style={{
                height: `${20 + Math.random() * 30}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.8s'
              }}
            />
          ))}
        </div>
      )}

      {/* Quick Tips */}
      {!isRecording && !isProcessing && permissionStatus !== 'denied' && (
        <div className="glass-card p-4 max-w-md">
          <h3 className="text-sm font-medium text-center mb-3 gradient-text">💡 Quick Tips</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• Speak clearly: "I had 2 slices of pizza and a cola"</p>
            <p>• Include quantities: "150g of chicken breast"</p>
            <p>• Be specific: "Large apple" vs "Green apple"</p>
          </div>
        </div>
      )}
    </div>
  );
} 