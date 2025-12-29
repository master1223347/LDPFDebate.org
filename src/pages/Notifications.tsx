import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs, deleteDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Trash2, CheckSquare, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [proposals, setProposals] = useState<Record<string, any[]>>({});
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("hostId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
    });

    return () => unsubscribe();
  }, []);

  // Fetch proposals for each notification
  useEffect(() => {
    const fetchProposals = async () => {
      const proposalsData: Record<string, any[]> = {};

      for (const n of notifications) {
        const proposalsRef = collection(doc(db, "matches", n.matchId), "proposals");
        const proposalsSnap = await getDocs(proposalsRef);
        proposalsData[n.matchId] = proposalsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      setProposals(proposalsData);
    };

    if (notifications.length > 0) fetchProposals();
  }, [notifications]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
    toast.success("Notification marked as read");
  };

  const handleAccept = async (matchId: string, proposalId: string) => {
    await updateDoc(
      doc(db, "matches", matchId, "proposals", proposalId),
      { status: "accepted" }
    );
    toast.success("Proposal accepted");
  };

  const handleDecline = async (matchId: string, proposalId: string) => {
    await updateDoc(
      doc(db, "matches", matchId, "proposals", proposalId),
      { status: "declined" }
    );
    toast.error("Proposal declined");
  };

  const toggleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const deleteSelected = async () => {
    if (selectedNotifications.size === 0) {
      toast.error("No notifications selected");
      return;
    }

    try {
      const batch = writeBatch(db);
      selectedNotifications.forEach(id => {
        const notificationRef = doc(db, "notifications", id);
        batch.delete(notificationRef);
      });
      
      await batch.commit();
      toast.success(`Deleted ${selectedNotifications.size} notification(s)`);
      setSelectedNotifications(new Set());
      setIsSelectMode(false);
    } catch (error) {
      console.error("Error deleting notifications:", error);
      toast.error("Failed to delete notifications");
    }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) {
      toast.error("No notifications to clear");
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${notifications.length} notification(s)?`)) {
      return;
    }

    try {
      const batch = writeBatch(db);
      notifications.forEach(notification => {
        const notificationRef = doc(db, "notifications", notification.id);
        batch.delete(notificationRef);
      });
      
      await batch.commit();
      toast.success(`Cleared all ${notifications.length} notification(s)`);
      setSelectedNotifications(new Set());
      setIsSelectMode(false);
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {notifications.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({notifications.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              {isSelectMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedNotifications.size === notifications.length ? (
                      <Square className="h-4 w-4 mr-2" />
                    ) : (
                      <CheckSquare className="h-4 w-4 mr-2" />
                    )}
                    {selectedNotifications.size === notifications.length ? "Deselect All" : "Select All"}
                  </Button>
                  {selectedNotifications.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelected}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedNotifications.size})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsSelectMode(false);
                      setSelectedNotifications(new Set());
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSelectMode(true)}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearAllNotifications}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        notifications.map((n) => (
          <Card 
            key={n.id} 
            className={`bg-card border-border shadow-md transition-all ${
              selectedNotifications.has(n.id) ? "ring-2 ring-primary" : ""
            }`}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-3">
                {isSelectMode && (
                  <Checkbox
                    checked={selectedNotifications.has(n.id)}
                    onCheckedChange={() => toggleSelectNotification(n.id)}
                    className="mt-1"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${n.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                      {n.message}
                    </span>
                    {!isSelectMode && !n.read && (
                      <Button variant="link" size="sm" onClick={() => markAsRead(n.id)}>
                        Mark as Read
                      </Button>
                    )}
                    {!isSelectMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={async () => {
                          try {
                            await deleteDoc(doc(db, "notifications", n.id));
                            toast.success("Notification deleted");
                          } catch (error) {
                            console.error("Error deleting notification:", error);
                            toast.error("Failed to delete notification");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Proposal details */}
                  {proposals[n.matchId]?.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-lg p-5 transition hover:shadow-xl mt-3"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-lg font-semibold text-foreground">
                          Proposal from {proposal.proposerName}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            proposal.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-600"
                              : proposal.status === "accepted"
                              ? "bg-green-500/20 text-green-600"
                              : "bg-red-500/20 text-red-600"
                          }`}
                        >
                          {proposal.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><strong>Timezone:</strong> {proposal.timezone}</p>
                        <p><strong>Date:</strong> {proposal.date?.toDate().toLocaleString()}</p>
                        <p><strong>Contact:</strong> {proposal.contactMethod} – {proposal.contactInfo}</p>
                        {proposal.notes && <p><strong>Notes:</strong> {proposal.notes}</p>}
                      </div>

                      {proposal.status === "pending" && (
                        <div className="flex gap-3 mt-4">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 w-full"
                            onClick={() => handleAccept(n.matchId, proposal.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleDecline(n.matchId, proposal.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
