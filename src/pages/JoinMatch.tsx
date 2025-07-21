import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Link2, 
  Search, 
  Users, 
  Clock,
  Eye
} from "lucide-react";

const JoinMatch = () => {
  const [roomCode, setRoomCode] = useState("");

  const recentMatches = [
    { code: "X7L4KZ", format: "LD", players: "John D. vs Sarah C.", status: "Waiting", viewers: 12 },
    { code: "M2K9PL", format: "PF", players: "Mike R. vs Lisa P.", status: "Live", viewers: 23 },
    { code: "B5N8QW", format: "LD", players: "Alex K. vs Emma G.", status: "Live", viewers: 45 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
            <Link2 className="h-8 w-8 text-primary" />
            Join Match
          </h1>
          <p className="text-muted-foreground">Enter a room code to join an ongoing debate or spectate</p>
        </div>

        {/* Room Code Input */}
        <Card className="bg-gradient-hero border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Enter Room Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input 
                placeholder="Enter 6-digit room code (e.g., X7L4KZ)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-wider"
                maxLength={6}
              />
              <Button className="px-8">
                Join Room
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Room codes are case-insensitive and contain 6 characters
            </p>
          </CardContent>
        </Card>

        {/* Recent/Active Matches */}
        <Card className="bg-gradient-hero border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Active Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMatches.map((match) => (
                <div key={match.code} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-mono font-bold text-lg text-foreground">{match.code}</div>
                      <Badge variant={match.format === "LD" ? "default" : "secondary"} className="text-xs">
                        {match.format}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="font-medium text-foreground">{match.players}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {match.status}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {match.viewers} watching
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {match.status === "Live" ? (
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Spectate
                      </Button>
                    ) : (
                      <Button size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinMatch;