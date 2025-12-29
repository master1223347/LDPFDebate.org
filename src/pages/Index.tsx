import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { CurrentTopicBanner } from "@/components/CurrentTopicBanner";
import { HeroStatsPanel } from "@/components/HeroStatsPanel";
import { ActiveGamesPanel } from "@/components/ActiveGamesPanel";
import { QuickActionButtons } from "@/components/QuickActionButtons";
import { LiveQueueStatus } from "@/components/LiveQueueStatus";
import { setupPresenceTracking } from "@/lib/presence";

const Index = () => {
  useEffect(() => {
    // Set up presence tracking when user is on the home page
    const cleanup = setupPresenceTracking();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CurrentTopicBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Stats Section */}
        <HeroStatsPanel />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Active Games */}
          <div className="lg:col-span-2">
            <ActiveGamesPanel />
          </div>
          
          {/* Right Column - Live Queue Status */}
          <div className="lg:col-span-1">
            <LiveQueueStatus />
          </div>
        </div>
        
        {/* Quick Actions */}
        <QuickActionButtons />
      </div>
    </div>
  );
};

export default Index;
