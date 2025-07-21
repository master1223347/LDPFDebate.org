import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function PvP() {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"LD" | "PF" | "">("");
  const [timeControl, setTimeControl] = useState("10min");
  const [difficulty, setDifficulty] = useState("medium");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreateMatch = async () => {
    if (!format || !timeControl || !difficulty) {
      toast.error("Please fill in all match settings.");
      return;
    }

    try {
      setCreating(true);

      const matchRef = await addDoc(collection(db, "matches"), {
        format,
        timeControl,
        difficulty,
        status: "waiting",
        createdAt: serverTimestamp()
      });

      toast.success("Match created!");
      setOpen(false);
      navigate("/lobby?matchId=" + matchRef.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create match.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Player vs Player</h1>

      <Card className="bg-gradient-hero border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Start a New Match</h2>
              <p className="text-sm text-muted-foreground">Choose your settings and begin.</p>
            </div>

            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">Start Match</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold text-foreground">Create a Match</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    {/* Debate Format */}
                    <div>
                      <label className="block mb-1 text-sm text-muted-foreground">Debate Format</label>
                      <Select onValueChange={(val) => setFormat(val as "LD" | "PF")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LD">Lincoln-Douglas (LD)</SelectItem>
                          <SelectItem value="PF">Public Forum (PF)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Time Control */}
                    <div>
                      <label className="block mb-1 text-sm text-muted-foreground">Time Control</label>
                      <Select onValueChange={(val) => setTimeControl(val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5min">5 Minutes</SelectItem>
                          <SelectItem value="10min">10 Minutes</SelectItem>
                          <SelectItem value="15min">15 Minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="block mb-1 text-sm text-muted-foreground">Difficulty</label>
                      <Select onValueChange={(val) => setDifficulty(val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full mt-2" onClick={handleCreateMatch} disabled={creating}>
                      {creating ? "Creating..." : "Create Match"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>


          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-hero border-border mt-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Browse Active Matches</h2>
              <p className="text-sm text-muted-foreground">View and join other players' matches.</p>
            </div>

            <Button variant="default" onClick={() => navigate("/lobby")} className="w-full sm:w-auto">
              View Lobby
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
