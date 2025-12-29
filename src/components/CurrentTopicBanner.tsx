import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { fetchNSDATopics, getCurrentTopicPeriod, type NSDATopic } from "@/lib/nsdaTopics";
import { Loader2 } from "lucide-react";

// Fallback topics
const fallbackTopics: Record<string, NSDATopic> = {
  LD: {
    format: "LD",
    topic: "In the United States criminal justice system, plea bargaining is just.",
    month: "December",
    year: "2024",
  },
  PF: {
    format: "PF",
    topic: "The United Kingdom should rejoin the European Union.",
    month: "December",
    year: "2024",
  },
};

export const CurrentTopicBanner = () => {
  const [selectedFormat, setSelectedFormat] = useState<"LD" | "PF">("LD");
  const [topics, setTopics] = useState<Record<string, NSDATopic>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const { month, year } = getCurrentTopicPeriod();

  useEffect(() => {
    const loadTopics = async () => {
      setLoading(true);
      setError(false);
      try {
        // Use fallback topics immediately, then try to fetch
        setTopics(fallbackTopics);
        const fetchedTopics = await fetchNSDATopics();
        setTopics(fetchedTopics);
      } catch (err) {
        console.error("Error loading topics:", err);
        setError(true);
        // Ensure we have fallback topics even on error
        setTopics(fallbackTopics);
      } finally {
        setLoading(false);
        // Mark that initial animation has played
        setHasAnimated(true);
      }
    };

    loadTopics();
  }, []);

  const currentTopic = topics[selectedFormat]?.topic || "Loading topic...";

  return (
    <div className="bg-gradient-to-r from-primary/10 via-background to-accent/10 border-b border-border p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.05),transparent_70%)]" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex gap-2">
                <Button 
                  variant={selectedFormat === "LD" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFormat("LD")}
                  className="rounded-full"
                >
                  Lincoln-Douglas
                </Button>
                <Button 
                  variant={selectedFormat === "PF" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFormat("PF")}
                  className="rounded-full"
                >
                  Public Forum
                </Button>
              </div>
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            <div className="overflow-hidden">
              {loading ? (
                <div className="h-10 flex items-center">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <h2 
                  key={hasAnimated ? "no-animate" : "animate"}
                  className={`text-2xl md:text-3xl font-bold text-foreground ${
                    hasAnimated ? "" : "animate-in fade-in slide-in-from-bottom-2 duration-500"
                  }`}
                >
                  {currentTopic}
                </h2>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Topic</p>
            <p className="text-lg font-semibold text-foreground">
              {selectedFormat} {month} {year}
            </p>
            {error && (
              <p className="text-xs text-muted-foreground mt-1">
                Using default topic
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
