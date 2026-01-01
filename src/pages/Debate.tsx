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
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Play, Pause, RotateCcw, Mic, MicOff, Video, VideoOff, ChevronDown, ChevronUp, Copy, ExternalLink, Link2, Check, CheckCircle, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateRatingsTransaction } from "@/lib/ratings";
import { createGoogleMeet as createMeetUtil, formatMeetId, generateMeetingInstructions } from "@/lib/googleMeet";
import { createAdvancedMeetUrl, generateMeetingInvitation, createQRCodeUrl, formatMeetingId } from "@/lib/googleMeetConfig";

// LD Phases
type LDPhase = "prep" | "ac1" | "cx1" | "nc1" | "cx2" | "ar1" | "nr2" | "ar2";

// PF Phases
type PFPhase = "prep" | "ac" | "nc" | "cx1" | "ar" | "nr" | "cx2" | "as" | "ns" | "gcx" | "aff" | "nff";

type DebatePhase = LDPhase | PFPhase;

interface DebateSettings {
  format: "LD" | "PF" | "AOTB";
  timeControl?: string;
  prepTime: number;
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
    currentPhase: "ac1", // Default to LD first phase, will be set based on format
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
  const [firefliesBotStatus, setFirefliesBotStatus] = useState<"idle" | "inviting" | "active" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [hostReady, setHostReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [debateStatus, setDebateStatus] = useState<"waiting" | "ready" | "active" | "completed">("waiting");
  const [hostMarkedComplete, setHostMarkedComplete] = useState(false);
  const [opponentMarkedComplete, setOpponentMarkedComplete] = useState(false);
  const [allPhasesComplete, setAllPhasesComplete] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<"host" | "opponent" | "tie" | "">("");
  const [hostWinnerSelection, setHostWinnerSelection] = useState<"host" | "opponent" | "tie" | null>(null);
  const [opponentWinnerSelection, setOpponentWinnerSelection] = useState<"host" | "opponent" | "tie" | null>(null);
  const [hostName, setHostName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  
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
            prepTime: 4 * 60, // 4 minutes prep time
          });
          setDebateState(prev => ({ ...prev, prepTimeRemaining: 4 * 60, currentPhase: "ac1" }));
        } else if (data.format === "PF") {
          setDebateSettings({
            format: "PF",
            timeControl: data.timeControl,
            prepTime: 3 * 60, // 3 minutes prep time
          });
          setDebateState(prev => ({ ...prev, prepTimeRemaining: 3 * 60, currentPhase: "ac" }));
        } else if (data.format === "AOTB") {
          // AOTB format - similar to LD
          setDebateSettings({
            format: "AOTB",
            timeControl: data.timeControl,
            prepTime: 4 * 60, // 4 minutes prep time
          });
          setDebateState(prev => ({ ...prev, prepTimeRemaining: 4 * 60, currentPhase: "ac1" }));
        }

        // Check if both players have joined
        const bothJoined = !!(data.opponentId && data.hostId);
        setDebateState(prev => ({ ...prev, bothPlayersJoined: bothJoined }));

        // Store player names for winner selection
        setHostName(data.hostUsername || data.hostName || "Host");
        setOpponentName(data.opponentUsername || data.opponentName || "Opponent");

        // Update debate status
        if (data.status) {
          setDebateStatus(data.status as "waiting" | "ready" | "active" | "completed");
        }

        // Update ready status for both players
        setHostReady(data.hostReady === true);
        setOpponentReady(data.opponentReady === true);

        // Update complete status for both players
        setHostMarkedComplete(data.hostMarkedComplete === true);
        setOpponentMarkedComplete(data.opponentMarkedComplete === true);

        // Update winner selections
        setHostWinnerSelection(data.hostWinnerSelection || null);
        setOpponentWinnerSelection(data.opponentWinnerSelection || null);

        // Check if all phases are complete
        setAllPhasesComplete(data.allPhasesComplete === true);

        // Update Fireflies bot status from Firestore
        if (data.transcriptionStatus) {
          if (data.transcriptionStatus === "active" || data.transcriptionStatus === "pending") {
            setFirefliesBotStatus("active");
          }
        }

        // Update transcript if available
        if (data.transcript) {
          setTranscript(data.transcript);
        }
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

  const getLDPhases = (): LDPhase[] => {
    return ["ac1", "cx1", "nc1", "cx2", "ar1", "nr2", "ar2"];
  };

  const getPFPhases = (): PFPhase[] => {
    return ["ac", "nc", "cx1", "ar", "nr", "cx2", "as", "ns", "gcx", "aff", "nff"];
  };

  const handlePhaseComplete = () => {
    if (!debateSettings) return;
    
    const phases = debateSettings.format === "LD" 
      ? getLDPhases() 
      : debateSettings.format === "PF"
      ? getPFPhases()
      : getLDPhases(); // Default to LD for AOTB
    
    const currentIndex = phases.indexOf(debateState.currentPhase as any);
    
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      setDebateState(prev => ({
        ...prev,
        currentPhase: nextPhase as DebatePhase,
        timeRemaining: getTimeForPhase(nextPhase as DebatePhase),
        isActive: false
      }));
      
      // Play notification sound (optional)
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play().catch(console.error);
      }
      
      toast.info(`Phase complete! Moving to ${getPhaseDisplayName(nextPhase as DebatePhase)}`);
      
      // Update current phase in Firestore
      if (debateId) {
        updateDoc(doc(db, "debates", debateId), {
          currentPhase: nextPhase,
        }).catch(console.error);
      }
    } else {
      // All phases complete - mark as ready for completion
      toast.success("All phases complete! Both players can now mark the debate as complete.");
      setDebateState(prev => ({ ...prev, isActive: false }));
      setAllPhasesComplete(true);
      
      // Update Firestore to mark all phases as complete
      if (debateId) {
        updateDoc(doc(db, "debates", debateId), {
          allPhasesComplete: true,
        }).catch(console.error);
      }
    }
  };

  const getTimeForPhase = (phase: DebatePhase): number => {
    if (!debateSettings) return 0;
    
    if (debateSettings.format === "LD") {
      // LD Format timings (in seconds)
      switch (phase as LDPhase) {
        case "ac1": return 6 * 60; // 6 minutes - Affirmative Constructive (1AC)
        case "cx1": return 3 * 60; // 3 minutes - Cross-Examination of Affirmative
        case "nc1": return 7 * 60; // 7 minutes - Negative Constructive (1NC)
        case "cx2": return 3 * 60; // 3 minutes - Cross-Examination of Negative
        case "ar1": return 4 * 60; // 4 minutes - First Affirmative Rebuttal (1AR)
        case "nr2": return 6 * 60; // 6 minutes - Negative Rebuttal (2NR)
        case "ar2": return 3 * 60; // 3 minutes - Second Affirmative Rebuttal (2AR)
        default: return 0;
      }
    } else if (debateSettings.format === "PF") {
      // PF Format timings (in seconds)
      switch (phase as PFPhase) {
        case "ac": return 4 * 60; // 4 minutes - Affirmative Constructive
        case "nc": return 4 * 60; // 4 minutes - Negative Constructive
        case "cx1": return 3 * 60; // 3 minutes - First Crossfire
        case "ar": return 4 * 60; // 4 minutes - Affirmative Rebuttal
        case "nr": return 4 * 60; // 4 minutes - Negative Rebuttal
        case "cx2": return 3 * 60; // 3 minutes - Second Crossfire
        case "as": return 3 * 60; // 3 minutes - Affirmative Summary
        case "ns": return 3 * 60; // 3 minutes - Negative Summary
        case "gcx": return 3 * 60; // 3 minutes - Grand Crossfire
        case "aff": return 2 * 60; // 2 minutes - Affirmative Final Focus
        case "nff": return 2 * 60; // 2 minutes - Negative Final Focus
        default: return 0;
      }
    } else {
      // AOTB - use LD timings
      switch (phase as LDPhase) {
        case "ac1": return 6 * 60;
        case "cx1": return 3 * 60;
        case "nc1": return 7 * 60;
        case "cx2": return 3 * 60;
        case "ar1": return 4 * 60;
        case "nr2": return 6 * 60;
        case "ar2": return 3 * 60;
        default: return 0;
      }
    }
  };

  const getPhaseDisplayName = (phase: DebatePhase): string => {
    if (!debateSettings) return "Unknown Phase";
    
    if (debateSettings.format === "LD" || debateSettings.format === "AOTB") {
      switch (phase as LDPhase) {
        case "prep": return "Preparation Time";
        case "ac1": return "Affirmative Constructive (1AC)";
        case "cx1": return "Cross-Examination of Affirmative";
        case "nc1": return "Negative Constructive (1NC)";
        case "cx2": return "Cross-Examination of Negative";
        case "ar1": return "First Affirmative Rebuttal (1AR)";
        case "nr2": return "Negative Rebuttal (2NR)";
        case "ar2": return "Second Affirmative Rebuttal (2AR)";
        default: return "Unknown Phase";
      }
    } else if (debateSettings.format === "PF") {
      switch (phase as PFPhase) {
        case "prep": return "Preparation Time";
        case "ac": return "Affirmative Constructive";
        case "nc": return "Negative Constructive";
        case "cx1": return "First Crossfire";
        case "ar": return "Affirmative Rebuttal";
        case "nr": return "Negative Rebuttal";
        case "cx2": return "Second Crossfire";
        case "as": return "Affirmative Summary";
        case "ns": return "Negative Summary";
        case "gcx": return "Grand Crossfire";
        case "aff": return "Affirmative Final Focus";
        case "nff": return "Negative Final Focus";
        default: return "Unknown Phase";
      }
    }
    
    return "Unknown Phase";
  };

  const startTimer = () => {
    if (debateState.timeRemaining === 0) {
      const timeForPhase = getTimeForPhase(debateState.currentPhase);
      setDebateState(prev => ({ ...prev, timeRemaining: timeForPhase }));
    }
    setDebateState(prev => ({ ...prev, isActive: true }));
  };

  const pauseTimer = () => {
    setDebateState(prev => ({ ...prev, isActive: false }));
  };

  const resetTimer = () => {
    const timeForPhase = getTimeForPhase(debateState.currentPhase);
    setDebateState(prev => ({ 
      ...prev, 
      timeRemaining: timeForPhase,
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
    
    // Fallback: Open Google Meet in a new tab to create a meeting
    // User will get a meeting link they can share
    window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
    setShowMeetInput(true);
    toast.info("Create a meeting in the new tab, then paste the meeting link below");
  };

  const inviteFirefliesBot = async (meetUrl: string) => {
    if (!debateId || !meetUrl) return;

    try {
      setFirefliesBotStatus("inviting");
      const response = await fetch("/api/fireflies/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          googleMeetUrl: meetUrl,
          debateId: debateId,
          meetingTitle: `${debateSettings?.format} Debate`
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to invite Fireflies bot");
      }

      const result = await response.json();
      setFirefliesBotStatus("active");
      toast.success("AI transcription bot invited!");
      return result;
    } catch (error: unknown) {
      console.error("Error inviting Fireflies bot:", error);
      setFirefliesBotStatus("error");
      toast.error("Failed to invite transcription bot. You can still proceed with the debate.");
    }
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
      
      // After successfully saving the meet link, invite Fireflies bot
      await inviteFirefliesBot(cleanUrl);
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
    if (!debateId || !debateState.bothPlayersJoined) {
      toast.error("Both players must join the debate before starting");
      return;
    }
    
    if (debateStatus !== "ready") {
      toast.error("Debate is not ready to start");
      return;
    }
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get current debate data to check roles
      const debateDoc = await getDoc(doc(db, "debates", debateId));
      if (!debateDoc.exists()) return;
      
      const debateData = debateDoc.data();
      const isUserHost = debateData.hostId === currentUser.uid;
      
      // Mark the current player as ready
      const updateData: any = {};
      if (isUserHost) {
        updateData.hostReady = true;
      } else {
        updateData.opponentReady = true;
      }

      // Check if both players are ready (combine current state with what we're about to set)
      const hostReadyNow = isUserHost ? true : (debateData.hostReady === true);
      const opponentReadyNow = isUserHost ? (debateData.opponentReady === true) : true;

      // If both players are ready, start the debate
      if (hostReadyNow && opponentReadyNow) {
        updateData.status = "active";
        updateData.startedAt = serverTimestamp();
        await updateDoc(doc(db, "debates", debateId), updateData);
        toast.success("Debate started!");
      } else {
        // Just mark this player as ready
        await updateDoc(doc(db, "debates", debateId), updateData);
        toast.success("You're ready! Waiting for the other player...");
      }
    } catch (error) {
      console.error("Error starting debate:", error);
      toast.error("Failed to mark as ready");
    }
  };

  const unreadyDebate = async () => {
    if (!debateId || debateStatus !== "ready") {
      return;
    }
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get current debate data to check roles
      const debateDoc = await getDoc(doc(db, "debates", debateId));
      if (!debateDoc.exists()) return;
      
      const debateData = debateDoc.data();
      const isUserHost = debateData.hostId === currentUser.uid;
      
      // Mark the current player as not ready
      const updateData: any = {};
      if (isUserHost) {
        updateData.hostReady = false;
      } else {
        updateData.opponentReady = false;
      }

      await updateDoc(doc(db, "debates", debateId), updateData);
      toast.info("You're no longer ready");
    } catch (error) {
      console.error("Error unreadying:", error);
      toast.error("Failed to unready");
    }
  };

  const handleOpenCompleteDialog = () => {
    if (!debateId || debateStatus !== "active") {
      toast.error("Debate is not active");
      return;
    }
    setShowCompleteDialog(true);
  };

  const markDebateComplete = async () => {
    if (!debateId || debateStatus !== "active" || !selectedWinner) {
      toast.error("Please select a winner");
      return;
    }
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get current debate data to check roles
      const debateDoc = await getDoc(doc(db, "debates", debateId));
      if (!debateDoc.exists()) return;
      
      const debateData = debateDoc.data();
      const isUserHost = debateData.hostId === currentUser.uid;
      
      // Mark the current player as having marked complete and store their winner selection
      const updateData: any = {};
      if (isUserHost) {
        updateData.hostMarkedComplete = true;
        updateData.hostWinnerSelection = selectedWinner;
      } else {
        updateData.opponentMarkedComplete = true;
        updateData.opponentWinnerSelection = selectedWinner;
      }

      // Check if both players have marked complete
      const hostMarkedCompleteNow = isUserHost ? true : (debateData.hostMarkedComplete === true);
      const opponentMarkedCompleteNow = isUserHost ? (debateData.opponentMarkedComplete === true) : true;

      // Get winner selections
      const hostSelection = isUserHost ? selectedWinner : (debateData.hostWinnerSelection);
      const opponentSelection = isUserHost ? (debateData.opponentWinnerSelection) : selectedWinner;

      // If both players have marked complete, check if they agree on winner
      if (hostMarkedCompleteNow && opponentMarkedCompleteNow) {
        // Only update if debate is not already completed (prevent duplicate rating updates)
        if (debateData.status !== "completed") {
          // Determine winner - if both agree, use that; if tie selected by either, it's a tie; otherwise use host selection as default
          let finalWinner: "host" | "opponent" | null = null;
          if (hostSelection === "tie" || opponentSelection === "tie") {
            finalWinner = null; // No winner for ties
          } else if (hostSelection === opponentSelection) {
            finalWinner = hostSelection as "host" | "opponent";
          } else {
            // Disagreement - default to host selection or use AI judge later
            finalWinner = hostSelection as "host" | "opponent";
          }

          updateData.status = "completed";
          updateData.completedAt = serverTimestamp();
          if (finalWinner) {
            updateData.winner = finalWinner;
          }

          await updateDoc(doc(db, "debates", debateId), updateData);

          // Update ratings if there's a winner (only once when first completed)
          if (finalWinner && debateData.hostId && debateData.opponentId) {
            try {
              const scoreHost = finalWinner === "host" ? 1 : 0;
              await updateRatingsTransaction({
                playerAId: debateData.hostId,
                playerBId: debateData.opponentId,
                scoreA: scoreHost,
                matchId: debateId,
              });
              toast.success(`Debate completed! Ratings updated. ${finalWinner === "host" ? hostName : opponentName} wins.`);
            } catch (ratingError) {
              console.error("Error updating ratings:", ratingError);
              toast.success("Debate marked as completed, but rating update failed.");
            }
          } else {
            toast.success("Debate marked as completed (tie - no rating change).");
          }
        } else {
          // Debate already completed, just update the current player's status
          await updateDoc(doc(db, "debates", debateId), updateData);
          toast.info("Debate is already completed.");
        }

        setShowCompleteDialog(false);
        setSelectedWinner("");
      } else {
        // Just mark this player as complete
        await updateDoc(doc(db, "debates", debateId), updateData);
        toast.success("You've marked the debate as complete. Waiting for the other player...");
        setShowCompleteDialog(false);
        setSelectedWinner("");
      }
    } catch (error) {
      console.error("Error marking debate complete:", error);
      toast.error("Failed to mark debate as complete");
    }
  };

  const unmarkDebateComplete = async () => {
    if (!debateId || debateStatus === "completed") {
      return;
    }
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get current debate data to check roles
      const debateDoc = await getDoc(doc(db, "debates", debateId));
      if (!debateDoc.exists()) return;
      
      const debateData = debateDoc.data();
      const isUserHost = debateData.hostId === currentUser.uid;
      
      // Mark the current player as not complete
      const updateData: any = {};
      if (isUserHost) {
        updateData.hostMarkedComplete = false;
      } else {
        updateData.opponentMarkedComplete = false;
      }

      await updateDoc(doc(db, "debates", debateId), updateData);
      toast.info("You've unmarked the debate as complete");
    } catch (error) {
      console.error("Error unmarking debate complete:", error);
      toast.error("Failed to unmark debate as complete");
    }
  };

  const joinDebate = async () => {
    // This function is no longer needed - joining is just navigating to the page
    // The actual "ready" status is set by startDebate()
    toast.info("You're now in the debate room. Click 'Start Debate' when ready!");
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

                    {/* Fireflies Bot Status Indicator */}
                    {firefliesBotStatus !== "idle" && (
                      <div className="mt-2">
                        {firefliesBotStatus === "inviting" && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Inviting transcription bot...
                          </Badge>
                        )}
                        {firefliesBotStatus === "active" && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            ✓ Transcription bot active
                          </Badge>
                        )}
                        {firefliesBotStatus === "error" && (
                          <Badge variant="destructive">
                            Transcription bot unavailable
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Start Debate Button - shown when status is ready and both players joined */}
                    {debateStatus === "ready" && debateState.bothPlayersJoined && (
                      <div className="mt-4 pt-4 border-t border-border space-y-2">
                        {isHost ? (
                          <>
                            <div className="flex gap-2">
                              {hostReady ? (
                                <>
                                  <Button 
                                    onClick={unreadyDebate} 
                                    variant="outline" 
                                    className="flex-1"
                                  >
                                    Unready
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    className="flex-1"
                                    disabled
                                  >
                                    You're Ready
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  onClick={startDebate} 
                                  variant="default" 
                                  className="w-full"
                                >
                                  Start Debate
                                </Button>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1 text-center">
                              <p>Host: {hostReady ? "✓ Ready" : "Not ready"}</p>
                              <p>Opponent: {opponentReady ? "✓ Ready" : "Not ready"}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex gap-2">
                              {opponentReady ? (
                                <>
                                  <Button 
                                    onClick={unreadyDebate} 
                                    variant="outline" 
                                    className="flex-1"
                                  >
                                    Unready
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    className="flex-1"
                                    disabled
                                  >
                                    You're Ready
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  onClick={startDebate} 
                                  variant="default" 
                                  className="w-full"
                                >
                                  Start Debate
                                </Button>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1 text-center">
                              <p>Host: {hostReady ? "✓ Ready" : "Not ready"}</p>
                              <p>Opponent: {opponentReady ? "✓ Ready" : "Not ready"}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    
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
                        {debateStatus === "ready" && debateState.bothPlayersJoined && (
                          <>
                            <div className="flex gap-2">
                              {hostReady ? (
                                <>
                                  <Button 
                                    onClick={unreadyDebate} 
                                    variant="outline" 
                                    className="flex-1"
                                  >
                                    Unready
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    className="flex-1"
                                    disabled
                                  >
                                    You're Ready
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  onClick={startDebate} 
                                  variant="default" 
                                  className="w-full"
                                >
                                  Start Debate
                                </Button>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Host: {hostReady ? "✓ Ready" : "Not ready"}</p>
                              <p>Opponent: {opponentReady ? "✓ Ready" : "Not ready"}</p>
                            </div>
                          </>
                        )}
                        {!debateState.bothPlayersJoined && (
                          <p className="text-xs text-muted-foreground text-center">
                            Both players must join before starting
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {debateStatus === "ready" && debateState.bothPlayersJoined && (
                          <>
                            <div className="flex gap-2">
                              {opponentReady ? (
                                <>
                                  <Button 
                                    onClick={unreadyDebate} 
                                    variant="outline" 
                                    className="flex-1"
                                  >
                                    Unready
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    className="flex-1"
                                    disabled
                                  >
                                    You're Ready
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  onClick={startDebate} 
                                  variant="default" 
                                  className="w-full"
                                >
                                  Start Debate
                                </Button>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Host: {hostReady ? "✓ Ready" : "Not ready"}</p>
                              <p>Opponent: {opponentReady ? "✓ Ready" : "Not ready"}</p>
                            </div>
                          </>
                        )}
                        {(!debateState.bothPlayersJoined || debateStatus !== "ready") && (
                          <p className="text-xs text-muted-foreground">
                            Waiting for host to add meeting link and both players to join
                          </p>
                        )}
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

            {/* Manual Mark Debate Complete - always available when active */}
            {debateStatus === "active" && debateState.bothPlayersJoined && (
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Mark Debate Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allPhasesComplete ? (
                    <p className="text-sm text-muted-foreground">
                      All phases have been completed. Both players must agree to mark this debate as complete.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      You can manually mark this debate as complete at any time. Both players must agree.
                    </p>
                  )}
                  {isHost ? (
                    <>
                      <div className="flex gap-2">
                        {hostMarkedComplete ? (
                          <>
                            <Button 
                              onClick={unmarkDebateComplete} 
                              variant="outline" 
                              className="flex-1"
                            >
                              Unmark Complete
                            </Button>
                            <Button 
                              variant="default" 
                              className="flex-1"
                              disabled
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              You Marked Complete
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={handleOpenCompleteDialog} 
                            variant="default" 
                            className="w-full"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Debate Complete
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 text-center">
                        <p>Host: {hostMarkedComplete ? "✓ Marked Complete" : "Not marked"}</p>
                        <p>Opponent: {opponentMarkedComplete ? "✓ Marked Complete" : "Not marked"}</p>
                        {hostWinnerSelection && (
                          <p className="text-primary">Host selected: {hostWinnerSelection === "tie" ? "Tie" : hostWinnerSelection === "host" ? hostName : opponentName}</p>
                        )}
                        {opponentWinnerSelection && (
                          <p className="text-primary">Opponent selected: {opponentWinnerSelection === "tie" ? "Tie" : opponentWinnerSelection === "host" ? hostName : opponentName}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        {opponentMarkedComplete ? (
                          <>
                            <Button 
                              onClick={unmarkDebateComplete} 
                              variant="outline" 
                              className="flex-1"
                            >
                              Unmark Complete
                            </Button>
                            <Button 
                              variant="default" 
                              className="flex-1"
                              disabled
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              You Marked Complete
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={handleOpenCompleteDialog} 
                            variant="default" 
                            className="w-full"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Debate Complete
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 text-center">
                        <p>Host: {hostMarkedComplete ? "✓ Marked Complete" : "Not marked"}</p>
                        <p>Opponent: {opponentMarkedComplete ? "✓ Marked Complete" : "Not marked"}</p>
                        {hostWinnerSelection && (
                          <p className="text-primary">Host selected: {hostWinnerSelection === "tie" ? "Tie" : hostWinnerSelection === "host" ? hostName : opponentName}</p>
                        )}
                        {opponentWinnerSelection && (
                          <p className="text-primary">Opponent selected: {opponentWinnerSelection === "tie" ? "Tie" : opponentWinnerSelection === "host" ? hostName : opponentName}</p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
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
                    {debateSettings && (debateSettings.format === "LD" || debateSettings.format === "AOTB"
                      ? getLDPhases()
                      : getPFPhases()
                    ).map((phase) => (
                      <div key={phase} className="flex items-center justify-between">
                        <span className={`text-sm ${
                          debateState.currentPhase === phase 
                            ? "text-foreground font-medium" 
                            : "text-muted-foreground"
                        }`}>
                          {getPhaseDisplayName(phase as DebatePhase)}
                        </span>
                        <Badge 
                          variant={debateState.currentPhase === phase ? "default" : "outline"}
                          className="text-xs"
                        >
                          {formatTime(getTimeForPhase(phase as DebatePhase))}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Live Transcript Section */}
            {transcript && (
              <Card>
                <CardHeader>
                  <CardTitle>Live Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap text-foreground">
                      {transcript}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Transcript updates automatically as the debate progresses
                  </p>
                </CardContent>
              </Card>
            )}            
          </div>
        </div>
      </div>

      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        {/* In a real app, you'd add a notification sound file */}
      </audio>

      {/* Winner Selection Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Debate Complete</DialogTitle>
            <DialogDescription>
              Select the winner of this debate. Both players must agree for the debate to be marked as complete.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="winner-select">Winner</Label>
              <Select value={selectedWinner} onValueChange={(value) => setSelectedWinner(value as "host" | "opponent" | "tie")}>
                <SelectTrigger id="winner-select">
                  <SelectValue placeholder="Select winner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="host">{hostName} (Host)</SelectItem>
                  <SelectItem value="opponent">{opponentName} (Opponent)</SelectItem>
                  <SelectItem value="tie">Tie / No Winner</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedWinner === "tie" 
                  ? "Ties will not affect ratings." 
                  : selectedWinner 
                    ? `Selecting ${selectedWinner === "host" ? hostName : opponentName} as the winner will update both players' ratings.`
                    : "Please select a winner to continue."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCompleteDialog(false);
              setSelectedWinner("");
            }}>
              Cancel
            </Button>
            <Button onClick={markDebateComplete} disabled={!selectedWinner}>
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
