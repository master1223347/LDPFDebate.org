import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Users, 
  Clock, 
  Calendar, 
  Trophy, 
  MessageSquare,
  ExternalLink,
  ArrowLeft,
  Loader2
} from "lucide-react";

type Match = {
  id: string;
  format: "LD" | "PF";
  timeControl: string;
  difficulty: string;
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
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [hostData, setHostData] = useState<any>(null);
  const [opponentData, setOpponentData] = useState<any>(null);

  useEffect(() => {
    if (!matchId) {
      navigate("/lobby");
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "matches", matchId), async (docSnap) => {
      if (!docSnap.exists()) {
        toast.error("Match not found");
        navigate("/lobby");
        return;
      }

      const data = docSnap.data() as Match;
      setMatch({ id: docSnap.id, ...data });
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
  }, [matchId, navigate]);

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
          <p className="text-muted-foreground">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Match not found</h1>
          <Button onClick={() => navigate("/lobby")}>Back to Lobby</Button>
        </div>
      </div>
    );
  }

  const isParticipant = auth.currentUser?.uid === match.hostId || auth.currentUser?.uid === match.opponentId;
  const isHost = auth.currentUser?.uid === match.hostId;

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
              <h1 className="text-3xl font-bold text-foreground">Match Details</h1>
              <p className="text-muted-foreground">
                {match.format} Debate • {match.timeControl} • {match.difficulty}
              </p>
            </div>
          </div>
          <Badge variant={getStatusColor(match.status)}>
            {getStatusText(match.status)}
          </Badge>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Match Info */}
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
                          {match.hostName || match.hostUsername || "Host"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{match.hostUsername || "host"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Host</Badge>
                  </div>

                  {match.opponentId ? (
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
                              {match.opponentName || match.opponentUsername || "Opponent"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @{match.opponentUsername || "opponent"}
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

            {/* Match Timeline */}
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
                      <p className="font-medium text-foreground">Match Created</p>
                      <p className="text-sm text-muted-foreground">{formatDate(match.createdAt)}</p>
                    </div>
                  </div>
                  {match.startedAt && (
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <p className="font-medium text-foreground">Match Started</p>
                        <p className="text-sm text-muted-foreground">{formatDate(match.startedAt)}</p>
                      </div>
                    </div>
                  )}
                  {match.completedAt && (
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <p className="font-medium text-foreground">Match Completed</p>
                        <p className="text-sm text-muted-foreground">{formatDate(match.completedAt)}</p>
                      </div>
                    </div>
                  )}
                  {match.currentPhase && (
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <div>
                        <p className="font-medium text-foreground">Current Phase</p>
                        <p className="text-sm text-muted-foreground capitalize">{match.currentPhase}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Winner (if completed) */}
            {match.status === "completed" && match.winner && (
              <Card className="border-2 border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-4">
                    <Trophy className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Winner</p>
                      <p className="text-2xl font-bold text-foreground">
                        {match.winner === "host" 
                          ? match.hostName || match.hostUsername 
                          : match.opponentName || match.opponentUsername}
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
                {isParticipant && match.status === "active" && (
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/debate/${matchId}`)}
                  >
                    Join Debate
                  </Button>
                )}
                {isParticipant && match.status === "ready" && (
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/debate/${matchId}`)}
                  >
                    Start Debate
                  </Button>
                )}
                {!isParticipant && match.status === "active" && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate(`/debate/${matchId}`)}
                  >
                    Spectate
                  </Button>
                )}
                {match.googleMeetUrl && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(match.googleMeetUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Video Call
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Match Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Match Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">{match.format}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Control</span>
                  <span className="font-medium">{match.timeControl}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span className="font-medium capitalize">{match.difficulty}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

