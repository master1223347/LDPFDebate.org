import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Trophy, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export const HeroStatsPanel = () => {
  const [userData, setUserData] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserData(snap.data());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const getRatingColor = (rating: number) => {
    if (rating >= 2000) return "text-rating-gold";
    if (rating >= 1600) return "text-rating-silver";
    return "text-rating-bronze";
  };

  if (!userData) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  // Destructure with fallbacks
  const {
    firstName = "",
    lastName = "",
    school = "Unknown School",
  } = userData;

  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  // Dummy data for now (replace with Firestore values when ready)
  const totalMatches = 127;
  const winRate = 73;
  const ldRating = 1847;
  const pfRating = 1632;
  const winStreak = 5;
  const lastEloChange = 12;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Profile Card */}
      <Link to="/profile">
        <Card className="bg-gradient-hero border-border">
          <CardContent className="p-6 text-center">
            <Avatar className="w-20 h-20 mx-auto mb-4 ring-2 ring-primary">
              <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-lg text-foreground">{fullName}</h3>
            <p className="text-sm text-muted-foreground">{school}</p>
          </CardContent>
        </Card>
      </Link>

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
              <span className={`font-bold text-lg ${getRatingColor(ldRating)}`}>
                {ldRating}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">PF Rating</span>
              <span className={`font-bold text-lg ${getRatingColor(pfRating)}`}>
                {pfRating}
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
              <span className="font-bold text-lg text-foreground">{totalMatches}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <span className="font-bold text-lg text-affirmative">{winRate}%</span>
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
                {winStreak} wins
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Match</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-affirmative" />
                <span className="font-bold text-affirmative">+{lastEloChange}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
