import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, User, MessageSquare } from "lucide-react";

type Proposal = {
  id: string;
  timezone: string;
  date: any;
  contactMethod: string;
  contactInfo: string;
  notes: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: any;
  proposerId: string;
  proposerName: string;
  proposerUsername: string;
};

type Match = {
  id: string;
  format: "LD" | "PF";
  timeControl: string;
  difficulty: string;
  hostId: string;
  hostName?: string;
  hostUsername?: string;
  createdAt: any;
  status: string;
};

export default function MatchProposals() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;

    // Get match details
    const matchUnsubscribe = onSnapshot(doc(db, "matches", matchId), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Match;
        setMatch({ id: doc.id, ...data });
        
        // Check if current user is the host
        if (data.hostId !== auth.currentUser?.uid) {
          toast.error("You can only view proposals for your own matches");
          navigate("/lobby");
          return;
        }
      }
      setLoading(false);
    });

    // Get proposals for this match
    const proposalsUnsubscribe = onSnapshot(
      collection(doc(db, "matches", matchId), "proposals"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Proposal, "id">),
        }));
        setProposals(data);
      }
    );

    return () => {
      matchUnsubscribe();
      proposalsUnsubscribe();
    };
  }, [matchId, navigate]);

  const handleAcceptProposal = async (proposal: Proposal) => {
    if (!matchId || !match) return;

    try {
      // Update the proposal status
      await updateDoc(doc(db, "matches", matchId, "proposals", proposal.id), {
        status: "accepted"
      });

      // Update the match to include the opponent
      await updateDoc(doc(db, "matches", matchId), {
        opponentId: proposal.proposerId,
        opponentName: proposal.proposerName,
        opponentUsername: proposal.proposerUsername,
        status: "ready",
        acceptedProposalId: proposal.id,
        acceptedAt: serverTimestamp()
      });

      // Reject all other proposals
      const otherProposals = proposals.filter(p => p.id !== proposal.id);
      for (const otherProposal of otherProposals) {
        await updateDoc(doc(db, "matches", matchId, "proposals", otherProposal.id), {
          status: "rejected"
        });
      }

      toast.success("✅ Proposal accepted! The match is now ready. Both players can join from the lobby.");
      navigate("/lobby");
    } catch (error) {
      console.error("Error accepting proposal:", error);
      toast.error("Failed to accept proposal");
    }
  };

  const handleRejectProposal = async (proposal: Proposal) => {
    if (!matchId) return;

    try {
      await updateDoc(doc(db, "matches", matchId, "proposals", proposal.id), {
        status: "rejected"
      });

      toast.success("Proposal rejected");
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      toast.error("Failed to reject proposal");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case "email": return "📧";
      case "discord": return "🎮";
      case "phone": return "📞";
      default: return "💬";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Match not found</h1>
          <Button onClick={() => navigate("/lobby")} className="mt-4">
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Match Proposals</h1>
            <p className="text-muted-foreground">
              {match.format} Match • {match.timeControl} • {match.difficulty}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/lobby")}>
            Back to Lobby
          </Button>
        </div>

        {/* Match Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Match Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Format</p>
                <p className="text-lg font-semibold">{match.format}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Time Control</p>
                <p className="text-lg font-semibold">{match.timeControl}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Difficulty</p>
                <p className="text-lg font-semibold capitalize">{match.difficulty}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proposals Section */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Proposals ({proposals.length})
          </h2>
          
          {proposals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No proposals received yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Players can propose times to join your match.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <Card key={proposal.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {proposal.proposerName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          @{proposal.proposerUsername}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          proposal.status === "accepted" ? "default" :
                          proposal.status === "rejected" ? "destructive" : "secondary"
                        }
                      >
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Date:</span>
                        <span className="font-medium">{formatDate(proposal.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Timezone:</span>
                        <span className="font-medium">{proposal.timezone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-muted-foreground">Contact:</span>
                      <span className="text-lg">{getContactMethodIcon(proposal.contactMethod)}</span>
                      <span className="font-medium">{proposal.contactInfo}</span>
                    </div>

                    {proposal.notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                        <p className="text-sm">{proposal.notes}</p>
                      </div>
                    )}

                    {proposal.status === "pending" && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleAcceptProposal(proposal)}
                          className="flex-1"
                        >
                          Accept Proposal
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleRejectProposal(proposal)}
                          className="flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {proposal.status === "accepted" && (
                      <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium">✅ Proposal Accepted</p>
                        <p className="text-sm text-green-600">
                          This player will join your match
                        </p>
                      </div>
                    )}

                    {proposal.status === "rejected" && (
                      <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 font-medium">❌ Proposal Rejected</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
