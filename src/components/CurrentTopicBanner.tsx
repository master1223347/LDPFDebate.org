import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const CurrentTopicBanner = () => {
  const [selectedFormat, setSelectedFormat] = useState<"LD" | "PF">("LD");
  
  const topics = {
    LD: "In the United States, the federal government should provide universal healthcare to its citizens.",
    PF: "The benefits of artificial intelligence outweigh the harms."
  };

  return (
    <div className="bg-gradient-hero border-b border-border p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="secondary" className="animate-live-dot">
                LIVE
              </Badge>
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
            </div>
            
            <div className="overflow-hidden">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground animate-typewriter">
                {topics[selectedFormat]}
              </h2>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Topic</p>
            <p className="text-lg font-semibold text-foreground">{selectedFormat} December 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
};