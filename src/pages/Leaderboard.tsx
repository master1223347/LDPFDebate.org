import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Crown, 
  Medal, 
  Search, 
  Filter, 
  TrendingUp,
  TrendingDown,
  Star
} from "lucide-react";

const Leaderboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("LD");

  const leaderboardData = [
    { rank: 1, name: "Alex Chen", school: "Stanford University", rating: 2156, winRate: 89, streak: 12, change: "+23" },
    { rank: 2, name: "Sarah Kim", school: "Harvard University", rating: 2134, winRate: 87, streak: 8, change: "+18" },
    { rank: 3, name: "Michael Rodriguez", school: "Yale University", rating: 2098, winRate: 85, streak: 6, change: "+12" },
    { rank: 4, name: "Emily Zhang", school: "MIT", rating: 2076, winRate: 83, streak: 4, change: "+8" },
    { rank: 5, name: "David Park", school: "Princeton University", rating: 2054, winRate: 82, streak: 7, change: "+15" },
    { rank: 6, name: "Lisa Johnson", school: "Columbia University", rating: 2032, winRate: 81, streak: 3, change: "-5" },
    { rank: 7, name: "John Debater", school: "Harvard University", rating: 1847, winRate: 73, streak: 5, change: "+12" },
    { rank: 8, name: "Maria Garcia", school: "UC Berkeley", rating: 1823, winRate: 78, streak: 2, change: "+6" },
    { rank: 9, name: "James Wilson", school: "Northwestern", rating: 1801, winRate: 76, streak: 1, change: "-3" },
    { rank: 10, name: "Anna Thompson", school: "Duke University", rating: 1789, winRate: 74, streak: 4, change: "+9" }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-rating-gold" />;
      case 2:
        return <Medal className="h-6 w-6 text-rating-silver" />;
      case 3:
        return <Trophy className="h-6 w-6 text-rating-bronze" />;
      default:
        return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 2000) return "text-rating-gold";
    if (rating >= 1600) return "text-rating-silver";
    return "text-rating-bronze";
  };

  const getChangeIcon = (change: string) => {
    if (change.startsWith("+")) {
      return <TrendingUp className="h-4 w-4 text-affirmative" />;
    } else if (change.startsWith("-")) {
      return <TrendingDown className="h-4 w-4 text-negative" />;
    }
    return null;
  };

  const topPerformers = [
    { name: "Alex Chen", metric: "Highest Rating", value: "2156", school: "Stanford" },
    { name: "Sarah Kim", metric: "Longest Win Streak", value: "12 wins", school: "Harvard" },
    { name: "Michael Rodriguez", metric: "Most Improved", value: "+156 this month", school: "Yale" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Leaderboard
          </h1>

          {/* Top Performers Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {topPerformers.map((performer, index) => (
              <Card key={index} className="bg-gradient-hero border-border">
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    {index === 0 && <Crown className="h-8 w-8 text-rating-gold mx-auto" />}
                    {index === 1 && <Star className="h-8 w-8 text-primary mx-auto" />}
                    {index === 2 && <TrendingUp className="h-8 w-8 text-affirmative mx-auto" />}
                  </div>
                  <h3 className="font-bold text-lg text-foreground">{performer.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{performer.school}</p>
                  <p className="text-xs text-muted-foreground mb-2">{performer.metric}</p>
                  <p className="text-2xl font-bold text-primary">{performer.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Leaderboard */}
        <Tabs defaultValue="LD" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList>
              <TabsTrigger value="LD">Lincoln-Douglas</TabsTrigger>
              <TabsTrigger value="PF">Public Forum</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search debaters..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="LD">
            <Card className="bg-gradient-hero border-border">
              <CardHeader>
                <CardTitle>Lincoln-Douglas Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboardData.map((player) => (
                    <div key={player.rank} className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-muted/20 ${player.name === "John Debater" ? "bg-primary/10 border-primary" : "border-muted"}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 flex justify-center">
                          {getRankIcon(player.rank)}
                        </div>
                        
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={`/placeholder-avatar-${player.rank}.jpg`} alt={player.name} />
                          <AvatarFallback>{player.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{player.name}</h3>
                            {player.name === "John Debater" && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{player.school}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className={`text-lg font-bold ${getRatingColor(player.rating)}`}>
                            {player.rating}
                          </p>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                        
                        <div>
                          <p className="text-lg font-bold text-foreground">{player.winRate}%</p>
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                        </div>
                        
                        <div>
                          <p className="text-lg font-bold text-affirmative">{player.streak}</p>
                          <p className="text-xs text-muted-foreground">Streak</p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {getChangeIcon(player.change)}
                          <span className={`font-bold ${player.change.startsWith("+") ? "text-affirmative" : "text-negative"}`}>
                            {player.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Button variant="outline">Load More Rankings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="PF">
            <Card className="bg-gradient-hero border-border">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">Public Forum Rankings</h3>
                <p className="text-muted-foreground">Public Forum leaderboard data will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card className="bg-gradient-hero border-border">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">Monthly Rankings</h3>
                <p className="text-muted-foreground">Monthly leaderboard data will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;