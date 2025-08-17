import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom" ;
import { JoinMatchModal } from "@/components/ui/JoinMatchModal";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";


type Match = {
  id: string;
  format: "LD" | "PF";
  timeControl: string;
  difficulty: string;
  hostId: string;
  hostName?: string;
  hostUsername?: string;
  createdAt: Timestamp;
  status: string;
  opponentId?: string;
  opponentName?: string;
  opponentUsername?: string;
  googleMeetUrl?: string;
};

export default function Lobby() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    // Listen to waiting, ready, and active matches
    const q = query(
      collection(db, "matches"), 
      where("status", "in", ["waiting", "ready", "active"])
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Match, "id">),
      }));
      setMatches(data);
    });

    return () => unsubscribe();
  }, []);

  return (
      
    <div className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Active Lobby</h1>
        <Button
          variant="outline"
          onClick={() => navigate("/home")} // Change "/home" to your dashboard route
        >
          Back to Dashboard
        </Button>
      </div>
      
      {/* Active Debates Section */}
      {matches.filter(m => m.status === "active").length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Active Debates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.filter(m => m.status === "active").map((match) => (
              <Card key={match.id} className="bg-gradient-hero border-border flex flex-col justify-between">
                <CardContent className="p-4 space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">{match.format} Debate</h2>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    <span className="text-primary">{match.hostUsername}</span> vs <span className="text-primary">{match.opponentUsername}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Format: {match.format} • Time: {match.timeControl}
                  </div>
                  <Button
                    className="w-full mt-2"
                    onClick={() => navigate(`/debate/${match.id}`)}
                  >
                    {match.hostId === auth.currentUser?.uid || match.opponentId === auth.currentUser?.uid 
                      ? "Rejoin Debate" 
                      : "Join Debate"
                    }
                  </Button>
                </CardContent>
                <div className="px-4 py-2 bg-muted text-xs text-muted-foreground rounded-b-lg">
                  Debate in progress
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      

      {/* Ready to Join Section */}
      {matches.filter(m => m.status === "ready").length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Ready to Join</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.filter(m => m.status === "ready").map((match) => (
              <Card key={match.id} className="bg-gradient-hero border-border flex flex-col justify-between">
                <CardContent className="p-4 space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">{match.format} Match</h2>
                    <Badge variant="default">Ready</Badge>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    <span className="text-primary">{match.hostUsername}</span> vs <span className="text-primary">{match.opponentUsername}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Format: {match.format} • Time: {match.timeControl}
                  </div>
                  <Button
                    className="w-full mt-2"
                    onClick={() => navigate(`/debate/${match.id}`)}
                  >
                    Join Debate
                  </Button>
                </CardContent>
                <div className="px-4 py-2 bg-muted text-xs text-muted-foreground rounded-b-lg">
                  Both players ready - click to join
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Proposals Section - Only show for hosts */}
      {matches.filter(m => m.status === "waiting" && m.hostId === auth.currentUser?.uid).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Your Matches - Pending Proposals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.filter(m => m.status === "waiting" && m.hostId === auth.currentUser?.uid).map((match) => (
              <Card key={match.id} className="bg-gradient-hero border-border flex flex-col justify-between">
                <CardContent className="p-4 space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">{match.format} Match</h2>
                    <Badge variant="secondary">{match.timeControl}</Badge>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    <span className="text-primary">Host: {match.hostUsername}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Difficulty: <span className="capitalize">{match.difficulty}</span>
                  </div>
                  <Button
                    className="w-full mt-2"
                    onClick={() => navigate(`/match-proposals/${match.id}`)}
                  >
                    View Proposals
                  </Button>
                </CardContent>
                <div className="px-4 py-2 bg-muted text-xs text-muted-foreground rounded-b-lg">
                  Waiting for proposals
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Waiting Matches Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Available Matches to Join</h2>
        {matches.filter(m => m.status === "waiting" && m.hostId !== auth.currentUser?.uid).length === 0 ? (
          <p className="text-muted-foreground">No matches currently available to join. Start one from the PvP page!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.filter(m => m.status === "waiting" && m.hostId !== auth.currentUser?.uid).map((match) => (
              <Card key={match.id} className="bg-gradient-hero border-border flex flex-col justify-between">
                <CardContent className="p-4 space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">{match.format} Match</h2>
                    <Badge variant="secondary">{match.timeControl}</Badge>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    <span className="text-primary">{match.hostUsername}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Difficulty: <span className="capitalize">{match.difficulty}</span>
                  </div>
                  <Button
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedMatchId(match.id);
                      setIsModalOpen(true);
                    }}
                  >
                    Propose Time
                  </Button>
                </CardContent>
                {/* 🔹 Gray footer with host avatar + name */}
                <div className="px-4 py-2 bg-muted text-xs text-muted-foreground rounded-b-lg">
                  Host: <span className="text-foreground font-medium">{match.hostName || "Unknown"}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <JoinMatchModal
        matchId={selectedMatchId ?? ""}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
