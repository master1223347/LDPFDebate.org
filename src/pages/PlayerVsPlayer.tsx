import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { 
  Users, 
  Target, 
  Trophy, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Eye,
  Sparkles,
  Loader2
} from "lucide-react";
import { fetchNSDATopics, type NSDATopic } from "@/lib/nsdaTopics";

export default function PvP() {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"LD" | "PF" | "">("");
  const [preferredSide, setPreferredSide] = useState<"AFF" | "NEG" | "none">("none");
  const [topic, setTopic] = useState<"current" | "custom">("current");
  const [customTopic, setCustomTopic] = useState("");
  const [description, setDescription] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [topics, setTopics] = useState<Record<string, NSDATopic>>({});
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const navigate = useNavigate();

  // Load topics when format changes
  useEffect(() => {
    if (format && open) {
      setLoadingTopics(true);
      fetchNSDATopics()
        .then((fetchedTopics) => {
          setTopics(fetchedTopics);
          setLoadingTopics(false);
        })
        .catch(() => {
          setLoadingTopics(false);
        });
    }
  }, [format, open]);

  // Validation
  const getValidationErrors = () => {
    const errors: string[] = [];
    if (!format) errors.push("Debate format is required");
    if (topic === "custom" && !customTopic.trim()) {
      errors.push("Custom topic is required");
    }
    if (customTopic.trim().length > 0 && customTopic.trim().length < 10) {
      errors.push("Custom topic must be at least 10 characters");
    }
    if (description.length > 500) {
      errors.push("Description must be 500 characters or less");
    }
    return errors;
  };

  const validationErrors = getValidationErrors();
  const isValid = validationErrors.length === 0;

  const getSelectedTopic = () => {
    if (topic === "current" && format) {
      return topics[format]?.topic || "Current NSDA topic";
    }
    return customTopic;
  };

  const handleCreateMatch = async () => {
    setHasAttemptedSubmit(true);
    
    if (!isValid) {
      toast.error("Please fix the errors before creating the debate.");
      return;
    }

    if (!format) {
      toast.error("Please select a debate format.");
      return;
    }

    try {
      setCreating(true);
      
      const user = auth.currentUser;
      
      if (!user) {
        toast.error("You must be logged in to create a debate.");
        return;
      }
      
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      
      const debateData: any = {
        format,
        status: "waiting",
        hostId: auth.currentUser?.uid || null,
        hostName: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim(),
        hostUsername: userData?.username || "Unknown",
        createdAt: serverTimestamp(),
        topic: getSelectedTopic(),
        topicSource: topic === "current" ? "NSDA" : "custom",
      };

      if (preferredSide !== "none") {
        debateData.preferredSide = preferredSide;
      }

      if (description.trim()) {
        debateData.description = description.trim();
      }

      const debateRef = await addDoc(collection(db, "debates"), debateData);

      toast.success("Debate created successfully!");
      setOpen(false);
      // Reset form
      setFormat("");
      setPreferredSide("none");
      setTopic("current");
      setCustomTopic("");
      setDescription("");
      setShowPreview(false);
      setHasAttemptedSubmit(false);
      navigate("/lobby?debateId=" + debateRef.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create debate.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
          <Users className="h-10 w-10 text-primary" />
          Player vs Player
        </h1>
        <p className="text-muted-foreground text-lg">
          Create a match and challenge other debaters
        </p>
      </div>

      <Card className="bg-gradient-hero border-border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Create New Match
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-muted-foreground mb-4">
                Set up your debate preferences. Players will propose times to join your debate.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Choose Format
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Select Topic
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  Optional Preferences
                </Badge>
              </div>
            </div>

              <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="text-lg px-8">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Debate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
                  <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    Create a New Debate
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Configure your debate settings. All fields marked with * are required.
                  </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 mt-4">
                  {/* Validation Errors */}
                  {hasAttemptedSubmit && validationErrors.length > 0 && (
                    <Card className="border-destructive bg-destructive/10">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                          <div>
                            <p className="font-semibold text-destructive mb-1">Please fix the following errors:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                              {validationErrors.map((error, idx) => (
                                <li key={idx}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                    {/* Debate Format */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Debate Format <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={format} 
                      onValueChange={(val) => {
                        setFormat(val as "LD" | "PF");
                        setTopic("current"); // Reset topic when format changes
                      }}
                    >
                      <SelectTrigger className={hasAttemptedSubmit && !format ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a debate format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LD">
                          <div className="flex flex-col">
                            <span className="font-semibold">Lincoln-Douglas (LD)</span>
                            <span className="text-xs text-muted-foreground">One-on-one value debate</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="PF">
                          <div className="flex flex-col">
                            <span className="font-semibold">Public Forum (PF)</span>
                            <span className="text-xs text-muted-foreground">Team-based policy debate</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {format && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Format selected</span>
                      </div>
                    )}
                  </div>

                  {/* Topic Selection */}
                  {format && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Debate Topic <span className="text-destructive">*</span>
                      </Label>
                      <Select value={topic} onValueChange={(val) => setTopic(val as "current" | "custom")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current">
                            <div className="flex flex-col">
                              <span className="font-semibold">Current NSDA Topic</span>
                              <span className="text-xs text-muted-foreground">
                                {loadingTopics ? "Loading..." : format && topics[format] ? topics[format].topic.substring(0, 50) + "..." : "Use official NSDA topic"}
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="custom">Custom Topic</SelectItem>
                        </SelectContent>
                      </Select>

                      {topic === "current" && format && (
                        <Card className="bg-muted/50 border-border">
                          <CardContent className="p-4">
                            {loadingTopics ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Loading current topic...</span>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm font-medium mb-1">Current {format} Topic:</p>
                                <p className="text-sm text-muted-foreground">
                                  {topics[format]?.topic || "Unable to load topic. Please use custom topic."}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {topic === "custom" && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Enter your custom debate topic (e.g., 'Resolved: The United States should adopt a universal basic income.')"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            className={`min-h-[100px] ${hasAttemptedSubmit && customTopic.trim().length > 0 && customTopic.trim().length < 10 ? "border-destructive" : ""}`}
                          />
                          <div className="flex items-center justify-between text-xs">
                            <span className={hasAttemptedSubmit && customTopic.trim().length < 10 && customTopic.trim().length > 0 ? "text-destructive" : "text-muted-foreground"}>
                              {hasAttemptedSubmit && customTopic.trim().length < 10 && customTopic.trim().length > 0
                                ? "Topic must be at least 10 characters"
                                : `${customTopic.length} characters`}
                            </span>
                            {customTopic.trim().length >= 10 && (
                              <div className="flex items-center gap-1 text-green-500">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Valid topic</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preferred Side */}
                  {format && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        Preferred Side (Optional)
                      </Label>
                      <Select value={preferredSide} onValueChange={(val) => setPreferredSide(val as "AFF" | "NEG" | "none")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Preference</SelectItem>
                          <SelectItem value="AFF">Affirmative</SelectItem>
                          <SelectItem value="NEG">Negative</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Indicate if you have a side preference. This is optional and can be negotiated.
                      </p>
                    </div>
                  )}

                    {/* Match Description */}
                  {format && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Match Description (Optional)
                      </Label>
                      <Textarea
                        placeholder="Add any additional details, preferences, or requirements for this match..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className={hasAttemptedSubmit && description.length > 500 ? "text-destructive" : "text-muted-foreground"}>
                          {description.length}/500 characters
                        </span>
                        {hasAttemptedSubmit && description.length > 500 && (
                          <span className="text-destructive">Description too long</span>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Preview Section */}
                  {format && isValid && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Eye className="h-4 w-4 text-primary" />
                          Debate Preview
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          {showPreview ? "Hide" : "Show"} Preview
                        </Button>
                      </div>
                      {showPreview && (
                        <Card className="bg-muted/30 border-primary/20">
                          <CardContent className="p-4 space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Format</p>
                              <Badge variant="default">{format}</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Topic</p>
                              <p className="text-sm font-medium">{getSelectedTopic()}</p>
                            </div>
                            {preferredSide !== "none" && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Preferred Side</p>
                                <Badge variant="outline">{preferredSide}</Badge>
                              </div>
                            )}
                            {description.trim() && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Description</p>
                                <p className="text-sm">{description}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        setFormat("");
                        setPreferredSide("none");
                        setTopic("current");
                        setCustomTopic("");
                        setDescription("");
                        setShowPreview(false);
                        setHasAttemptedSubmit(false);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateMatch}
                      disabled={creating || !isValid}
                      className="flex-1"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Create Debate
                        </>
                      )}
                    </Button>
                  </div>
                  </div>
                </DialogContent>
              </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-hero border-border mt-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Browse Active Debates</h2>
              <p className="text-sm text-muted-foreground">View and join other players' debates.</p>
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
