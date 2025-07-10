import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { transcribeAudio, getStructuredFoodData } from '@/lib/openai';
import { useStore } from '@/lib/store';
import { searchFood } from '@/lib/openfoodfacts';
import { addFoodEntry as addFoodEntryToDb } from '@/lib/db';

type PermissionState = 'prompt' | 'granted' | 'denied';

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
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
      const transcript = await transcribeAudio(audioBlob);
      console.log(`[VoiceRecorder] Transcript received: "${transcript}"`);
      if (!transcript || transcript.trim().length === 0) {
        alert("Could not understand audio. Please try speaking clearly.");
        setIsProcessing(false);
        return;
      }

      if (!transcript) return;
      
      const foodData = await getStructuredFoodData(transcript);
      if (!Array.isArray(foodData)) {
        throw new Error("AI response was not an array of food items.");
      }

      for (const item of foodData) {
        if (item.name) {
            const nutrientData = await searchFood(item.name);
            if (nutrientData) {
            const grams = item.grams || 100;
            const entry = {
                name: nutrientData.productName,
                grams,
                calories: (nutrientData.calories / 100) * grams,
                carbs: (nutrientData.carbs / 100) * grams,
                protein: (nutrientData.protein / 100) * grams,
                fat: (nutrientData.fat / 100) * grams,
            };
            const newEntry = await addFoodEntryToDb(entry);
            addFoodEntryToStore(newEntry);
            } else {
            console.warn(`Could not find nutrient data for ${item.name}`);
            }
        }
      }
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [addFoodEntryToStore]);

  const startRecording = useCallback(async () => {
    if (isRecording || permissionStatus !== 'granted') return;

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const recorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = handleRecordingStop;
      
      recorder.start();
      setIsRecording(true);

    } catch (error) {
      console.error("Error starting recording:", error);
      setPermissionStatus('denied');
    }
  }, [isRecording, permissionStatus, handleRecordingStop]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (permissionStatus !== 'granted') {
        handleRequestPermission();
      } else {
        await startRecording();
      }
    }
  };
  
  const handleRequestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
    } catch (error) {
      console.error("Error requesting microphone permission:", error);
      setPermissionStatus('denied');
    }
  }, []);

  useEffect(() => {
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permission) => {
      setPermissionStatus(permission.state);
      permission.onchange = () => {
        setPermissionStatus(permission.state);
      };
    });
  }, []);

  const getButtonText = () => {
    if (permissionStatus === 'denied') return 'Mic blocked';
    if (permissionStatus === 'prompt') return 'Allow Mic';
    if (isProcessing) return 'Processing...';
    if (isRecording) return 'Recording...';
    return 'Tap to record';
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={handleToggleRecording}
        size="lg"
        className={`relative rounded-full w-24 h-24 transition-colors text-white shadow-card
          ${isRecording ? 'bg-primary-dark' : 'bg-primary'}
        `}
        disabled={isProcessing || permissionStatus === 'denied'}
      >
        {isRecording && (
          <span className="absolute inset-0 rounded-full animate-pulse-ring bg-primary opacity-70"></span>
        )}
        <Mic className="w-12 h-12 relative" />
      </Button>
      <p className="text-sm text-muted-foreground">
        {getButtonText()}
      </p>
    </div>
  );
} 