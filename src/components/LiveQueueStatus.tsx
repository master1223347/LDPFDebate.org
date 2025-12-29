import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Globe, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, getDocs, Timestamp } from "firebase/firestore";

export const LiveQueueStatus = () => {
  const [stats, setStats] = useState({
    activeMatches: 0,
    inQueue: 0,
    online: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentFinishes, setRecentFinishes] = useState<Array<{
    players: string;
    result: string;
  }>>([]);

  useEffect(() => {
    // Listen to active matches
    const activeMatchesQuery = query(
      collection(db, "matches"),
      where("status", "in", ["ready", "active"])
    );

    // Listen to waiting matches (in queue)
    const queueQuery = query(
      collection(db, "matches"),
      where("status", "==", "waiting")
    );

    const unsubscribeActive = onSnapshot(activeMatchesQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        activeMatches: snapshot.size,
      }));
      setLoading(false);
    });

    const unsubscribeQueue = onSnapshot(queueQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        inQueue: snapshot.size,
      }));
    });

    // Get recent finished matches (you may need to adjust this query)
    const getRecentFinishes = async () => {
      try {
        const finishedQuery = query(
          collection(db, "matches"),
          where("status", "==", "completed")
        );
        const snapshot = await getDocs(finishedQuery).catch(() => ({ docs: [] }));
        
        // Get the 3 most recent
        const recent = snapshot.docs
          .sort((a, b) => {
            const aTime = a.data().completedAt?.toMillis() || 0;
            const bTime = b.data().completedAt?.toMillis() || 0;
            return bTime - aTime;
          })
          .slice(0, 3)
          .map(doc => {
            const data = doc.data();
            return {
              players: `${data.hostUsername || "Player 1"} vs ${data.opponentUsername || "Player 2"}`,
              result: data.winner === "host" ? "AFF wins" : "NEG wins",
            };
          });
        
        setRecentFinishes(recent);
      } catch (error) {
        console.error("Error fetching recent finishes:", error);
      }
    };

    getRecentFinishes();

    // Get real online users count (users active within last 5 minutes)
    const getOnlineUsers = async () => {
      try {
        const fiveMinutesAgo = Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000));
        const onlineUsersQuery = query(
          collection(db, "users"),
          where("lastSeen", ">=", fiveMinutesAgo)
        );
        const snapshot = await getDocs(onlineUsersQuery);
        const count = snapshot.size;
        console.log("Online users query result:", count, "users active in last 5 minutes");
        setStats(prev => ({ ...prev, online: count }));
      } catch (err: any) {
        console.error("Error fetching online users:", err);
        // Check if it's an index error
        if (err?.code === "failed-precondition" || err?.message?.includes("index")) {
          console.warn("Firestore index required! The query needs an index on 'users' collection for 'lastSeen' field.");
          console.warn("Click the link in the error message above to create the index, or use the fallback estimate.");
        }
        // Fallback: get all users and filter manually (less efficient but works without index)
        try {
          const allUsersSnapshot = await getDocs(collection(db, "users"));
          const now = Date.now();
          const fiveMinutesAgoMs = now - 5 * 60 * 1000;
          const onlineCount = allUsersSnapshot.docs.filter(doc => {
            const lastSeen = doc.data().lastSeen;
            if (!lastSeen) return false;
            const lastSeenMs = lastSeen.toMillis ? lastSeen.toMillis() : lastSeen;
            return lastSeenMs >= fiveMinutesAgoMs;
          }).length;
          console.log("Using manual filter fallback - online users:", onlineCount);
          setStats(prev => ({ ...prev, online: onlineCount }));
        } catch (fallbackErr) {
          console.error("Error in fallback estimate:", fallbackErr);
          // Final fallback: estimate based on active matches
          try {
            const snapshot = await getDocs(activeMatchesQuery);
            const estimated = snapshot.size * 2;
            console.log("Using match-based estimate:", estimated);
            setStats(prev => ({ ...prev, online: estimated }));
          } catch (finalErr) {
            console.error("All fallbacks failed:", finalErr);
          }
        }
      }
    };

    getOnlineUsers();
    const onlineInterval = setInterval(getOnlineUsers, 30000); // Update every 30 seconds

    return () => {
      unsubscribeActive();
      unsubscribeQueue();
      clearInterval(onlineInterval);
    };
  }, []);

  return (
    <Card className="bg-gradient-hero border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Platform Activity
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-affirmative" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.activeMatches}</p>
                <p className="text-xs text-muted-foreground">Active Matches</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-6 w-6 text-judge" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.inQueue}</p>
                <p className="text-xs text-muted-foreground">In Queue</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.online}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            
            {/* Recent matches ticker */}
            {recentFinishes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Recent Finishes</p>
                <div className="space-y-1 text-xs">
                  {recentFinishes.map((finish, i) => (
                    <div key={i} className="flex justify-between text-muted-foreground">
                      <span>{finish.players}</span>
                      <span className={finish.result.includes("AFF") ? "text-affirmative" : "text-negative"}>
                        {finish.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
