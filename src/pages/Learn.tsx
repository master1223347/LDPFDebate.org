import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Target, 
  Video, 
  Brain, 
  RotateCcw,
  Play,
  CheckCircle,
  Star,
  Timer,
  Trophy
} from "lucide-react";

const Learn = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const flashcards = [
    {
      question: "What is the burden of proof in LD debate?",
      answer: "The affirmative must prove that the resolution is more true than false, while the negative must prove it's more false than true.",
      category: "Framework",
      difficulty: "Basic"
    },
    {
      question: "How do you properly weigh impacts in your final speech?",
      answer: "Compare magnitude, probability, and timeframe. Establish why your impacts matter more through clear comparative analysis.",
      category: "Weighing",
      difficulty: "Intermediate"
    }
  ];

  const drills = [
    {
      title: "Argument Reconstruction",
      description: "Practice rebuilding arguments from partial information",
      progress: 75,
      difficulty: "Intermediate",
      timeEstimate: "15 min"
    },
    {
      title: "Drop Spotting",
      description: "Identify dropped arguments in flow practice",
      progress: 45,
      difficulty: "Advanced",
      timeEstimate: "20 min"
    },
    {
      title: "Cross-Examination Tactics",
      description: "Master effective questioning strategies",
      progress: 30,
      difficulty: "Basic",
      timeEstimate: "10 min"
    }
  ];

  const shadowDebates = [
    {
      title: "2023 TOC Finals",
      participants: "Sarah Chen vs. Michael Torres",
      topic: "Healthcare Policy",
      difficulty: "Advanced",
      duration: "45 min",
      completed: false
    },
    {
      title: "Harvard Invitational Semis",
      participants: "Lisa Park vs. Alex Kim",
      topic: "Technology Ethics",
      difficulty: "Intermediate",
      duration: "30 min",
      completed: true
    }
  ];

  const theoryDrills = [
    {
      title: "Theory Shell Construction",
      description: "Learn to build effective theory arguments",
      progress: 60,
      concepts: ["Interpretation", "Violation", "Standards", "Voters"]
    },
    {
      title: "Theory Response Strategies",
      description: "Counter common theory arguments effectively",
      progress: 25,
      concepts: ["We Meet", "Counter-Interpretation", "Turn the Standards", "Impact Defense"]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Basic": return "bg-affirmative text-affirmative-foreground";
      case "Intermediate": return "bg-judge text-judge-foreground";
      case "Advanced": return "bg-negative text-negative-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Practice Hub
          </h1>
        </div>

        <Tabs defaultValue="flashcards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="drills">Skill Drills</TabsTrigger>
            <TabsTrigger value="shadow">Shadow Debates</TabsTrigger>
            <TabsTrigger value="theory">Theory</TabsTrigger>
          </TabsList>

          {/* Flashcards Tab */}
          <TabsContent value="flashcards">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-gradient-hero border-border h-96">
                  <CardContent className="p-8 h-full flex flex-col justify-center">
                    {!showAnswer ? (
                      <div className="text-center">
                        <Badge className={getDifficultyColor(flashcards[currentCard].difficulty)}>
                          {flashcards[currentCard].difficulty}
                        </Badge>
                        <Badge variant="outline" className="ml-2">
                          {flashcards[currentCard].category}
                        </Badge>
                        <h2 className="text-2xl font-bold text-foreground mt-6 mb-8">
                          {flashcards[currentCard].question}
                        </h2>
                        <Button onClick={() => setShowAnswer(true)} className="bg-primary hover:bg-primary/90">
                          Show Answer
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-muted-foreground mb-4">Answer:</h3>
                        <p className="text-lg text-foreground leading-relaxed mb-8">
                          {flashcards[currentCard].answer}
                        </p>
                        <div className="flex gap-4 justify-center">
                          <Button variant="outline" className="text-negative border-negative hover:bg-negative/10">
                            Incorrect
                          </Button>
                          <Button variant="outline" className="text-judge border-judge hover:bg-judge/10">
                            Partially
                          </Button>
                          <Button variant="outline" className="text-affirmative border-affirmative hover:bg-affirmative/10">
                            Correct
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="flex justify-between items-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCurrentCard(Math.max(0, currentCard - 1));
                      setShowAnswer(false);
                    }}
                    disabled={currentCard === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground">
                    {currentCard + 1} of {flashcards.length}
                  </span>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setCurrentCard(Math.min(flashcards.length - 1, currentCard + 1));
                      setShowAnswer(false);
                    }}
                    disabled={currentCard === flashcards.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="bg-gradient-hero border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Framework</span>
                          <span>8/12</span>
                        </div>
                        <Progress value={67} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Weighing</span>
                          <span>5/10</span>
                        </div>
                        <Progress value={50} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Logic</span>
                          <span>12/15</span>
                        </div>
                        <Progress value={80} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-hero border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Deck
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="h-4 w-4 mr-2" />
                      Study Missed Cards
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Brain className="h-4 w-4 mr-2" />
                      Custom Deck
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Drills Tab */}
          <TabsContent value="drills">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drills.map((drill, index) => (
                <Card key={index} className="bg-gradient-hero border-border">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{drill.title}</CardTitle>
                      <Badge className={getDifficultyColor(drill.difficulty)}>
                        {drill.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm">{drill.description}</p>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{drill.progress}%</span>
                      </div>
                      <Progress value={drill.progress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        {drill.timeEstimate}
                      </div>
                      {drill.progress === 100 && (
                        <CheckCircle className="h-4 w-4 text-affirmative" />
                      )}
                    </div>
                    
                    <Button className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      {drill.progress === 0 ? "Start Drill" : "Continue"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Shadow Debates Tab */}
          <TabsContent value="shadow">
            <div className="space-y-6">
              {shadowDebates.map((debate, index) => (
                <Card key={index} className="bg-gradient-hero border-border">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{debate.title}</h3>
                          <Badge className={getDifficultyColor(debate.difficulty)}>
                            {debate.difficulty}
                          </Badge>
                          {debate.completed && (
                            <Badge variant="secondary" className="bg-affirmative text-affirmative-foreground">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-1">{debate.participants}</p>
                        <p className="text-sm text-muted-foreground">Topic: {debate.topic}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            {debate.duration}
                          </div>
                        </div>
                        <Button>
                          <Play className="h-4 w-4 mr-2" />
                          {debate.completed ? "Watch Again" : "Start Shadow"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Theory Tab */}
          <TabsContent value="theory">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {theoryDrills.map((drill, index) => (
                <Card key={index} className="bg-gradient-hero border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      {drill.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{drill.description}</p>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{drill.progress}%</span>
                      </div>
                      <Progress value={drill.progress} className="h-2" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Key Concepts:</h4>
                      <div className="flex flex-wrap gap-2">
                        {drill.concepts.map((concept, i) => (
                          <Badge key={i} variant="outline">{concept}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button className="w-full">
                      <Target className="h-4 w-4 mr-2" />
                      Practice Theory
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Learn;