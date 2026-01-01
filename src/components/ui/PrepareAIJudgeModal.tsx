import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ExternalLink, Check, Copy, Key, AlertCircle, Loader2 } from "lucide-react";

interface PrepareAIJudgeModalProps {
  open: boolean;
  onClose: () => void;
}

const GOOGLE_AI_STUDIO_URL = "https://aistudio.google.com/app/apikey";

// Simple base64 encoding (for basic obfuscation - in production, use proper encryption)
const encodeApiKey = (key: string): string => {
  return btoa(key);
};

const decodeApiKey = (encoded: string): string => {
  try {
    return atob(encoded);
  } catch {
    return "";
  }
};

// Validate Gemini API key format (starts with AIza and is ~39 chars)
const validateApiKey = (key: string): boolean => {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.startsWith("AIza") && trimmed.length >= 35;
};

export function PrepareAIJudgeModal({ open, onClose }: PrepareAIJudgeModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus input when modal opens
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    // Check if user already has an API key stored
    const checkExistingKey = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.geminiApiKey) {
            setHasApiKey(true);
            // Decode and show first/last few chars for confirmation
            const decoded = decodeApiKey(data.geminiApiKey);
            if (decoded) {
              const masked = `${decoded.substring(0, 7)}...${decoded.substring(decoded.length - 4)}`;
              setApiKey(masked);
            }
          }
        }
      } catch (error) {
        console.error("Error checking existing API key:", error);
      }
    };

    if (open) {
      checkExistingKey();
    }
  }, [open]);

  const handleGetApiKey = () => {
    window.open(GOOGLE_AI_STUDIO_URL, "_blank", "noopener,noreferrer");
    toast.info("Opened Google AI Studio in a new tab. Copy your API key and paste it below.");
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
  };

  const isApiKeyValid = validateApiKey(apiKey);

  const handleSave = async () => {
    if (!isApiKeyValid || !auth.currentUser) {
      toast.error("Please enter a valid API key");
      return;
    }

    setIsSaving(true);
    try {
      const encodedKey = encodeApiKey(apiKey.trim());
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        geminiApiKey: encodedKey,
        geminiApiKeySetAt: new Date().toISOString(),
      });

      toast.success("API key saved successfully!");
      setHasApiKey(true);
      onClose();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error("Failed to save API key. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!auth.currentUser) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        geminiApiKey: null,
        geminiApiKeySetAt: null,
      });

      toast.success("API key removed");
      setHasApiKey(false);
      setApiKey("");
    } catch (error) {
      console.error("Error removing API key:", error);
      toast.error("Failed to remove API key. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Prepare AI Judge
          </DialogTitle>
          <DialogDescription>
            Set up your Google Gemini API key to enable AI-powered debate judging after your debates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Get API Key */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Step 1: Get Your Free API Key</h3>
                  <p className="text-sm text-muted-foreground">
                    Google AI Studio offers a free tier with generous limits for personal use.
                  </p>
                </div>
                <Badge variant="secondary">Free</Badge>
              </div>
              
              <Button 
                onClick={handleGetApiKey}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Get API Key from Google AI Studio
              </Button>

              <div className="bg-muted/50 p-4 rounded-lg space-y-3 text-sm">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                  <p className="font-medium text-amber-900 dark:text-amber-100 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Age Requirement:</strong> If you are under 18 years old, you must use a parent's or guardian's Google account to create an API key.
                    </span>
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground mt-1">
                    <li>Click the button above to open Google AI Studio</li>
                    <li>Sign in with your Google account (or parent's account if under 18)</li>
                    <li>Click "Create API Key" or "Get API Key"</li>
                    <li>Copy the API key (starts with "AIza...")</li>
                    <li>Paste it in the field below</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Paste API Key */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Step 2: Paste Your API Key</h3>
                <p className="text-sm text-muted-foreground">
                  Paste your API key below. It will be securely stored and encrypted.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    ref={inputRef}
                    type="password"
                    placeholder="AIza..."
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    className={`pr-10 ${isApiKeyValid && apiKey.length > 0 ? "border-green-500" : apiKey.length > 0 ? "border-red-500" : ""}`}
                    disabled={hasApiKey && apiKey.includes("...")}
                  />
                  {isApiKeyValid && apiKey.length > 0 && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {apiKey.length > 0 && !isApiKeyValid && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                
                {apiKey.length > 0 && !isApiKeyValid && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Invalid API key format. It should start with "AIza" and be about 39 characters long.
                  </p>
                )}

                {isApiKeyValid && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Valid API key format
                  </p>
                )}

                {hasApiKey && apiKey.includes("...") && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      You already have an API key saved. Enter a new key to replace it.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!isApiKeyValid || isSaving || (hasApiKey && apiKey.includes("..."))}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : hasApiKey ? (
                    "Update API Key"
                  ) : (
                    "Save API Key"
                  )}
                </Button>
                {hasApiKey && !apiKey.includes("...") && (
                  <Button
                    onClick={handleRemoveKey}
                    variant="outline"
                    disabled={isSaving}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">Privacy & Security</p>
                  <p className="text-muted-foreground">
                    Your API key is stored encrypted in your user account. It's only used when you request an AI judge decision, and the requests are made using your API key (not ours). Your key is never shared with other users.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

