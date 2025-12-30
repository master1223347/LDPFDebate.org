import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Trophy, Target, Zap, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export const HeroStatsPanel = () => {
  const [userData, setUserData] = useState<any | null>(null);
  const [stats, setStats] = useState({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    winStreak: 0,
    lastEloChange: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user data
          const ref = doc(db, "users", user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);

            // Calculate stats from matches
            try {
              const debatesRef = collection(db, "debates");
              const userDebatesQuery = query(
                debatesRef,
                where("hostId", "==", user.uid)
              );
              
              const opponentDebatesQuery = query(
                debatesRef,
                where("opponentId", "==", user.uid)
              );

              const [hostDebates, opponentDebates] = await Promise.all([
                getDocs(userDebatesQuery).catch(() => ({ docs: [] })),
                getDocs(opponentDebatesQuery).catch(() => ({ docs: [] })),
              ]);

              // Combine all debates
              const allDebates = [
                ...hostDebates.docs.map(d => ({ ...d.data(), id: d.id, isHost: true })),
                ...opponentDebates.docs.map(d => ({ ...d.data(), id: d.id, isHost: false })),
              ];

              // Filter completed debates (you may need to adjust this based on your debate status)
              const completedDebates = allDebates.filter(d => 
                m.status === "completed" || m.status === "finished"
              );

              // Calculate wins/losses (this is simplified - adjust based on your debate result structure)
              const wins = completedDebates.length; // Simplified - you'll need to check actual results
              const totalDebates = completedDebates.length;
              const winRate = totalDebates > 0 ? Math.round((wins / totalDebates) * 100) : 0;

              // Get rating history for last change
              const ratingHistory = data.ratingHistory || [];
              const lastChange = ratingHistory.length > 0 
                ? ratingHistory[ratingHistory.length - 1]?.delta || 0
                : 0;

              // Calculate win streak (simplified)
              const winStreak = 0; // You'll need to implement this based on your debate history

              setStats({
                totalMatches: totalDebates,
                wins,
                losses: totalMatches - wins,
                winRate,
                winStreak,
                lastEloChange: lastChange,
              });
            } catch (matchError) {
              console.error("Error loading match stats:", matchError);
              // Set default stats if match query fails
              setStats({
                totalMatches: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                winStreak: 0,
                lastEloChange: 0,
              });
            }
          }
        } catch (error) {
          console.error("Error loading user stats:", error);
          setStats({
            totalMatches: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            winStreak: 0,
            lastEloChange: 0,
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const getRatingColor = (rating: number) => {
    if (rating >= 2000) return "text-rating-gold";
    if (rating >= 1600) return "text-rating-silver";
    return "text-rating-bronze";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gradient-hero border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!userData) {
    return <div className="text-muted-foreground">Please log in to view your stats.</div>;
  }

  // Destructure with fallbacks
  const {
    firstName = "",
    lastName = "",
    school = "Unknown School",
    rating = 800,
    ldRating = rating,
    pfRating = rating,
  } = userData;

  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Profile Card */}
      <Link to="/profile">
        <Card className="bg-gradient-hero border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <Avatar className="w-20 h-20 mx-auto mb-4 ring-2 ring-primary">
              <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
              <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-lg text-foreground">{fullName}</h3>
            <p className="text-sm text-muted-foreground">{school}</p>
          </CardContent>
        </Card>
      </Link>

      {/* Ratings Card */}
      <Card className="bg-gradient-hero border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
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
      <Card className="bg-gradient-hero border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
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
              <span className="font-bold text-lg text-affirmative">{stats.winRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance Card */}
      <Card className="bg-gradient-hero border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
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
                {stats.lastEloChange > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-affirmative" />
                    <span className="font-bold text-affirmative">+{stats.lastEloChange}</span>
                  </>
                ) : stats.lastEloChange < 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-negative rotate-180" />
                    <span className="font-bold text-negative">{stats.lastEloChange}</span>
                  </>
                ) : (
                  <span className="font-bold text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
