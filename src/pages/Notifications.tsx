import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [proposals, setProposals] = useState<Record<string, any[]>>({});
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

  return (
    <div className="p-6 space-y-4">
      {/* ✅ Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/home")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Match Proposals</h1>
      </div>

      {notifications.map((n) => (
        <Card key={n.id} className="bg-card border-border shadow-md">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{n.message}</span>
              {!n.read && (
                <Button variant="link" onClick={() => markAsRead(n.id)}>
                  Mark as Read
                </Button>
              )}
            </div>

            {/* Proposal details */}
            {proposals[n.matchId]?.map((proposal) => (
              <div
                key={proposal.id}
                className="rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-lg p-5 transition hover:shadow-xl"
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
