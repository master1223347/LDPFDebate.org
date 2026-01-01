import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrepareAIJudgeModal } from "@/components/ui/PrepareAIJudgeModal";
import { 
  Trophy, 
  TrendingUp, 
  Calendar, 
  School, 
  Target,
  Clock,
  Medal,
  BarChart3,
  Bot,
  Key
} from "lucide-react";

const Profile = () => {
  const [selectedFormat, setSelectedFormat] = useState("LD");
  const [profileData, setProfileData] = useState<any | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [aiJudgeModalOpen, setAIJudgeModalOpen] = useState(false);


  const recentMatches = [
    { id: 1, opponent: "Sarah Mitchell", result: "W", rating: "+12", format: "LD", date: "2 days ago" },
    { id: 2, opponent: "Alex Kim", result: "W", rating: "+8", format: "LD", date: "5 days ago" },
    { id: 3, opponent: "Mike Rodriguez", result: "L", rating: "-15", format: "PF", date: "1 week ago" },
    { id: 4, opponent: "Lisa Chen", result: "W", rating: "+10", format: "LD", date: "1 week ago" },
    { id: 5, opponent: "David Park", result: "W", rating: "+14", format: "PF", date: "2 weeks ago" }
  ];

  const achievements = [
    { name: "First Win", description: "Win your first debate", earned: true },
    { name: "Win Streak", description: "Win 5 debates in a row", earned: true },
    { name: "Rating Climber", description: "Reach 1800+ rating", earned: true },
    { name: "Tournament Ready", description: "Complete 100 matches", earned: true },
    { name: "Speed Demon", description: "Win a debate in under 10 minutes", earned: false },
    { name: "Master Debater", description: "Reach 2000+ rating", earned: false }
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 2000) return "text-rating-gold";
    if (rating >= 1600) return "text-rating-silver";
    return "text-rating-bronze";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileData(docSnap.data());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!profileData) {
    return <div className="text-center text-muted-foreground mt-10">Loading your profile...</div>;
  }

  const fullName = `${profileData.firstName ?? ""} ${profileData.lastName ?? ""}`.trim();
  const username = profileData.username ?? "N/A";
  const initials = `${profileData.firstName?.[0] ?? ""}${profileData.lastName?.[0] ?? ""}`.toUpperCase();
  const school = profileData.school ?? "Unknown School";
  const joinDate = profileData.createdAt?.toDate().toLocaleDateString() ?? "Unknown";

  // Derived match data
  const wins = recentMatches.filter(m => m.result === "W").length;
  const losses = recentMatches.filter(m => m.result === "L").length;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // Dummy ratings for now (you can later store these in Firestore)
  const ldRating = 1847;
  const pfRating = 1632;
  const winStreak = 5;
  const longestStreak = 12;


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 bg-gradient-hero border-border">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-24 h-24 ring-4 ring-primary">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                  <AvatarFallback className="text-2xl"> {initials} </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">{fullName}</h1>
                      <p className="text-muted-foreground">{username}</p>
                    </div>
                    <Button
                      onClick={() => setAIJudgeModalOpen(true)}
                      variant="outline"
                      className="mt-4 md:mt-0"
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      Prepare AI Judge
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{totalMatches}</p>
                      <p className="text-sm text-muted-foreground">Total Matches</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-affirmative">{wins}</p>
                      <p className="text-sm text-muted-foreground">Wins</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-negative">{losses}</p>
                      <p className="text-sm text-muted-foreground">Losses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{Math.round((wins / totalMatches) * 100)}%</p>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-hero border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Current Ratings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Lincoln-Douglas</span>
                <span className={`text-2xl font-bold ${getRatingColor(ldRating)}`}>
                  {profileData.ldRating}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Public Forum</span>
                <span className={`text-2xl font-bold ${getRatingColor(pfRating)}`}>
                  {profileData.pfRating}
                </span>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                  <School className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{school}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined {joinDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="matches" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matches">Match History</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <Card className="bg-gradient-hero border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant={match.result === "W" ? "default" : "destructive"} className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {match.result}
                        </Badge>
                        <div>
                          <p className="font-medium text-foreground">vs {match.opponent}</p>
                          <p className="text-sm text-muted-foreground">{match.format} • {match.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${match.result === "W" ? "text-affirmative" : "text-negative"}`}>
                          {match.rating}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-hero border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Current Win Streak</span>
                      <span className="text-2xl font-bold text-affirmative">{winStreak}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Longest Win Streak</span>
                      <span className="text-2xl font-bold text-foreground">{longestStreak}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">This Month</span>
                      <span className="text-lg font-bold text-affirmative">12-3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-hero border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Rating Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>LD Rating Growth</span>
                        <span className="text-affirmative">+127 this month</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-affirmative w-3/4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>PF Rating Growth</span>
                        <span className="text-affirmative">+89 this month</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-2/3" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="bg-gradient-hero border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-primary" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 ${achievement.earned ? 'border-primary bg-primary/10' : 'border-muted bg-muted/10'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${achievement.earned ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          <Trophy className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${achievement.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {achievement.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PrepareAIJudgeModal 
        open={aiJudgeModalOpen} 
        onClose={() => setAIJudgeModalOpen(false)} 
      />
    </div>
  );
};

export default Profile;