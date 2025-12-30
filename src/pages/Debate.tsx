import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { auth, db, functions, httpsCallable } from "@/lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Play, Pause, RotateCcw, Mic, MicOff, Video, VideoOff, ChevronDown, ChevronUp, Copy, ExternalLink, Link2, Check } from "lucide-react";
import { createGoogleMeet as createMeetUtil, formatMeetId, generateMeetingInstructions } from "@/lib/googleMeet";
import { createAdvancedMeetUrl, generateMeetingInvitation, createQRCodeUrl, formatMeetingId } from "@/lib/googleMeetConfig";

type DebatePhase = "prep" | "speech1" | "cross1" | "speech2" | "cross2" | "rebuttal1" | "rebuttal2" | "summary1" | "summary2";

interface DebateSettings {
  format: "LD" | "PF" | "AOTB";
  timeControl?: string;
  prepTime: number;
  speechTime: number;
  crossTime: number;
  rebuttalTime: number;
  summaryTime: number;
}

interface DebateState {
  currentPhase: DebatePhase;
  timeRemaining: number;
  isActive: boolean;
  currentSpeaker: "affirmative" | "negative" | null;
  prepTimeRemaining: number;
  bothPlayersJoined: boolean;
}

export default function Debate() {
  const { debateId } = useParams<{ debateId: string }>();
  const navigate = useNavigate();
  const [debateSettings, setDebateSettings] = useState<DebateSettings | null>(null);
  const [debateState, setDebateState] = useState<DebateState>({
    currentPhase: "speech1",
    timeRemaining: 0,
    isActive: false,
    currentSpeaker: null,
    prepTimeRemaining: 0,
    bothPlayersJoined: false
  });
  const [isHost, setIsHost] = useState(false);
  const [googleMeetUrl, setGoogleMeetUrl] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isStructureCollapsed, setIsStructureCollapsed] = useState(true);
  const [prepTimerActive, setPrepTimerActive] = useState(false);
  const [showMeetInput, setShowMeetInput] = useState(false);
  const [meetLinkInput, setMeetLinkInput] = useState("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!debateId) return;

    const unsubscribe = onSnapshot(doc(db, "debates", debateId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const currentUser = auth.currentUser;
        
        if (data.hostId === currentUser?.uid) {
          setIsHost(true);
        }

        // Load Google Meet URL if it exists
        if (data.googleMeetUrl) {
          setGoogleMeetUrl(data.googleMeetUrl);
        } else if (data.meetId) {
          // If we have a meetId but no URL, construct it
          const meetUrl = `https://meet.google.com/${data.meetId}`;
          setGoogleMeetUrl(meetUrl);
        }

        // Set debate settings based on format
        if (data.format === "LD") {
          setDebateSettings({
            format: "LD",
            timeControl: data.timeControl,
            prepTime: 4 * 60, // 4 minutes
            speechTime: 6 * 60, // 6 minutes
            crossTime: 3 * 60, // 3 minutes
            rebuttalTime: 4 * 60, // 4 minutes
            summaryTime: 2 * 60 // 2 minutes
          });
          setDebateState(prev => ({ ...prev, prepTimeRemaining: 4 * 60 }));
        } else if (data.format === "PF") {
          setDebateSettings({
            format: "PF",
            timeControl: data.timeControl,
            prepTime: 2 * 60, // 2 minutes
            speechTime: 4 * 60, // 4 minutes
            crossTime: 3 * 60, // 3 minutes
            rebuttalTime: 4 * 60, // 4 minutes
            summaryTime: 2 * 60 // 2 minutes
          });
          setDebateState(prev => ({ ...prev, prepTimeRemaining: 2 * 60 }));
        } else if (data.format === "AOTB") {
          // AOTB format - similar to LD but with different structure
          setDebateSettings({
            format: "AOTB",
            timeControl: data.timeControl,
            prepTime: 4 * 60, // 4 minutes
            speechTime: 6 * 60, // 6 minutes
            crossTime: 3 * 60, // 3 minutes
            rebuttalTime: 4 * 60, // 4 minutes
            summaryTime: 2 * 60 // 2 minutes
          });
          setDebateState(prev => ({ ...prev, prepTimeRemaining: 4 * 60 }));
        }

        // Check if both players have joined
        const bothJoined = !!(data.opponentId && data.hostId);
        setDebateState(prev => ({ ...prev, bothPlayersJoined: bothJoined }));
      }
    });

    return () => unsubscribe();
  }, [debateId]);

  useEffect(() => {
    if (debateState.isActive && debateState.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setDebateState(prev => {
          if (prev.timeRemaining <= 1) {
            // Time's up - move to next phase
            handlePhaseComplete();
            return { ...prev, timeRemaining: 0, isActive: false };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [debateState.isActive, debateState.timeRemaining]);

  // Separate prep timer effect
  useEffect(() => {
    if (prepTimerActive && debateState.prepTimeRemaining > 0) {
      prepTimerRef.current = setInterval(() => {
        setDebateState(prev => {
          if (prev.prepTimeRemaining <= 1) {
            // Prep time is up
            setPrepTimerActive(false);
            toast.info("Preparation time is up!");
            return { ...prev, prepTimeRemaining: 0 };
          }
          return { ...prev, prepTimeRemaining: prev.prepTimeRemaining - 1 };
        });
      }, 1000);
    }

    return () => {
      if (prepTimerRef.current) {
        clearInterval(prepTimerRef.current);
      }
    };
  }, [prepTimerActive, debateState.prepTimeRemaining]);

  const handlePhaseComplete = () => {
    // Logic to move to next phase
    const phases: DebatePhase[] = ["speech1", "cross1", "speech2", "cross2", "rebuttal1", "rebuttal2", "summary1", "summary2"];
    const currentIndex = phases.indexOf(debateState.currentPhase);
    
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      setDebateState(prev => ({
        ...prev,
        currentPhase: nextPhase,
        timeRemaining: getTimeForPhase(nextPhase),
        isActive: false
      }));
      
      // Play notification sound (optional)
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play().catch(console.error);
      }
      
      toast.info(`Phase complete! Moving to ${getPhaseDisplayName(nextPhase)}`);
    } else {
      // Debate complete
      toast.success("Debate complete!");
      setDebateState(prev => ({ ...prev, isActive: false }));
    }
  };

  const getTimeForPhase = (phase: DebatePhase): number => {
    if (!debateSettings) return 0;
    
    switch (phase) {
      case "speech1":
      case "speech2": return debateSettings.speechTime;
      case "cross1":
      case "cross2": return debateSettings.crossTime;
      case "rebuttal1":
      case "rebuttal2": return debateSettings.rebuttalTime;
      case "summary1":
      case "summary2": return debateSettings.summaryTime;
      default: return 0;
    }
  };

  const getPhaseDisplayName = (phase: DebatePhase): string => {
    switch (phase) {
      case "prep": return "Preparation Time";
      case "speech1": return "First Affirmative Speech";
      case "cross1": return "First Cross-Examination";
      case "speech2": return "First Negative Speech";
      case "cross2": return "Second Cross-Examination";
      case "rebuttal1": return "First Rebuttal";
      case "rebuttal2": return "Second Rebuttal";
      case "summary1": return "First Summary";
      case "summary2": return "Second Summary";
      default: return "Unknown Phase";
    }
  };

  const startTimer = () => {
    if (debateState.timeRemaining === 0) {
      setDebateState(prev => ({ ...prev, timeRemaining: getTimeForPhase(prev.currentPhase) }));
    }
    setDebateState(prev => ({ ...prev, isActive: true }));
  };

  const pauseTimer = () => {
    setDebateState(prev => ({ ...prev, isActive: false }));
  };

  const resetTimer = () => {
    setDebateState(prev => ({ 
      ...prev, 
      timeRemaining: getTimeForPhase(prev.currentPhase),
      isActive: false 
    }));
  };

  const startPrepTimer = () => {
    if (debateState.prepTimeRemaining === 0) {
      setDebateState(prev => ({ 
        ...prev, 
        prepTimeRemaining: debateSettings?.prepTime || 0 
      }));
    }
    setPrepTimerActive(true);
  };

  const pausePrepTimer = () => {
    setPrepTimerActive(false);
  };

  const resetPrepTimer = () => {
    setDebateState(prev => ({ 
      ...prev, 
      prepTimeRemaining: debateSettings?.prepTime || 0 
    }));
    setPrepTimerActive(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    if (!debateSettings) return 0;
    const totalTime = getTimeForPhase(debateState.currentPhase);
    if (totalTime === 0) return 0;
    return ((totalTime - debateState.timeRemaining) / totalTime) * 100;
  };

  const createGoogleMeet = async () => {
    if (!isHost || !debateId) return;
    
    try {
      // Try to create meeting via Cloud Function (if available)
      const createMeetFunction = httpsCallable(functions, 'createGoogleMeet');
      const result = await createMeetFunction({
        title: `${debateSettings?.format} Debate`,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
      });
      
      const meetLink = (result.data as any)?.meetLink;
      if (meetLink) {
        setGoogleMeetUrl(meetLink);
        await updateDoc(doc(db, "debates", debateId), {
          googleMeetUrl: meetLink,
          createdAt: serverTimestamp()
        });
        toast.success("Google Meet created successfully!");
        return;
      }
    } catch (error: any) {
      console.log("Cloud Function not available or failed, using manual method:", error);
      // If function doesn't exist or fails, fall through to manual method
    }
    
    // Fallback: Open Google Meet in a new tab to create a meeting
    // User will get a meeting link they can share
    window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
    setShowMeetInput(true);
    toast.info("Create a meeting in the new tab, then paste the meeting link below");
  };

  const saveMeetLink = async () => {
    if (!debateId || !meetLinkInput.trim()) {
      toast.error("Please enter a valid Google Meet link");
      return;
    }

    // Validate it's a Google Meet link
    if (!meetLinkInput.includes('meet.google.com')) {
      toast.error("Please enter a valid Google Meet link (must contain meet.google.com)");
      return;
    }

    try {
      const cleanUrl = meetLinkInput.trim();
      setGoogleMeetUrl(cleanUrl);
      setShowMeetInput(false);
      setMeetLinkInput("");

      // Update the debate document
      await updateDoc(doc(db, "debates", debateId), {
        googleMeetUrl: cleanUrl,
        createdAt: serverTimestamp()
      });

      toast.success("Google Meet link saved!");
    } catch (error) {
      console.error("Error saving Google Meet link:", error);
      toast.error("Failed to save Google Meet link");
    }
  };

  const copyMeetingInstructions = () => {
    if (!googleMeetUrl) return;
    
    const meetId = googleMeetUrl.split('/').pop()?.split('?')[0] || '';
    const hostName = auth.currentUser?.displayName || auth.currentUser?.email || 'Host';
    
    const invitation = generateMeetingInvitation(
      meetId,
      `${debateSettings?.format} Debate`,
      hostName,
      undefined, // No specific start time
      {
        autoJoinWithMic: false,
        autoJoinWithVideo: false,
        muteOnEntry: true,
        enableChat: true,
        enableHandRaise: true,
        enableScreenShare: true
      }
    );
    
    navigator.clipboard.writeText(invitation);
    toast.success("Meeting invitation copied to clipboard!");
  };

  const startDebate = async () => {
    if (!isHost) return;
    
    // Check if both players have joined
    if (!debateState.bothPlayersJoined) {
      toast.error("Both players must join the debate before starting");
      return;
    }
    
    try {
      // Update match status to active
      await updateDoc(doc(db, "debates", debateId!), {
        status: "active",
        startedAt: serverTimestamp()
      });
      
      toast.success("Debate started!");
    } catch (error) {
      console.error("Error starting debate:", error);
      toast.error("Failed to start debate");
    }
  };

  const joinDebate = async () => {
    try {
      // Update match status to active if not already
      if (debateSettings && debateId) {
        await updateDoc(doc(db, "debates", debateId), {
          status: "active",
          joinedAt: serverTimestamp()
        });
        toast.success("Joined debate!");
      }
    } catch (error) {
      console.error("Error joining debate:", error);
      toast.error("Failed to join debate");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {debateSettings?.format} Debate
            </h1>
            <p className="text-muted-foreground">
              {getPhaseDisplayName(debateState.currentPhase)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/lobby")}>
              Back to Lobby
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Google Meet and Controls */}
          <div className="space-y-6">
            {/* Google Meet Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Video Conference
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsVideoOn(!isVideoOn)}
                    >
                      {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAudioOn(!isAudioOn)}
                    >
                      {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {googleMeetUrl ? (
                  <div className="space-y-4">
                    {/* Video Conference - Simple button, Google Meet handles overlay natively */}
                    <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg overflow-hidden border border-border relative flex items-center justify-center">
                      <div className="text-center p-6 space-y-4 z-10">
                        <div className="h-16 w-16 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-white">Video Conference</h3>
                          <p className="text-white/80 text-sm max-w-md">
                            Click to join the meeting. Google Meet will create an overlay when you switch tabs.
                          </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <Button
                            size="lg"
                            className="bg-white text-blue-600 hover:bg-white/90"
                            onClick={() => {
                              window.open(googleMeetUrl, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <Video className="h-5 w-5 mr-2" />
                            Join Meeting
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                            onClick={() => {
                              navigator.clipboard.writeText(googleMeetUrl);
                              toast.success("Meeting link copied to clipboard!");
                            }}
                          >
                            <Copy className="h-5 w-5 mr-2" />
                            Copy Link
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Collapsible Meeting Details */}
                    <div className="border rounded-lg">
                      <button
                        onClick={() => setIsStructureCollapsed(!isStructureCollapsed)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Meeting Details</span>
                        </div>
                        {isStructureCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {!isStructureCollapsed && (
                        <div className="p-3 pt-0 space-y-3 border-t">
                          <div className="space-y-3 text-xs">
                            <div className="pt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Meeting ID:</span>
                                <span className="font-mono text-foreground font-bold">
                                  {formatMeetingId(googleMeetUrl.split('/').pop()?.split('?')[0] || '')}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Format:</span>
                              <span className="text-foreground font-medium">{debateSettings?.format}</span>
                            </div>
                            <div className="pt-2 border-t border-border">
                              <p className="text-muted-foreground mb-1">Quick Join:</p>
                              <p className="font-mono text-foreground break-all text-xs">{googleMeetUrl}</p>
                            </div>
                          </div>
                          
                          {/* QR Code for mobile joining */}
                          <div className="text-center pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-2">Scan to join on mobile</p>
                            <img 
                              src={createQRCodeUrl(googleMeetUrl.split('/').pop()?.split('?')[0] || '')}
                              alt="QR Code for Google Meet"
                              className="w-24 h-24 mx-auto border border-border rounded-lg"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {showMeetInput ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Paste Google Meet Link</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Create a meeting at meet.google.com/new, then paste the link here
                          </p>
                          <div className="flex gap-2">
                            <Input
                              type="url"
                              placeholder="https://meet.google.com/abc-defg-hij"
                              value={meetLinkInput}
                              onChange={(e) => setMeetLinkInput(e.target.value)}
                              className="flex-1"
                            />
                            <Button onClick={saveMeetLink} size="sm">
                              <Check className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setShowMeetInput(false);
                                setMeetLinkInput("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-4">
                        <p className="text-muted-foreground">No meeting link added yet</p>
                    {isHost ? (
                      <div className="space-y-2">
                        <Button onClick={createGoogleMeet} className="w-full">
                          <Link2 className="h-4 w-4 mr-2" />
                          Create & Add Google Meet Link
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          This will open Google Meet in a new tab. Create a meeting and paste the link.
                        </p>
                        <Button 
                          onClick={startDebate} 
                          variant="default" 
                          className="w-full"
                          disabled={!debateState.bothPlayersJoined}
                        >
                          {debateState.bothPlayersJoined ? "Start Debate" : "Waiting for Opponent"}
                        </Button>
                        {!debateState.bothPlayersJoined && (
                          <p className="text-xs text-muted-foreground text-center">
                            Both players must join before starting
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button onClick={joinDebate} variant="default" className="w-full">
                          Join Debate
                        </Button>
                        <p className="text-xs text-muted-foreground">
                              Waiting for host to add meeting link
                        </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timer Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Timer Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={startTimer}
                    disabled={debateState.isActive}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                  <Button
                    onClick={pauseTimer}
                    disabled={!debateState.isActive}
                    variant="outline"
                    className="flex-1"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    onClick={resetTimer}
                    variant="outline"
                    size="icon"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-foreground">
                    {formatTime(debateState.timeRemaining)}
                  </div>
                  <Progress value={getProgressPercentage()} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Debate Info and Phases */}
          <div className="space-y-6">
            {/* Current Phase Info */}
            <Card>
              <CardHeader>
                <CardTitle>Current Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Phase:</span>
                    <Badge variant="default">
                      {getPhaseDisplayName(debateState.currentPhase)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Limit:</span>
                    <span className="font-mono">
                      {formatTime(getTimeForPhase(debateState.currentPhase))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={debateState.isActive ? "default" : "secondary"}>
                      {debateState.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preparation Timer */}
            <Card>
              <CardHeader>
                <CardTitle>Preparation Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-3xl font-mono font-bold text-foreground">
                    {formatTime(debateState.prepTimeRemaining)}
                  </div>
                  
                  <Progress 
                    value={((debateSettings?.prepTime || 0) - debateState.prepTimeRemaining) / (debateSettings?.prepTime || 1) * 100} 
                  />
                  
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={startPrepTimer}
                      disabled={prepTimerActive}
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                    <Button
                      onClick={pausePrepTimer}
                      disabled={!prepTimerActive}
                      variant="outline"
                      size="sm"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                    <Button
                      onClick={resetPrepTimer}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Use this time to prepare your arguments
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Debate Phases */}
            <Card>
              <CardHeader>
                <CardTitle 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsStructureCollapsed(!isStructureCollapsed)}
                >
                  <span>Debate Structure</span>
                  {isStructureCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </CardTitle>
              </CardHeader>
              {!isStructureCollapsed && (
                <CardContent>
                  <div className="space-y-3">
                    {(["speech1", "cross1", "speech2", "cross2", "rebuttal1", "rebuttal2", "summary1", "summary2"] as DebatePhase[]).map((phase) => (
                      <div key={phase} className="flex items-center justify-between">
                        <span className={`text-sm ${
                          debateState.currentPhase === phase 
                            ? "text-foreground font-medium" 
                            : "text-muted-foreground"
                        }`}>
                          {getPhaseDisplayName(phase)}
                        </span>
                        <Badge 
                          variant={debateState.currentPhase === phase ? "default" : "outline"}
                          className="text-xs"
                        >
                          {formatTime(getTimeForPhase(phase))}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>            
          </div>
        </div>
      </div>

      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        {/* In a real app, you'd add a notification sound file */}
      </audio>
    </div>
  );
}
