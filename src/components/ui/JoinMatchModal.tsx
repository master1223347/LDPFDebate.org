// components/JoinMatchModal.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

export function JoinMatchModal({ matchId, open, onClose }: { matchId: string; open: boolean; onClose: () => void }) {
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [contactMethod, setContactMethod] = useState("email");
  const [contactInfo, setContactInfo] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");

  const usTimezones = [
  { value: "PST", label: "Pacific (PST)" },
  { value: "MST", label: "Mountain (MST)" },
  { value: "CST", label: "Central (CST)" },
  { value: "EST", label: "Eastern (EST)" },
  { value: "AKST", label: "Alaska (AKST)" },
  { value: "HST", label: "Hawaii (HST)" },
  ];
  const handleSendProposal = () => {
  if (!timezone || !selectedDate || !time || !contactMethod || !contactInfo) {
    alert("Please fill out all required fields.");
    return;
  }};


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] my-6 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent rounded-lg backdrop-blur-md bg-background/80 border border-white/10">
        <DialogHeader>
          <DialogTitle>Propose Match Time</DialogTitle>
          <DialogDescription>
            Send your availability and details to the host. They can approve or suggest changes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                {usTimezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>


          <div>
            <Label>Date</Label>
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
            />
            </div>

          <div>
            <Label>Preferred Time</Label>
            <Input type="time" 
            value={time} 
            onChange={(e) => setTime(e.target.value)} 
            />
          </div>
          <div>
            <Label>Preferred Contact Method</Label>
            <Select value={contactMethod} onValueChange={setContactMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {contactMethod && (
            <div>
                <Label>
                {contactMethod === "email"
                    ? "Email Address"
                    : contactMethod === "discord"
                    ? "Discord Tag"
                    : contactMethod === "phone"
                    ? "Phone Number"
                    : "Contact Info"}
                </Label>
                <Input
                placeholder={
                    contactMethod === "email"
                    ? "Enter your email"
                    : contactMethod === "discord"
                    ? "e.g., Username#1234"
                    : contactMethod === "phone"
                    ? "e.g., +1 555 555 5555"
                    : "Enter details"
                }
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                />
            </div>
            )}
          <div>
            <Label>Additional Notes</Label>
            <Textarea placeholder="Add any comments or requests..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSendProposal}>Send Proposal</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
