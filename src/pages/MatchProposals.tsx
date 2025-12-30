import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, addDoc, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, User, MessageSquare, RefreshCw, ArrowLeft, Mail, Phone, MessageCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Proposal = {
  id: string;
  timezone: string;
  date: any;
  contactMethod: string;
  contactInfo: string;
  notes: string;
  status: "pending" | "accepted" | "rejected" | "countered";
  createdAt: any;
  proposerId: string;
  proposerName: string;
  proposerUsername: string;
  counterProposal?: {
    timezone: string;
    date: any;
    notes?: string;
    proposedBy: "host" | "proposer";
    proposedAt: any;
  };
  proposalHistory?: Array<{
    timezone: string;
    date: any;
    notes?: string;
    proposedBy: "host" | "proposer";
    proposedAt: any;
  }>;
};

type Debate = {
  id: string;
  format: "LD" | "PF";
  timeControl?: string;
  difficulty?: string;
  hostId: string;
  hostName?: string;
  hostUsername?: string;
  createdAt: any;
  status: string;
};

export default function MatchProposals() {
  const { debateId } = useParams<{ debateId: string }>();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [debate, setDebate] = useState<Debate | null>(null);
  const [loading, setLoading] = useState(true);
  const [counterProposalOpen, setCounterProposalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [counterTimezone, setCounterTimezone] = useState("");
  const [counterDate, setCounterDate] = useState<Date | undefined>();
  const [counterTime, setCounterTime] = useState("");
  const [counterNotes, setCounterNotes] = useState("");

  useEffect(() => {
    if (!debateId) return;

    // Get debate details
    const debateUnsubscribe = onSnapshot(doc(db, "debates", debateId), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Debate;
        setDebate({ id: doc.id, ...data });
        
        // Check if current user is the host
        if (data.hostId !== auth.currentUser?.uid) {
          toast.error("You can only view proposals for your own debates");
          navigate("/lobby");
          return;
        }
      }
      setLoading(false);
    });

    // Get proposals for this debate
    const proposalsUnsubscribe = onSnapshot(
      collection(doc(db, "debates", debateId), "proposals"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Proposal, "id">),
        }));
        setProposals(data);
      }
    );

    return () => {
      debateUnsubscribe();
      proposalsUnsubscribe();
    };
  }, [debateId, navigate]);

  const handleAcceptProposal = async (proposal: Proposal) => {
    if (!debateId || !debate) return;

    try {
      // If accepting a counter-proposal, use the counter-proposal's time
      const finalProposal = proposal.counterProposal ? {
        ...proposal,
        timezone: proposal.counterProposal.timezone,
        date: proposal.counterProposal.date,
        notes: proposal.counterProposal.notes || proposal.notes,
      } : proposal;

      // Update the proposal status
      await updateDoc(doc(db, "debates", debateId, "proposals", proposal.id), {
        status: "accepted"
      });

      // Update the debate to include the opponent
      await updateDoc(doc(db, "debates", debateId), {
        opponentId: proposal.proposerId,
        opponentName: proposal.proposerName,
        opponentUsername: proposal.proposerUsername,
        status: "ready",
        acceptedProposalId: proposal.id,
        acceptedAt: serverTimestamp(),
        scheduledTime: finalProposal.date,
        scheduledTimezone: finalProposal.timezone,
      });

      // Reject all other proposals
      const otherProposals = proposals.filter(p => p.id !== proposal.id);
      for (const otherProposal of otherProposals) {
        await updateDoc(doc(db, "debates", debateId, "proposals", otherProposal.id), {
          status: "rejected"
        });
      }

      toast.success("Proposal accepted! The debate is now ready. Both players can join from the lobby.");
      navigate("/lobby");
    } catch (error) {
      console.error("Error accepting proposal:", error);
      toast.error("Failed to accept proposal");
    }
  };

  const handleRejectProposal = async (proposal: Proposal) => {
    if (!debateId) return;

    try {
      await updateDoc(doc(db, "debates", debateId, "proposals", proposal.id), {
        status: "rejected"
      });

      toast.success("Proposal rejected");
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      toast.error("Failed to reject proposal");
    }
  };

  const handleCounterProposal = async () => {
    if (!debateId || !selectedProposal || !counterTimezone || !counterDate || !counterTime) {
      toast.error("Please fill out all required fields.");
      return;
    }

    try {
      const [hours, minutes] = counterTime.split(":").map(Number);
      const finalDate = new Date(counterDate);
      finalDate.setHours(hours, minutes, 0, 0);

      const proposalRef = doc(db, "debates", debateId, "proposals", selectedProposal.id);
      const proposalSnap = await getDoc(proposalRef);
      const currentData = proposalSnap.data() as Proposal;
      
      const history = currentData.proposalHistory || [];
      if (currentData.date) {
        history.push({
          timezone: currentData.timezone,
          date: currentData.date,
          notes: currentData.notes,
          proposedBy: "proposer" as const,
          proposedAt: currentData.createdAt || serverTimestamp(),
        });
      }

      await updateDoc(proposalRef, {
        status: "countered",
        counterProposal: {
          timezone: counterTimezone,
          date: Timestamp.fromDate(finalDate),
          notes: counterNotes,
          proposedBy: "host" as const,
          proposedAt: serverTimestamp(),
        },
        proposalHistory: history,
      });

      // Send notification to proposer
      await addDoc(collection(db, "notifications"), {
        debateId,
        hostId: selectedProposal.proposerId,
        senderId: auth.currentUser?.uid || null,
        senderName: auth.currentUser?.displayName || "Host",
        message: "Host has counter-proposed a time for your debate",
        read: false,
        createdAt: serverTimestamp(),
        type: "counter_proposal",
        proposalId: selectedProposal.id,
      });

      toast.success("Counter-proposal sent! The proposer will be notified.");
      setCounterProposalOpen(false);
      setSelectedProposal(null);
      setCounterTimezone("");
      setCounterDate(undefined);
      setCounterTime("");
      setCounterNotes("");
    } catch (error) {
      console.error("Error sending counter-proposal:", error);
      toast.error("Failed to send counter-proposal");
    }
  };

  const openCounterProposalDialog = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setCounterTimezone(proposal.timezone);
    if (proposal.date) {
      const date = proposal.date.toDate ? proposal.date.toDate() : new Date(proposal.date);
      setCounterDate(date);
      setCounterTime(date.toTimeString().slice(0, 5));
    }
    setCounterNotes(proposal.notes || "");
    setCounterProposalOpen(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case "email": return Mail;
      case "discord": return MessageCircle;
      case "phone": return Phone;
      default: return MessageCircle;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Debate not found</h1>
          <Button onClick={() => navigate("/lobby")} className="mt-4">
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/lobby")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Debate Proposals</h1>
              <p className="text-muted-foreground mt-1">
                {debate.format} Debate
                {debate.timeControl && ` • ${debate.timeControl}`}
                {debate.difficulty && ` • ${debate.difficulty}`}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            {proposals.length} {proposals.length === 1 ? 'Proposal' : 'Proposals'}
          </Badge>
        </div>

        {/* Proposals Section */}
        {proposals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No proposals yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Players can propose times to join your debate. Proposals will appear here when received.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Group proposals by status for better organization */}
            {proposals
              .sort((a, b) => {
                // Sort: pending first, then countered, then accepted, then rejected
                const order = { pending: 0, countered: 1, accepted: 2, rejected: 3 };
                return (order[a.status] || 99) - (order[b.status] || 99);
              })
              .map((proposal) => {
              const ContactIcon = getContactMethodIcon(proposal.contactMethod);
              return (
                <Card key={proposal.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Status Bar */}
                    <div className={`h-1 ${
                      proposal.status === "accepted" ? "bg-green-500" :
                      proposal.status === "rejected" ? "bg-red-500" :
                      proposal.status === "countered" ? "bg-yellow-500" :
                      "bg-primary"
                    }`} />
                    
                    <div className="p-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">
                                {proposal.proposerName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                @{proposal.proposerUsername}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            proposal.status === "accepted" ? "default" :
                            proposal.status === "rejected" ? "destructive" :
                            proposal.status === "countered" ? "secondary" :
                            "secondary"
                          }
                          className="capitalize"
                        >
                          {proposal.status === "countered" ? "Countered" : proposal.status}
                        </Badge>
                      </div>

                      {/* Proposal Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Proposed Date</p>
                            <p className="text-sm font-medium">{formatDate(proposal.date)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Timezone</p>
                            <p className="text-sm font-medium">{proposal.timezone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:col-span-2">
                          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                            <ContactIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Contact</p>
                            <p className="text-sm font-medium">{proposal.contactInfo}</p>
                          </div>
                        </div>
                      </div>

                      {proposal.notes && (
                        <div className="p-3 bg-muted/50 rounded-lg border">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm text-foreground">{proposal.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {proposal.status === "pending" && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                          <Button 
                            onClick={() => handleAcceptProposal(proposal)}
                            className="flex-1"
                            size="sm"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button 
                            variant="secondary" 
                            onClick={() => openCounterProposalDialog(proposal)}
                            className="flex-1"
                            size="sm"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Counter-Propose
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleRejectProposal(proposal)}
                            className="flex-1"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {proposal.status === "countered" && proposal.counterProposal && (
                        <div className="space-y-3 pt-2 border-t">
                          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <RefreshCw className="h-4 w-4 text-primary" />
                              <p className="text-sm font-semibold text-primary">Your Counter-Proposal</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Date</p>
                                <p className="font-medium">{formatDate(proposal.counterProposal.date)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Timezone</p>
                                <p className="font-medium">{proposal.counterProposal.timezone}</p>
                              </div>
                              {proposal.counterProposal.notes && (
                                <div className="md:col-span-2">
                                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                  <p className="font-medium">{proposal.counterProposal.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleAcceptProposal(proposal)}
                              className="flex-1"
                              size="sm"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Accept Counter-Proposal
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => handleRejectProposal(proposal)}
                              className="flex-1"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {proposal.status === "accepted" && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">Proposal Accepted</p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              This player will join your debate
                            </p>
                          </div>
                        </div>
                      )}

                      {proposal.status === "rejected" && (
                        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">Proposal Rejected</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Counter-Proposal Dialog */}
      <Dialog open={counterProposalOpen} onOpenChange={setCounterProposalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Counter-Propose Time
            </DialogTitle>
            <DialogDescription>
              Suggest a different time that works better for you. The proposer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Timezone</Label>
              <Select value={counterTimezone} onValueChange={setCounterTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PST">Pacific (PST)</SelectItem>
                  <SelectItem value="MST">Mountain (MST)</SelectItem>
                  <SelectItem value="CST">Central (CST)</SelectItem>
                  <SelectItem value="EST">Eastern (EST)</SelectItem>
                  <SelectItem value="AKST">Alaska (AKST)</SelectItem>
                  <SelectItem value="HST">Hawaii (HST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date</Label>
              <CalendarComponent
                mode="single"
                selected={counterDate}
                onSelect={setCounterDate}
                className="rounded-md border"
              />
            </div>

            <div>
              <Label>Preferred Time</Label>
              <Input 
                type="time" 
                value={counterTime} 
                onChange={(e) => setCounterTime(e.target.value)} 
              />
            </div>

            <div>
              <Label>Additional Notes (Optional)</Label>
              <Textarea 
                placeholder="Add any comments or requests..." 
                value={counterNotes}
                onChange={(e) => setCounterNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCounterProposalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCounterProposal}>
              Send Counter-Proposal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
