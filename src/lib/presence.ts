import { db, auth } from "./firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * Updates the user's lastSeen timestamp to indicate they are online
 * Should be called when the user is active (on page load, navigation, etc.)
 */
export async function updateUserPresence() {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  
  try {
    await updateDoc(userRef, {
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user presence:", error);
  }
}

/**
 * Sets up presence tracking for the current user
 * Updates lastSeen on mount and sets up cleanup on disconnect
 */
export function setupPresenceTracking() {
  const user = auth.currentUser;
  if (!user) return () => {};

  // Update presence immediately (don't await to avoid blocking)
  updateUserPresence().catch(err => {
    console.error("Failed to update presence on mount:", err);
  });

  // Set up onDisconnect handler (for when user closes browser/tab)
  // Note: onDisconnect requires Realtime Database, so we'll use periodic updates instead
  
  // Update presence every 30 seconds while user is active
  const interval = setInterval(() => {
    updateUserPresence().catch(err => {
      console.error("Failed to update presence in interval:", err);
    });
  }, 30000); // 30 seconds

  // Also update on page visibility change (when user switches tabs back)
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      updateUserPresence().catch(err => {
        console.error("Failed to update presence on visibility change:", err);
      });
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Cleanup function
  return () => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}

