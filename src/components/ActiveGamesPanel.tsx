import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Trophy, Play } from "lucide-react";

type ActiveGame = {
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
  status: string;
  createdAt: any;
  startedAt?: any;
};

export function ActiveGamesPanel() {
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Listen to matches where current user is host or opponent
    const q = query(
      collection(db, "matches"),
      where("status", "in", ["ready", "active"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ActiveGame, "id">),
        }))
        .filter((match) => 
          match.hostId === currentUser.uid || match.opponentId === currentUser.uid
        );
      
      setActiveGames(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getGameStatus = (game: ActiveGame) => {
    if (game.status === "ready") return "Ready to Start";
    if (game.status === "active") return "In Progress";
    return "Unknown";
  };

  const getStatusColor = (game: ActiveGame) => {
    if (game.status === "ready") return "default";
    if (game.status === "active") return "secondary";
    return "outline";
  };

  const getTimeElapsed = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const startTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just started";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading your games...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeGames.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Active Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active games found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start a new match or join an existing one to begin debating!
            </p>
            <div className="mt-4 space-x-2">
              <Button onClick={() => navigate("/vs-player")} variant="default">
                Create Match
              </Button>
              <Button onClick={() => navigate("/lobby")} variant="outline">
                Browse Lobby
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Your Active Matches ({activeGames.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeGames.map((game) => (
            <Card key={game.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {game.format} Match
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {game.timeControl} • {game.difficulty}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(game)}>
                    {getGameStatus(game)}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Players:</span>
                    <span className="font-medium">{game.hostUsername}</span>
                    {game.opponentUsername && (
                      <>
                        <span className="text-muted-foreground">vs</span>
                        <span className="font-medium">{game.opponentUsername}</span>
                      </>
                    )}
                  </div>
                  
                  {game.startedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Started:</span>
                      <span className="font-medium">{getTimeElapsed(game.startedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate(`/debate/${game.id}`)}
                    className="flex-1"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {game.status === "active" ? "Rejoin" : "Join"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
