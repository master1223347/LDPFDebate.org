import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigate, useNavigate } from "react-router-dom" ;
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { JoinMatchModal } from "@/components/ui/JoinMatchModal";



type Match = {
  id: string;
  format: "LD" | "PF";
  timeControl: string;
  difficulty: string;
  hostName?: string;
  hostUsername?: string;
  createdAt: Timestamp;

};

export default function Lobby() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const q = query(collection(db, "matches"), where("status", "==", "waiting"));
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
      {matches.length === 0 ? (
        <p className="text-muted-foreground">No matches currently waiting.
         Start one from the PvP page!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
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
                <Button className="w-full mt-2"
                 onClick={() => {
                  setSelectedMatchId(match.id);
                  setIsModalOpen(true);
                 }}>
                Join Match 
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
      <JoinMatchModal
        matchId={selectedMatchId ?? ""}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
