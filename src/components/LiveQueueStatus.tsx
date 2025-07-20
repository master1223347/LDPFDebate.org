import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Globe } from "lucide-react";

export const LiveQueueStatus = () => {
  return (
    <Card className="bg-gradient-hero border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Platform Activity
          </h3>
          <Badge className="bg-live-pulse text-background animate-live-dot">
            LIVE
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-affirmative" />
            </div>
            <p className="text-2xl font-bold text-foreground">42</p>
            <p className="text-xs text-muted-foreground">Active Matches</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-6 w-6 text-judge" />
            </div>
            <p className="text-2xl font-bold text-foreground">127</p>
            <p className="text-xs text-muted-foreground">In Queue</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">892</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        
        {/* Recent matches ticker */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Recent Finishes</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Sarah M. vs Alex K.</span>
              <span className="text-affirmative">AFF wins</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Mike R. vs Lisa C.</span>
              <span className="text-negative">NEG wins</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};