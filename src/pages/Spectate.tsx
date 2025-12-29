import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Eye, 
  Users, 
  Clock, 
  MessageCircle, 
  ThumbsUp,
  ThumbsDown,
  Filter,
  Search,
  Play,
  Volume2
} from "lucide-react";

const Spectate = () => {
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);

  const liveMatches = [
    {
      id: 1,
      format: "LD",
      topic: "Universal Healthcare",
      affirmative: { name: "Sarah Chen", school: "Harvard", rating: 1923 },
      negative: { name: "Mike Torres", school: "Yale", rating: 1876 },
      viewers: 23,
      round: "1NC",
      timeRemaining: "4:32",
      votes: { aff: 67, neg: 33 }
    },
    {
      id: 2,
      format: "PF",
      topic: "AI Benefits vs Harms",
      affirmative: { name: "Lisa Park", school: "Stanford", rating: 1854 },
      negative: { name: "Alex Kim", school: "MIT", rating: 1901 },
      viewers: 45,
      round: "Summary",
      timeRemaining: "2:15",
      votes: { aff: 52, neg: 48 }
    },
    {
      id: 3,
      format: "LD",
      topic: "Climate Change Policy",
      affirmative: { name: "David Wilson", school: "Princeton", rating: 2032 },
      negative: { name: "Emma Garcia", school: "Columbia", rating: 1987 },
      viewers: 78,
      round: "2AR",
      timeRemaining: "1:43",
      votes: { aff: 41, neg: 59 }
    }
  ];

  const chatMessages = [
    { user: "DebateFan2024", message: "Great argument structure!", timestamp: "12:34" },
    { user: "LogicLover", message: "The negative is dropping key contentions", timestamp: "12:35" },
    { user: "FlowMaster", message: "This crossfire is intense", timestamp: "12:36" },
    { user: "YoungDebater", message: "Learning so much from this!", timestamp: "12:37" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Eye className="h-8 w-8 text-primary" />
            Debates
          </h1>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                {liveMatches.length} Active
              </Badge>
              <p className="text-muted-foreground">
                {liveMatches.reduce((total, match) => total + match.viewers, 0)} total viewers
              </p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search matches..." className="pl-10" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Match List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-hero border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Active Matches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {liveMatches.map((match) => (
                  <div 
                    key={match.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/20 ${
                      selectedMatch === match.id ? "border-primary bg-primary/10" : "border-muted"
                    }`}
                    onClick={() => setSelectedMatch(match.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={match.format === "LD" ? "default" : "secondary"}>
                          {match.format}
                        </Badge>
                        <Badge variant="outline" className="animate-pulse">
                          {match.round}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          {match.viewers}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-foreground">{match.timeRemaining}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-foreground mb-3">{match.topic}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3 p-3 bg-affirmative/10 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {match.affirmative.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{match.affirmative.name}</p>
                          <p className="text-xs text-muted-foreground">{match.affirmative.school} • {match.affirmative.rating}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-negative/10 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {match.negative.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{match.negative.name}</p>
                          <p className="text-xs text-muted-foreground">{match.negative.school} • {match.negative.rating}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Vote Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Audience Vote</span>
                        <span>{match.votes.aff + match.votes.neg} votes</span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-affirmative transition-all duration-500" 
                          style={{ width: `${match.votes.aff}%` }}
                        />
                        <div 
                          className="bg-negative transition-all duration-500" 
                          style={{ width: `${match.votes.neg}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-affirmative font-medium">{match.votes.aff}% AFF</span>
                        <span className="text-negative font-medium">{match.votes.neg}% NEG</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Watch Panel & Chat */}
          <div className="space-y-6">
            {/* Watch Controls */}
            <Card className="bg-gradient-hero border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Watch Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMatch ? (
                  <>
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      <Play className="h-4 w-4 mr-2" />
                      Join Stream
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        AFF
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        NEG
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Volume2 className="h-4 w-4 mr-2" />
                      Audio Only
                    </Button>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Select a match to start watching
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="bg-gradient-hero border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-primary text-xs">{msg.user}</span>
                        <span className="text-muted-foreground text-xs">{msg.timestamp}</span>
                      </div>
                      <p className="text-foreground">{msg.message}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Type a message..." className="flex-1" />
                  <Button size="sm">Send</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Spectate;