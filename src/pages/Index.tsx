import { Navbar } from "@/components/Navbar";
import { CurrentTopicBanner } from "@/components/CurrentTopicBanner";
import { HeroStatsPanel } from "@/components/HeroStatsPanel";
import { ActiveGamesPanel } from "@/components/ActiveGamesPanel";
import { QuickActionButtons } from "@/components/QuickActionButtons";
import { LiveQueueStatus } from "@/components/LiveQueueStatus";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CurrentTopicBanner />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <HeroStatsPanel />
        <ActiveGamesPanel />
        <QuickActionButtons />
        <LiveQueueStatus />
      </div>
    </div>
  );
};

export default Index;
