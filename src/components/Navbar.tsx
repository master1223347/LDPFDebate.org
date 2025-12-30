import { useEffect, useState } from "react";
import { Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { setupPresenceTracking } from "@/lib/presence";

export const Navbar = () => {
  const navigate = useNavigate();
  const [initials, setInitials] = useState("JD");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch initials when user logs in
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const firstName = data.firstName ?? "";
          const lastName = data.lastName ?? "";
          const generated = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
          setInitials(generated || "??");
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Real-time notification listener
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("hostId", "==", auth.currentUser.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-card border-b border-border">
      <div className="flex items-center space-x-4">
        <Link to="/home" className="flex items-center space-x-2" style={{ textDecoration: "none" }}>
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">DebateTogether</h1>
        </Link>

  {/* Building page link removed */}
      </div>

      <div className="flex items-center space-x-4">
        {/* Bell with badge */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate("/notifications")}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
          )}
        </Button>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                <AvatarFallback className="text-sm">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <Link to="/profile">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
