import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { Key, Shield, Sparkles, Eye, EyeOff } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { apiKey, setApiKey } = useStore();
  const [localApiKey, setLocalApiKey] = useState(apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = () => {
    setApiKey(localApiKey);
    localStorage.setItem("openai_api_key", localApiKey);
    onClose();
  };

  const handleCancel = () => {
    setLocalApiKey(apiKey || "");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] glass-card border-0 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-luxury-500 to-ocean-500 flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-display gradient-text">
                Settings
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                Configure your AI-powered nutrition tracking
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-ocean-500/20 flex items-center justify-center">
                <Key className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <Label htmlFor="api-key" className="text-sm font-medium text-foreground">
                  OpenAI API Key
                </Label>
                <p className="text-xs text-muted-foreground">
                  Required for voice transcription and food analysis
                </p>
              </div>
            </div>

            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-12 glass-light border-muted/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="glass-card p-4 border-emerald-500/20">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-3 h-3 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Privacy & Security
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your API key is stored locally in your browser and is never sent to our servers. 
                  It's only used to communicate directly with OpenAI's services for transcription and analysis.
                </p>
              </div>
            </div>
          </div>

          {/* API Key Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <span className="text-sm text-muted-foreground">API Key Status:</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${localApiKey ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={`text-sm font-medium ${localApiKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {localApiKey ? 'Configured' : 'Not Set'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="glass-light hover:glass-heavy border-muted/50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="btn-gradient text-white border-0 shadow-glow"
            disabled={!localApiKey.trim()}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 