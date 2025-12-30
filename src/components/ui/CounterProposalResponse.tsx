import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc, updateDoc, getDoc, serverTimestamp, Timestamp, addDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import { Clock } from "lucide-react";

type Proposal = {
  id: string;
  timezone: string;
  date: any;
  contactMethod: string;
  contactInfo: string;
  notes: string;
  status: "pending" | "accepted" | "rejected" | "countered";
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
  matchId: string;
};

type CounterProposalResponseProps = {
  proposal: Proposal;
  matchId: string;
  open: boolean;
  onClose: () => void;
};

export function CounterProposalResponse({ proposal, matchId, open, onClose }: CounterProposalResponseProps) {
  const [counterTimezone, setCounterTimezone] = useState("");
  const [counterDate, setCounterDate] = useState<Date | undefined>();
  const [counterTime, setCounterTime] = useState("");
  const [counterNotes, setCounterNotes] = useState("");
  const [showCounterForm, setShowCounterForm] = useState(false);

  useEffect(() => {
    if (proposal.counterProposal && open) {
      const counter = proposal.counterProposal;
      setCounterTimezone(counter.timezone);
      if (counter.date) {
        const date = counter.date.toDate ? counter.date.toDate() : new Date(counter.date);
        setCounterDate(date);
        setCounterTime(date.toTimeString().slice(0, 5));
      }
      setCounterNotes(counter.notes || "");
    }
  }, [proposal, open]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const handleAcceptCounterProposal = async () => {
    if (!debateId || !proposal.counterProposal) return;

    try {
      const proposalRef = doc(db, "debates", debateId, "proposals", proposal.id);
      const debateRef = doc(db, "debates", debateId);
      
      // Get debate data
      const debateSnap = await getDoc(debateRef);
      const debateData = debateSnap.data();
      
      if (!debateData) {
        toast.error("Debate not found");
        return;
      }

      // Update proposal status
      await updateDoc(proposalRef, {
        status: "accepted"
      });

      // Update debate to include opponent
      await updateDoc(debateRef, {
        opponentId: auth.currentUser?.uid || proposal.proposerId,
        opponentName: proposal.proposerName || "Unknown",
        opponentUsername: proposal.proposerUsername || "Unknown",
        status: "ready",
        acceptedProposalId: proposal.id,
        acceptedAt: serverTimestamp(),
        scheduledTime: proposal.counterProposal.date,
        scheduledTimezone: proposal.counterProposal.timezone,
      });

      // Send notification to host
      await addDoc(collection(db, "notifications"), {
        debateId,
        hostId: debateData.hostId,
        senderId: auth.currentUser?.uid || null,
        senderName: auth.currentUser?.displayName || "Proposer",
        message: "Your counter-proposal has been accepted!",
        read: false,
        createdAt: serverTimestamp(),
        type: "counter_proposal_accepted",
      });

      toast.success("Counter-proposal accepted! The debate is now ready.");
      onClose();
    } catch (error) {
      console.error("Error accepting counter-proposal:", error);
      toast.error("Failed to accept counter-proposal");
    }
  };

  const handleRejectCounterProposal = async () => {
    if (!debateId) return;

    try {
      await updateDoc(doc(db, "debates", debateId, "proposals", proposal.id), {
        status: "rejected"
      });

      toast.success("Counter-proposal rejected");
      onClose();
    } catch (error) {
      console.error("Error rejecting counter-proposal:", error);
      toast.error("Failed to reject counter-proposal");
    }
  };

  const handleCounterPropose = async () => {
    if (!debateId || !counterTimezone || !counterDate || !counterTime) {
      toast.error("Please fill out all required fields.");
      return;
    }

    try {
      const [hours, minutes] = counterTime.split(":").map(Number);
      const finalDate = new Date(counterDate);
      finalDate.setHours(hours, minutes, 0, 0);

      const proposalRef = doc(db, "debates", debateId, "proposals", proposal.id);
      const proposalSnap = await getDoc(proposalRef);
      const currentData = proposalSnap.data() as Proposal;
      
      const history = currentData.proposalHistory || [];
      
      // Add current counter-proposal to history
      if (currentData.counterProposal) {
        history.push({
          timezone: currentData.counterProposal.timezone,
          date: currentData.counterProposal.date,
          notes: currentData.counterProposal.notes,
          proposedBy: "host" as const,
          proposedAt: currentData.counterProposal.proposedAt || serverTimestamp(),
        });
      }

      // Update with new counter-proposal from proposer
      await updateDoc(proposalRef, {
        status: "countered",
        counterProposal: {
          timezone: counterTimezone,
          date: Timestamp.fromDate(finalDate),
          notes: counterNotes,
          proposedBy: "proposer" as const,
          proposedAt: serverTimestamp(),
        },
        proposalHistory: history,
      });

      // Send notification to host
      const debateSnap = await getDoc(doc(db, "debates", debateId));
      const debateData = debateSnap.data();
      
      await addDoc(collection(db, "notifications"), {
        debateId,
        hostId: debateData?.hostId,
        senderId: auth.currentUser?.uid || null,
        senderName: auth.currentUser?.displayName || "Proposer",
        message: "Proposer has counter-proposed a new time",
        read: false,
        createdAt: serverTimestamp(),
        type: "counter_proposal",
        proposalId: proposal.id,
      });

      toast.success("Counter-proposal sent! The host will be notified.");
      setShowCounterForm(false);
      onClose();
    } catch (error) {
      console.error("Error sending counter-proposal:", error);
      toast.error("Failed to send counter-proposal");
    }
  };

  if (!proposal.counterProposal) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Counter-Proposal Response</DialogTitle>
          <DialogDescription>
            The host has counter-proposed a different time. Choose how to respond.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Original Proposal */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Your Original Proposal</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Date:</strong> {formatDate(proposal.date)}</p>
                <p><strong>Timezone:</strong> {proposal.timezone}</p>
                {proposal.notes && <p><strong>Notes:</strong> {proposal.notes}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Counter-Proposal */}
          <Card className="border-2 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Host's Counter-Proposal</h3>
                <Badge variant="default">New</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <p><strong>Date:</strong> {formatDate(proposal.counterProposal.date)}</p>
                <p><strong>Timezone:</strong> {proposal.counterProposal.timezone}</p>
                {proposal.counterProposal.notes && (
                  <p><strong>Notes:</strong> {proposal.counterProposal.notes}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {!showCounterForm ? (
            <div className="flex flex-col gap-2">
              <Button onClick={handleAcceptCounterProposal} className="w-full">
                Accept Counter-Proposal
              </Button>
              <Button variant="outline" onClick={handleRejectCounterProposal} className="w-full">
                Reject Counter-Proposal
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowCounterForm(true)} 
                className="w-full"
              >
                Counter-Propose Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Your New Counter-Proposal</h3>
              
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
                <Calendar
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

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCounterForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCounterPropose} className="flex-1">
                  Send Counter-Proposal
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

