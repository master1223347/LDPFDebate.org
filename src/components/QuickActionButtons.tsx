import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Flame, 
  Users, 
  Bot, 
  Eye, 
  Trophy, 
  Link2,
  Sparkles,
  Target
} from "lucide-react";

export const QuickActionButtons = () => {
  const actions = [
    {
      icon: Flame,
      title: "Practice",
      description: "Sharpen your skills",
      variant: "practice" as const,
      badge: "Solo",
      route: "/learn"
    },
    {
      icon: Users,
      title: "PvP",
      description: "Challenge real opponents",
      variant: "pvp" as const,
      badge: "Multiplayer",
      route: "/vs-player"
    },
    {
      icon: Bot,
      title: "PvAI",
      description: "Debate against AI",
      variant: "ai" as const,
      badge: "GPT-4",
      route: "/vs-ai"
    },
    {
      icon: Eye,
      title: "Spectate",
      description: "Watch debates",
      variant: "spectate" as const,
      badge: "42",
      route: "/spectate"
    },
    {
      icon: Trophy,
      title: "Leaderboard",
      description: "View rankings",
      variant: "leaderboard" as const,
      badge: "Top 100",
      route: "/leaderboard"
    },
    {
      icon: Link2,
      title: "Join Match",
      description: "Enter with room code",
      variant: "join" as const,
      badge: "Code",
      route: "/join"
    }
  ];

  const getVariantClasses = (variant: string) => {
    switch (variant) {
      case "practice":
        return "bg-gradient-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] border-primary/20";
      case "pvp":
        return "bg-gradient-affirmative hover:shadow-[0_0_30px_hsl(var(--affirmative)/0.4)] border-affirmative/20";
      case "ai":
        return "bg-gradient-negative hover:shadow-[0_0_30px_hsl(var(--negative)/0.4)] border-negative/20";
      default:
        return "bg-gradient-hero hover:shadow-[0_0_20px_hsl(var(--muted)/0.3)] border-muted/20";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link to={action.route} key={action.title} style={{ textDecoration: "none" }}>
            <Card 
              className={`
                group cursor-pointer transition-all duration-300 transform hover:scale-105 
                ${getVariantClasses(action.variant)}
                border-2 hover:animate-pulse-glow
              `}
            >
              <CardContent className="p-8 text-center relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon className="w-32 h-32 absolute -top-4 -right-4 rotate-12" />
                </div>
                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="text-xs">
                    {action.badge}
                  </Badge>
                </div>
                {/* Content */}
                <div className="relative z-10">
                  <div className="mb-4 flex justify-center">
                    <div className="p-4 rounded-full bg-card/50 group-hover:bg-card/70 transition-colors">
                      <Icon className="w-8 h-8 text-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary-foreground transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/80 transition-colors">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};