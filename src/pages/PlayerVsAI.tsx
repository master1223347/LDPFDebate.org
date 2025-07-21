import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bot, 
  Clock, 
  Mic, 
  Send, 
  Brain, 
  Target, 
  Zap,
  Timer
} from "lucide-react";

const PlayerVsAI = () => {
  const [selectedFormat, setSelectedFormat] = useState("LD");
  const [selectedSide, setSelectedSide] = useState("AFF");
  const [aiType, setAiType] = useState("utilitarian");
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(360); // 6 minutes
  const [prepTime, setPrepTime] = useState(240); // 4 minutes prep

  const aiTypes = [
    { value: "utilitarian", label: "Utilitarian", icon: "⚖️" },
    { value: "kantian", label: "Kantian", icon: "📜" },
    { value: "policy", label: "Policy Bro", icon: "📊" },
    { value: "lay", label: "Lay Judge", icon: "👥" },
    { value: "speed", label: "Speed Caster", icon: "⚡" }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Mode Selection */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            AI Practice Arena
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-hero border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Format</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LD">Lincoln-Douglas</SelectItem>
                    <SelectItem value="PF">Public Forum</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="bg-gradient-hero border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Your Side</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    variant={selectedSide === "AFF" ? "default" : "outline"}
                    onClick={() => setSelectedSide("AFF")}
                    className="flex-1"
                  >
                    Affirmative
                  </Button>
                  <Button 
                    variant={selectedSide === "NEG" ? "default" : "outline"}
                    onClick={() => setSelectedSide("NEG")}
                    className="flex-1"
                  >
                    Negative
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-hero border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">AI Opponent</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={aiType} onValueChange={setAiType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Practice Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Speech Input Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-hero border-border h-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Your Speech
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">1AC Constructive</Badge>
                    <Button size="sm" variant="outline">
                      <Mic className="h-4 w-4 mr-2" />
                      Record
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="Type your speech here... Use clear arguments with evidence and analysis."
                  value={currentSpeech}
                  onChange={(e) => setCurrentSpeech(e.target.value)}
                  className="min-h-[400px] resize-none text-base"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {currentSpeech.length} characters
                  </span>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Speech
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timer and AI Response Panel */}
          <div className="space-y-6">
            {/* Timer Card */}
            <Card className="bg-gradient-hero border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  Speech Timer
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-mono font-bold text-foreground mb-4">
                  {formatTime(timeRemaining)}
                </div>
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" className="flex-1">Start</Button>
                  <Button variant="outline" size="sm" className="flex-1">Pause</Button>
                  <Button variant="outline" size="sm" className="flex-1">Reset</Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Prep Time: {formatTime(prepTime)}
                </div>
              </CardContent>
            </Card>

            {/* AI Response Card */}
            <Card className="bg-gradient-hero border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-negative" />
                  AI Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-negative rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Utilitarian AI</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Waiting for your opening statement to generate a response...
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Generate AI Response
                </Button>
              </CardContent>
            </Card>

            {/* Judge Feedback Card */}
            <Card className="bg-gradient-hero border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-judge" />
                  AI Judge Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Content</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className="w-3 h-3 rounded-full bg-muted" />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Logic</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className="w-3 h-3 rounded-full bg-muted" />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Strategy</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className="w-3 h-3 rounded-full bg-muted" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Submit your speech to receive detailed feedback
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerVsAI;