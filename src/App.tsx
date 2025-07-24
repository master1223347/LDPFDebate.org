import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PlayerVsAI from "./pages/PlayerVsAI";
import PlayerVsPlayer from "./pages/PlayerVsPlayer";
import JoinMatch from "./pages/JoinMatch";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Spectate from "./pages/Spectate";
import Learn from "./pages/Learn";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import SignUp from "./pages/SignUp";
import Login from "./pages/LogIn";
import Lobby from "./pages/Lobby";
import PrivateRoute from "./components/PrivateRoute";
// Inside <Routes>


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/" element={<Landing />} />
            <Route path="/home" element={
              <PrivateRoute>
                <Index />
              </PrivateRoute>
            } />
          <Route path="/vs-ai" element={<PlayerVsAI />} />
          <Route path="/vs-player" element={<PlayerVsPlayer />} />
          <Route path="/join" element={<JoinMatch />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/spectate" element={<Spectate />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/lobby" element={<Lobby />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
