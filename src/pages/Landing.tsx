import React from "react";
import { Link } from "react-router-dom";
import { Target, Users, Zap, Trophy, Clock, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-background scroll-smooth">
      {/* Hero Section */}
      <div className="relative w-full min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary/10 animate-pulse"
        style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-extrabold text-foreground mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              DebateTogether
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-medium max-w-2xl">
            Connect, Compete, and Grow Together in Debate
          </p>
          
          <p className="text-base md:text-lg text-muted-foreground/80 mb-10 max-w-xl">
            Join debates, practice with AI, track your progress, and be part of a thriving community of debaters
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 py-6 h-auto bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Quick stats */}
          
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-primary/50 rounded-full" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools and features designed to help you become a better debater
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Debates</h3>
                <p className="text-muted-foreground">
                  Join real-time debates with players worldwide. Practice LD and PF formats with structured timing and phases.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">AI Practice</h3>
                <p className="text-muted-foreground">
                  Practice anytime with our AI opponent. Adjust difficulty levels and get instant feedback on your performance.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Skill Tracking</h3>
                <p className="text-muted-foreground">
                  Monitor your progress with detailed analytics. See how you improve over time and identify areas to focus on.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Leaderboards</h3>
                <p className="text-muted-foreground">
                  Compete for the top spots on our global leaderboard. Climb the ranks and showcase your skills.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Smart Timers</h3>
                <p className="text-muted-foreground">
                  Automatic phase management with built-in timers. Focus on debating while we handle the timing.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Community</h3>
                <p className="text-muted-foreground">
                  Connect with fellow debaters, find mentors, and build lasting relationships in our supportive community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and join your first debate today
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection line for desktop */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mb-4 mx-auto">
                1
              </div>
              <Card className="border-2 border-primary/30 bg-card/80">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-foreground mb-2">Sign Up</h3>
                  <p className="text-muted-foreground">
                    Create your free account in seconds. No credit card required.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mb-4 mx-auto">
                2
              </div>
              <Card className="border-2 border-primary/30 bg-card/80">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-foreground mb-2">Find a Match</h3>
                  <p className="text-muted-foreground">
                    Browse available debates or create your own. Choose your format and difficulty.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mb-4 mx-auto">
                3
              </div>
              <Card className="border-2 border-primary/30 bg-card/80">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-foreground mb-2">Start Debating</h3>
                  <p className="text-muted-foreground">
                    Join the debate room, connect via video, and let the structured timers guide you.
                  </p>
                </CardContent>
              </Card>
            </div>
        </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Why Choose DebateTogether?
            </h2>
          </div>
          <div className="space-y-4 mb-8">
            {[
              "Practice with real opponents or AI anytime",
              "Structured debate formats (LD & PF) with automatic timers",
              "Track your progress and see improvement over time",
              "Join a supportive community of passionate debaters",
              "Free to start with no hidden costs",
              "Video integration for authentic debate experience",
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-lg text-muted-foreground">{benefit}</p>
      </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Ready to Elevate Your Debate Skills?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start improving your debate skills and building connections today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/signup">
              <Button size="lg" className="text-lg px-10 py-6 h-auto bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/learn">
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 h-auto border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105">
                Learn More
              </Button>
        </Link>
      </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">DebateTogether.org</h3>
              <p className="text-sm text-muted-foreground">
                The premier platform for competitive debate practice and community building.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/signup" className="hover:text-primary transition-colors">Sign Up</Link></li>
                <li><Link to="/login" className="hover:text-primary transition-colors">Login</Link></li>
                <li><Link to="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link></li>
                <li><Link to="/learn" className="hover:text-primary transition-colors">Learn</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Debates</li>
                <li>AI Practice</li>
                <li>Skill Tracking</li>
                <li>Community</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} DebateTogether.org. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
