import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Trophy, Target, Zap } from "lucide-react";

export const HeroStatsPanel = () => {
  const getRatingColor = (rating: number) => {
    if (rating >= 2000) return "text-rating-gold";
    if (rating >= 1600) return "text-rating-silver";
    return "text-rating-bronze";
  };

  const stats = {
    name: "John Debater",
    school: "Harvard University",
    ldRating: 1847,
    pfRating: 1632,
    totalMatches: 127,
    winStreak: 5,
    lastEloChange: +12
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Profile Card */}
      <Card className="bg-gradient-hero border-border">
        <CardContent className="p-6 text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4 ring-2 ring-primary">
            <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
            <AvatarFallback className="text-lg">JD</AvatarFallback>
          </Avatar>
          <h3 className="font-bold text-lg text-foreground">{stats.name}</h3>
          <p className="text-sm text-muted-foreground">{stats.school}</p>
        </CardContent>
      </Card>

      {/* Ratings Card */}
      <Card className="bg-gradient-hero border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Ratings</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">LD Rating</span>
              <span className={`font-bold text-lg ${getRatingColor(stats.ldRating)}`}>
                {stats.ldRating}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">PF Rating</span>
              <span className={`font-bold text-lg ${getRatingColor(stats.pfRating)}`}>
                {stats.pfRating}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match Stats Card */}
      <Card className="bg-gradient-hero border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Statistics</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Matches</span>
              <span className="font-bold text-lg text-foreground">{stats.totalMatches}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <span className="font-bold text-lg text-affirmative">73%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance Card */}
      <Card className="bg-gradient-hero border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Performance</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Win Streak</span>
              <Badge variant="secondary" className="bg-affirmative text-affirmative-foreground">
                {stats.winStreak} wins
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Match</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-affirmative" />
                <span className="font-bold text-affirmative">+{stats.lastEloChange}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};