import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Clock, 
  Mic, 
  Send, 
  Timer,
  Flag,
  Shield
} from "lucide-react";

const PlayerVsPlayer = () => {
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(360);
  const [currentRound, setCurrentRound] = useState("1AC");
  const [activeSide, setActiveSide] = useState("AFF");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const matchData = {
    topic: "In the United States, the federal government should provide universal healthcare to its citizens.",
    format: "LD",
    roomCode: "X7L4KZ",
    affirmative: { name: "John Debater", school: "Harvard University", rating: 1847 },
    negative: { name: "Sarah Chen", school: "Stanford University", rating: 1923 }
  };

  const speechOrder = ["1AC", "1NC", "1AR", "1NR", "2AC", "2NC", "2AR"];
  const currentIndex = speechOrder.indexOf(currentRound);
  const progress = ((currentIndex + 1) / speechOrder.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Match Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="animate-live-dot">LIVE</Badge>
              <Badge variant="outline">{matchData.format}</Badge>
              <span className="text-sm text-muted-foreground">Room: {matchData.roomCode}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Round Progress: {currentIndex + 1}/{speechOrder.length}
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2">{matchData.topic}</h2>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Debater Cards */}
          <div className="space-y-4">
            {/* Affirmative */}
            <Card className={`border-2 ${activeSide === "AFF" ? "border-affirmative bg-affirmative/10" : "border-muted"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{matchData.affirmative.name}</h3>
                    <p className="text-sm text-muted-foreground">{matchData.affirmative.school}</p>
                    <p className="text-sm text-affirmative font-medium">{matchData.affirmative.rating}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="mt-2 bg-affirmative text-affirmative-foreground">
                  AFFIRMATIVE
                </Badge>
              </CardContent>
            </Card>

            {/* Negative */}
            <Card className={`border-2 ${activeSide === "NEG" ? "border-negative bg-negative/10" : "border-muted"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{matchData.negative.name}</h3>
                    <p className="text-sm text-muted-foreground">{matchData.negative.school}</p>
                    <p className="text-sm text-negative font-medium">{matchData.negative.rating}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="mt-2 bg-negative text-negative-foreground">
                  NEGATIVE
                </Badge>
              </CardContent>
            </Card>

            {/* Timer */}
            <Card className="bg-gradient-hero border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4" />
                  {currentRound} Speech
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-mono font-bold text-foreground mb-3">
                  {formatTime(timeRemaining)}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">Start</Button>
                  <Button size="sm" variant="outline" className="flex-1">Pause</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Speech Input Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-hero border-border h-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Speech Area - {currentRound}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Mic className="h-4 w-4 mr-2" />
                      Record
                    </Button>
                    <Button size="sm" variant="outline">
                      <Flag className="h-4 w-4 mr-2" />
                      Flag
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder={`Type your ${currentRound} speech here...`}
                  value={currentSpeech}
                  onChange={(e) => setCurrentSpeech(e.target.value)}
                  className="min-h-[400px] resize-none text-base"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {currentSpeech.length} characters
                  </span>
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Speech
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flow Panel */}
          <div className="space-y-4">
            <Card className="bg-gradient-hero border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Speech Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {speechOrder.map((speech, index) => (
                    <div 
                      key={speech}
                      className={`p-2 rounded text-sm ${
                        speech === currentRound ? "bg-primary text-primary-foreground" :
                        index < currentIndex ? "bg-muted text-muted-foreground" :
                        "text-foreground"
                      }`}
                    >
                      {speech}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-hero border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Match Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" variant="outline" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Request Time
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Call Judge
                </Button>
                <Button size="sm" variant="destructive" className="w-full">
                  Forfeit Match
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerVsPlayer;