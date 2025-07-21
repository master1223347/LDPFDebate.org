import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Target, Users } from "lucide-react";

const backgroundImage = "/public/placeholder.svg"; // Replace with your preferred image

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-card scroll-smooth">
      {/* Hero Section - fills entire screen */}
      <div
        className="relative w-full h-screen flex flex-col items-center justify-center text-center overflow-hidden animate-fade-in"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(var(--primary)/0.7), hsl(var(--accent)/0.7)), url('${backgroundImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex flex-col items-center justify-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-primary-foreground drop-shadow-lg mb-4 animate-glow">
            DebateTogether.org
          </h1>
          <h2 className="text-xl md:text-2xl text-muted-foreground mb-8 font-medium animate-fade-in-delay">
            Connect, Compete, and Grow Together in Debate
          </h2>
          <div className="flex gap-6 justify-center">
            <Link to="/login">
              <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/80 transition duration-300 hover:scale-105 hover:shadow-[0_0_20px_hsl(var(--primary)/0.7)] focus:outline-none">
                Login
              </button>
            </Link>
            <Link to="/signup">
              <button className="px-6 py-3 rounded-lg bg-accent text-accent-foreground font-semibold shadow-lg hover:bg-accent/80 transition duration-300 hover:scale-105 hover:shadow-[0_0_20px_hsl(var(--accent)/0.7)] focus:outline-none">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </div>
      {/* About Section */}
      <div className="max-w-2xl mx-auto mt-12 p-6 rounded-xl bg-card/80 shadow-card border border-border animate-fade-in-delay">
        <h3 className="text-2xl font-bold text-foreground mb-2">About DebateTogether</h3>
        <p className="text-muted-foreground text-base">
          DebateTogether.org is a platform designed to bring debaters together from all backgrounds. Whether you're a seasoned competitor or just starting out, our community and tools help you connect, learn, and grow. Join live debates, track your progress, and be part of a supportive network that values respectful discourse and personal development.
        </p>
      </div>
      {/* Features Section */}
      <div className="max-w-5xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        <div className="bg-card/70 rounded-lg shadow-card p-6 border border-border flex flex-col items-center transition duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] animate-fade-in">
          <Sparkles className="w-10 h-10 text-primary mb-2 animate-bounce" />
          <h4 className="text-lg font-bold text-foreground mb-1">Live Debates</h4>
          <p className="text-muted-foreground text-sm text-center">Join or watch real-time debates and learn from the best.</p>
        </div>
        <div className="bg-card/70 rounded-lg shadow-card p-6 border border-border flex flex-col items-center transition duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--accent)/0.5)] animate-fade-in-delay">
          <Target className="w-10 h-10 text-accent mb-2 animate-pulse" />
          <h4 className="text-lg font-bold text-foreground mb-1">Skill Tracking</h4>
          <p className="text-muted-foreground text-sm text-center">Track your progress and see how you improve over time.</p>
        </div>
        <div className="bg-card/70 rounded-lg shadow-card p-6 border border-border flex flex-col items-center transition duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] animate-fade-in">
          <Users className="w-10 h-10 text-primary mb-2 animate-spin-slow" />
          <h4 className="text-lg font-bold text-foreground mb-1">Community</h4>
          <p className="text-muted-foreground text-sm text-center">Connect with fellow debaters, mentors, and friends.</p>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-4xl mx-auto mt-16 px-4 animate-fade-in-delay">
        <h3 className="text-xl font-bold text-foreground mb-6 text-center">What Our Members Say</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card/60 rounded-lg p-5 border border-border shadow-card transition duration-300 hover:scale-105 hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] animate-fade-in">
            <p className="text-base text-muted-foreground italic mb-2">“DebateTogether helped me find my voice and connect with amazing people!”</p>
            <span className="text-sm text-primary font-semibold">— Alex, Student</span>
          </div>
          <div className="bg-card/60 rounded-lg p-5 border border-border shadow-card transition duration-300 hover:scale-105 hover:shadow-[0_0_20px_hsl(var(--accent)/0.5)] animate-fade-in-delay">
            <p className="text-base text-muted-foreground italic mb-2">“The live debates and feedback are top notch. Highly recommend!”</p>
            <span className="text-sm text-accent font-semibold">— Jamie, Coach</span>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="w-full mt-20 py-12 bg-gradient-to-r from-primary/60 to-accent/60 flex flex-col items-center justify-center animate-fade-in">
        <h3 className="text-3xl font-bold text-primary-foreground mb-4 animate-glow">Ready to join the conversation?</h3>
        <Link to="/signup">
          <button className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg hover:bg-primary/80 transition duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--primary)/0.7)] focus:outline-none">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
}
