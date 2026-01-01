import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp, getDocs } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom" ;
import { JoinMatchModal } from "@/components/ui/JoinMatchModal";
import { CounterProposalResponse } from "@/components/ui/CounterProposalResponse";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { Clock, AlertCircle } from "lucide-react";


type Debate = {
  id: string;
  format: "LD" | "PF";
  timeControl?: string;
  difficulty?: string;
  hostId: string;
  hostName?: string;
  hostUsername?: string;
  createdAt: Timestamp;
  status: string;
  opponentId?: string;
  opponentName?: string;
  opponentUsername?: string;
  googleMeetUrl?: string;
};

type Proposal = {
  id: string;
  timezone: string;
  date: any;
  contactMethod: string;
  contactInfo: string;
  notes: string;
  status: "pending" | "accepted" | "rejected" | "countered";
  counterProposal?: {
    timezone: string;
    date: any;
    notes?: string;
    proposedBy: "host" | "proposer";
    proposedAt: any;
  };
  proposerId: string;
  proposerName: string;
  proposerUsername: string;
  debateId: string;
};

export default function Lobby() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [selectedDebateId, setSelectedDebateId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [myProposals, setMyProposals] = useState<Array<Proposal & { debate: Debate }>>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [counterProposalOpen, setCounterProposalOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    // Listen to waiting, ready, and active debates
    const q = query(
      collection(db, "debates"), 
      where("status", "in", ["waiting", "ready", "active"])
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Debate, "id">),
      }));
      setDebates(data);
    });

    return () => unsubscribe();
  }, []);

  // Fetch proposals the current user has sent
  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchMyProposals = async () => {
      try {
        // Get all waiting debates
        const waitingDebates = debates.filter(d => d.status === "waiting");
        const proposalsData: Array<Proposal & { debate: Debate }> = [];

        for (const debate of waitingDebates) {
          const proposalsRef = collection(db, "debates", debate.id, "proposals");
          const q = query(
            proposalsRef,
            where("proposerId", "==", auth.currentUser?.uid || "")
          );
          const proposalsSnap = await getDocs(q);
          
          proposalsSnap.docs.forEach((doc) => {
            const proposalData = doc.data() as Proposal;
            proposalsData.push({
              ...proposalData,
              id: doc.id,
              debateId: debate.id,
              debate: debate,
            });
          });
        }

        setMyProposals(proposalsData);
      } catch (error) {
        console.error("Error fetching proposals:", error);
      }
    };

    if (debates.length > 0) {
      fetchMyProposals();
    }
  }, [debates]);

  return (
      
    <div className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Active Lobby</h1>
        <Button
          variant="outline"
          onClick={() => navigate("/home")} // Change "/home" to your dashboard route
        >
          Back to Dashboard
        </Button>
      </div>
      
      {/* Active Debates Section */}
      {debates.filter(d => d.status === "active").length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Active Debates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {debates.filter(d => d.status === "active").map((debate) => (
              <Card key={debate.id} className="bg-gradient-hero border-border flex flex-col justify-between">
                <CardContent className="p-4 space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">{debate.format} Debate</h2>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    <span className="text-primary">{debate.hostUsername}</span> vs <span className="text-primary">{debate.opponentUsername}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Format: {debate.format} {debate.timeControl && `• Time: ${debate.timeControl}`}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/live-match/${debate.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => navigate(`/debate/${debate.id}`)}
                    >
                      {debate.hostId === auth.currentUser?.uid || debate.opponentId === auth.currentUser?.uid 
                        ? "Rejoin Debate" 
                        : "Join Debate"
                      }
                    </Button>
                  </div>
                </CardContent>
                <div className="px-4 py-2 bg-muted text-xs text-muted-foreground rounded-b-lg">
                  Debate in progress
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      

      {/* Ready to Join Section */}
      {debates.filter(d => d.status === "ready").length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Ready to Join</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {debates.filter(d => d.status === "ready").map((debate) => (
              <Card key={debate.id} className="bg-gradient-hero border-border flex flex-col justify-between">
                <CardContent className="p-4 space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">{debate.format} Debate</h2>
                    <Badge variant="default">Ready</Badge>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    <span className="text-primary">{debate.hostUsername}</span> vs <span className="text-primary">{debate.opponentUsername}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Format: {debate.format} {debate.timeControl && `• Time: ${debate.timeControl}`}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/live-match/${debate.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => navigate(`/debate/${debate.id}`)}
                    >
                      Join Debate
                    </Button>
                  </div>
                </CardContent>
                <div className="px-4 py-2 bg-muted text-xs text-muted-foreground rounded-b-lg">
                  Both players ready - click to join
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* My Proposals with Counter-Proposals Section */}
      {myProposals.filter(p => p.status === "countered" && p.counterProposal).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Counter-Proposals Awaiting Response
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProposals.filter(p => p.status === "countered" && p.counterProposal).map((proposal) => (
              <Card key={proposal.id} className="bg-gradient-hero border-2 border-primary border-dashed">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-foreground">{proposal.debate.format} Debate</h3>
                    <Badge variant="default">Response Needed</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Host: {proposal.debate.hostUsername}
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Host's Counter-Proposal</span>
                    </div>
                    <p className="text-sm">
                      {proposal.counterProposal?.date?.toDate 
                        ? proposal.counterProposal.date.toDate().toLocaleString()
                        : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {proposal.counterProposal?.timezone}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedProposal(proposal);
                      setCounterProposalOpen(true);
                    }}
                  >
                    Respond to Counter-Proposal
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Proposals Section - Only show for hosts */}
      {debates.filter(d => d.status === "waiting" && d.hostId === auth.currentUser?.uid).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Your Debates - Pending Proposals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {debates.filter(d => d.status === "waiting" && d.hostId === auth.currentUser?.uid).map((debate) => (
              <Card key={debate.id} className="bg-gradient-hero border-border flex flex-col justify-between">
                <CardContent className="p-4 space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">{debate.format} Debate</h2>
                    {debate.timeControl && <Badge variant="secondary">{debate.timeControl}</Badge>}
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    <span className="text-primary">Host: {debate.hostUsername}</span>
                  </div>
                  {debate.difficulty && (
                    <div className="text-sm text-muted-foreground">
                      Difficulty: <span className="capitalize">{debate.difficulty}</span>
                    </div>
                  )}
                  <Button
                    className="w-full mt-2"
                    onClick={() => navigate(`/debate-proposals/${debate.id}`)}
                  >
                    View Proposals
                  </Button>
                </CardContent>
                <div className="px-4 py-2 bg-muted text-xs text-muted-foreground rounded-b-lg">
                  Waiting for proposals
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Waiting Debates Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Available Debates to Join</h2>
        {debates.filter(d => d.status === "waiting" && d.hostId !== auth.currentUser?.uid).length === 0 ? (
          <p className="text-muted-foreground">No debates currently available to join. Start one from the PvP page!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {debates.filter(d => d.status === "waiting" && d.hostId !== auth.currentUser?.uid).map((debate) => (
              <Card key={debate.id} className="bg-gradient-hero border-border flex flex-col justify-between">
                <CardContent className="p-4 space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">{debate.format} Debate</h2>
                    {debate.timeControl && <Badge variant="secondary">{debate.timeControl}</Badge>}
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    <span className="text-primary">{debate.hostUsername}</span>
                  </div>
                  {debate.difficulty && (
                    <div className="text-sm text-muted-foreground">
                      Difficulty: <span className="capitalize">{debate.difficulty}</span>
                    </div>
                  )}
                  <Button
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedDebateId(debate.id);
                      setIsModalOpen(true);
                    }}
                  >
                    Propose Time
                  </Button>
                </CardContent>
                {/* Gray footer with host avatar + name */}
                <div className="px-4 py-2 bg-muted text-xs text-muted-foreground rounded-b-lg">
                  Host: <span className="text-foreground font-medium">{debate.hostName || "Unknown"}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <JoinMatchModal
        debateId={selectedDebateId ?? ""}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      {selectedProposal && (
        <CounterProposalResponse
          proposal={selectedProposal}
          debateId={selectedProposal.debateId}
          open={counterProposalOpen}
          onClose={() => {
            setCounterProposalOpen(false);
            setSelectedProposal(null);
          }}
        />
      )}
    </div>
  );
}
