import { useState, useRef, useEffect } from 'react';
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
  const { apiKey, addFoodEntry: addFoodEntryToStore } = useStore();

  useEffect(() => {
    // Check initial permission status
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permission) => {
      setPermissionStatus(permission.state as PermissionState);
      permission.onchange = () => {
        setPermissionStatus(permission.state as PermissionState);
      };
    });
  }, []);

  const handleRecordingStop = async () => {
    // Stop the stream tracks to turn off the microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
    audioChunksRef.current = [];
    setIsProcessing(true);
    try {
      const transcript = await transcribeAudio(audioBlob);
      const foodData = await getStructuredFoodData(transcript);
      
      if (!Array.isArray(foodData)) {
        throw new Error("AI response was not an array of food items.");
      }

      for (const item of foodData) {
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
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      // This will trigger the browser's permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // We got permission, we can close the tracks as we will request them again on record
      stream.getTracks().forEach(track => track.stop());
      setIsRecording(false); // Reset state to allow recording to start
    } catch (error) {
      console.error("Error requesting microphone permission:", error);
    }
  };

  const handleToggleRecording = async () => {
    if (!apiKey) {
      alert("Please set your OpenAI API key in the settings first.");
      return;
    }

    if (permissionStatus !== 'granted') {
      handleRequestPermission();
      return;
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = handleRecordingStop;
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Could not access microphone. Please check permissions.");
      }
    }
  };

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
        className={`rounded-full w-24 h-24 transition-colors ${
          isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary'
        }`}
        disabled={isProcessing || permissionStatus === 'denied'}
      >
        <Mic className="w-12 h-12" />
      </Button>
      <p className="text-sm text-muted-foreground">
        {getButtonText()}
      </p>
    </div>
  );
} 