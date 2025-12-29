// src/pages/SignUp.tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, Timestamp, collection, getDocs, query, orderBy } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Check, ChevronsUpDown, School, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  grade: z.string().min(1, "Grade is required"),
  school: z.string().min(1, "School is required"),
  dob: z.string().min(1, "Date of birth is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

const SignUp = () => {
  const [errorMsg, setErrorMsg] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });
  const [schools, setSchools] = useState<string[]>([]);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const navigate = useNavigate();
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const selectedSchool = watch("school");

  // Fetch schools from Firestore
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("school"));
        const querySnapshot = await getDocs(q);
        
        const schoolSet = new Set<string>();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.school && typeof data.school === "string") {
            schoolSet.add(data.school.trim());
          }
        });
        
        const sortedSchools = Array.from(schoolSet).sort();
        setSchools(sortedSchools);
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    };

    fetchSchools();
  }, []);

  // Check password strength in real-time
  useEffect(() => {
    if (password) {
      setPasswordStrength({
        length: password.length >= 6,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
      });
    }
  }, [password]);

  const onSubmit = async (data: FormData) => {
    try {
      setErrorMsg("");
  const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const uid = userCred.user.uid;

      // Remove confirmPassword before saving
      const { confirmPassword, ...userData } = data;

  await setDoc(doc(db, "users", uid), {
        ...userData,
    dob: Timestamp.fromDate(new Date(data.dob)),
    createdAt: Timestamp.now(),
  });

      toast.success("Account created successfully!");
  navigate("/login");
    } catch (err: any) {
      console.error("Sign up error:", err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already registered. Please log in instead.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("Password is too weak. Please choose a stronger password.");
      } else {
        setErrorMsg("An error occurred. Please try again.");
      }
    }
  };

  // Filter schools based on search
  const filteredSchools = schools.filter((school) =>
    school.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.05),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Back to home link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card className="border-2 border-border bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center pb-6">
            {/* Logo placeholder - replace with actual logo */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">D</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Create Your Account
            </h1>
            <p className="text-muted-foreground">
              Join DebateTogether and start your debate journey
            </p>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  Personal Information
                </h3>
                
                {/* Name fields - two columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      {...register("firstName")}
                      className={errors.firstName ? "border-destructive" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      {...register("lastName")}
                      className={errors.lastName ? "border-destructive" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    {...register("username")}
                    className={errors.username ? "border-destructive" : ""}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade (Only Number) *</Label>
                    <Input
                      id="grade"
                      type="text"
                      placeholder="9th, 10th, 11th, 12th, etc."
                      {...register("grade")}
                      className={errors.grade ? "border-destructive" : ""}
                    />
                    {errors.grade && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.grade.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      {...register("dob")}
                      className={errors.dob ? "border-destructive" : ""}
                    />
                    {errors.dob && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.dob.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">School *</Label>
                  <Popover open={schoolOpen} onOpenChange={setSchoolOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={schoolOpen}
                        className={cn(
                          "w-full justify-between",
                          !selectedSchool && "text-muted-foreground",
                          errors.school && "border-destructive"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4" />
                          <span>
                            {selectedSchool || "Search or select a school..."}
                          </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search schools..."
                          value={schoolSearch}
                          onValueChange={setSchoolSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {schoolSearch ? (
                              <div className="py-3">
                                <p className="text-sm text-muted-foreground mb-2">
                                  No school found. You can add "{schoolSearch}" as a new school.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    setValue("school", schoolSearch);
                                    setSchoolOpen(false);
                                    setSchoolSearch("");
                                  }}
                                >
                                  Add "{schoolSearch}"
                                </Button>
                              </div>
                            ) : (
                              "No schools found."
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredSchools.map((school) => (
                              <CommandItem
                                key={school}
                                value={school}
                                onSelect={() => {
                                  setValue("school", school);
                                  setSchoolOpen(false);
                                  setSchoolSearch("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSchool === school ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {school}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <input
                    type="hidden"
                    {...register("school")}
                  />
                  {errors.school && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errors.school.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...register("phone")}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Information Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  Account Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      {...register("password")}
                      className={cn(
                        "pr-10",
                        errors.password ? "border-destructive" : ""
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Password requirements */}
                  {password && (
                    <div className="mt-2 p-3 rounded-lg bg-muted/50 space-y-1.5">
                      <p className="text-xs font-medium text-foreground mb-2">Password requirements:</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.length ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className={passwordStrength.length ? "text-green-500" : "text-muted-foreground"}>
                            At least 6 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.uppercase ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className={passwordStrength.uppercase ? "text-green-500" : "text-muted-foreground"}>
                            One uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.lowercase ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className={passwordStrength.lowercase ? "text-green-500" : "text-muted-foreground"}>
                            One lowercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.number ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className={passwordStrength.number ? "text-green-500" : "text-muted-foreground"}>
                            One number
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {errors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                      <XCircle className="w-3 h-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      {...register("confirmPassword")}
                      className={cn(
                        "pr-10",
                        errors.confirmPassword ? "border-destructive" : ""
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {confirmPassword && password && (
                    <div className="flex items-center gap-2 text-sm">
                      {confirmPassword === password ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-destructive" />
                          <span className="text-destructive">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {errorMsg}
                  </p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Login link */}
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Log in here
                  </Link>
                </p>
              </div>
          </form>
      </CardContent>
    </Card>
      </div>
    </div>
  );
};

export default SignUp;
