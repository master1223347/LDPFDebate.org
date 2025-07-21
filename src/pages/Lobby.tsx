import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Match = {
  id: string;
  format: "LD" | "PF";
  timeControl: string;
  difficulty: string;
  hostName?: string;
  createdAt: Timestamp;
};

export default function Lobby() {
  const [matches, setMatches] = useState<Match[]>([]);

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
      <h1 className="text-3xl font-bold text-foreground mb-6">Active Lobby</h1>

      {matches.length === 0 ? (
        <p className="text-muted-foreground">No matches currently waiting. Start one from the PvP page!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <Card key={match.id} className="bg-gradient-hero border-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-foreground">{match.format} Match</h2>
                  <Badge variant="secondary">{match.timeControl}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Host: <span className="text-foreground font-medium">{match.hostName || "Unknown"}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Difficulty: <span className="capitalize">{match.difficulty}</span>
                </div>
                <Button className="w-full mt-2">Join Match</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
