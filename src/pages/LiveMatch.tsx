import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Users, 
  Clock, 
  Calendar, 
  Trophy, 
  MessageSquare,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Bot,
  X
} from "lucide-react";

type Debate = {
  id: string;
  format: "LD" | "PF";
  timeControl?: string;
  difficulty?: string;
  hostId: string;
  hostName?: string;
  hostUsername?: string;
  opponentId?: string;
  opponentName?: string;
  opponentUsername?: string;
  status: "waiting" | "ready" | "active" | "completed";
  createdAt: any;
  startedAt?: any;
  completedAt?: any;
  googleMeetUrl?: string;
  currentPhase?: string;
  winner?: "host" | "opponent";
};

export default function LiveMatch() {
  const { debateId } = useParams<{ debateId: string }>();
  const navigate = useNavigate();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [loading, setLoading] = useState(true);
  const [hostData, setHostData] = useState<any>(null);
  const [opponentData, setOpponentData] = useState<any>(null);
  const [judgmentLoading, setJudgmentLoading] = useState(false);
  const [judgmentResult, setJudgmentResult] = useState<string | null>(null);
  const [judgmentModalOpen, setJudgmentModalOpen] = useState(false);

  useEffect(() => {
    if (!debateId) {
      navigate("/lobby");
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "debates", debateId), async (docSnap) => {
      if (!docSnap.exists()) {
        toast.error("Debate not found");
        navigate("/lobby");
        return;
      }

      const data = docSnap.data() as Debate;
      setDebate({ id: docSnap.id, ...data });
      setLoading(false);

      // Fetch user data for host and opponent
      if (data.hostId) {
        const hostDoc = await getDoc(doc(db, "users", data.hostId));
        if (hostDoc.exists()) {
          setHostData(hostDoc.data());
        }
      }

      if (data.opponentId) {
        const opponentDoc = await getDoc(doc(db, "users", data.opponentId));
        if (opponentDoc.exists()) {
          setOpponentData(opponentDoc.data());
        }
      }
    });

    return () => unsubscribe();
  }, [debateId, navigate]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "ready": return "secondary";
      case "completed": return "outline";
      default: return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "In Progress";
      case "ready": return "Ready to Start";
      case "completed": return "Completed";
      default: return "Waiting";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading debate details...</p>
        </div>
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Debate not found</h1>
          <Button onClick={() => navigate("/lobby")}>Back to Lobby</Button>
        </div>
      </div>
    );
  }

  const isParticipant = auth.currentUser?.uid === debate.hostId || auth.currentUser?.uid === debate.opponentId;
  const isHost = auth.currentUser?.uid === debate.hostId;

  const handleGetAIJudgment = async () => {
    if (!debateId || !auth.currentUser) {
      toast.error("You must be logged in to get AI judgment");
      return;
    }

    setJudgmentLoading(true);
    try {
      const response = await fetch('/api/ai-judge/judge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debateId,
          userId: auth.currentUser.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI judgment');
      }

      setJudgmentResult(data.judgment);
      setJudgmentModalOpen(true);
      toast.success("AI judgment generated successfully!");
    } catch (error: any) {
      console.error('Error getting AI judgment:', error);
      toast.error(error.message || "Failed to get AI judgment. Make sure you've set up your API key in your profile.");
    } finally {
      setJudgmentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/lobby")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Debate Details</h1>
              <p className="text-muted-foreground">
                {debate.format} Debate {debate.timeControl && `• ${debate.timeControl}`} {debate.difficulty && `• ${debate.difficulty}`}
              </p>
            </div>
          </div>
          <Badge variant={getStatusColor(debate.status)}>
            {getStatusText(debate.status)}
          </Badge>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Debate Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Players Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Host */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={hostData?.avatar || "/placeholder-avatar.jpg"} />
                        <AvatarFallback>
                          {hostData?.firstName?.[0] || "H"}
                          {hostData?.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">
                          {debate.hostName || debate.hostUsername || "Host"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{debate.hostUsername || "host"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Host</Badge>
                  </div>

                  {debate.opponentId ? (
                    <>
                      <div className="flex items-center justify-center">
                        <div className="text-2xl font-bold text-muted-foreground">VS</div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={opponentData?.avatar || "/placeholder-avatar.jpg"} />
                            <AvatarFallback>
                              {opponentData?.firstName?.[0] || "O"}
                              {opponentData?.lastName?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">
                              {debate.opponentName || debate.opponentUsername || "Opponent"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                              @{debate.opponentUsername || "opponent"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">Opponent</Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">Waiting for opponent...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Debate Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium text-foreground">Debate Created</p>
                      <p className="text-sm text-muted-foreground">{formatDate(debate.createdAt)}</p>
                    </div>
                  </div>
                  {debate.startedAt && (
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <p className="font-medium text-foreground">Debate Started</p>
                        <p className="text-sm text-muted-foreground">{formatDate(debate.startedAt)}</p>
                      </div>
                    </div>
                  )}
                  {debate.completedAt && (
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <p className="font-medium text-foreground">Debate Completed</p>
                        <p className="text-sm text-muted-foreground">{formatDate(debate.completedAt)}</p>
                      </div>
                    </div>
                  )}
                  {debate.currentPhase && (
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <div>
                        <p className="font-medium text-foreground">Current Phase</p>
                        <p className="text-sm text-muted-foreground capitalize">{debate.currentPhase}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Winner (if completed) */}
            {debate.status === "completed" && debate.winner && (
              <Card className="border-2 border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-4">
                    <Trophy className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Winner</p>
                      <p className="text-2xl font-bold text-foreground">
                        {debate.winner === "host" 
                          ? debate.hostName || debate.hostUsername 
                          : debate.opponentName || debate.opponentUsername}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isParticipant && debate.status === "active" && (
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/debate/${debateId}`)}
                  >
                    Join Debate
                  </Button>
                )}
                {isParticipant && debate.status === "ready" && (
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/debate/${debateId}`)}
                  >
                    Start Debate
                  </Button>
                )}
                {!isParticipant && debate.status === "active" && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate(`/debate/${debateId}`)}
                  >
                    Spectate
                  </Button>
                )}
                {debate.googleMeetUrl && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(debate.googleMeetUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Video Call
                  </Button>
                )}
                {debate.status === "completed" && isParticipant && (
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={handleGetAIJudgment}
                    disabled={judgmentLoading}
                  >
                    {judgmentLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Judgment...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Get AI Judge Decision
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Debate Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Debate Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">{debate.format}</span>
                </div>
                <Separator />
                {debate.timeControl && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time Control</span>
                      <span className="font-medium">{debate.timeControl}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {debate.difficulty && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Difficulty</span>
                    <span className="font-medium capitalize">{debate.difficulty}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Judgment Modal */}
      <Dialog open={judgmentModalOpen} onOpenChange={setJudgmentModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Judge Decision
            </DialogTitle>
            <DialogDescription>
              AI-powered judgment for this {debate?.format} debate
            </DialogDescription>
          </DialogHeader>
          {judgmentResult && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground bg-muted/30 p-6 rounded-lg">
                {judgmentResult}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

