// src/pages/SignUp.tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
 
import { useState } from "react";

const schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  grade: z.string(),
  school: z.string(),
  dob: z.string(),
  phone: z.string().min(10),
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

const SignUp = () => {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const navigate = useNavigate();
  const onSubmit = async (data: FormData) => {
  const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const uid = userCred.user.uid;

  await setDoc(doc(db, "users", uid), {
    ...data,
    dob: Timestamp.fromDate(new Date(data.dob)),
    createdAt: Timestamp.now(),
  });
  console.log("Redirecting to /login...");
  setSubmitted(true);
  navigate("/login");
};
    

  return (
    <Card className="max-w-xl mx-auto mt-10 border-border bg-card">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Sign Up</h2>

        {submitted ? (
          <p className="text-green-500">Account created successfully!</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { label: "First Name", name: "firstName" },
              { label: "Last Name", name: "lastName" },
              { label: "Grade", name: "grade" },
              { label: "School", name: "school" },
              { label: "Date of Birth", name: "dob", type: "date" },
              { label: "Phone", name: "phone" },
              { label: "Email", name: "email", type: "email" },
              { label: "Password", name: "password", type: "password" },
            ].map(({ label, name, type = "text" }) => (
              <div key={name}>
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} type={type} {...register(name as keyof FormData)} />
                {errors[name as keyof FormData] && (
                  <p className="text-red-500 text-sm">
                    {errors[name as keyof FormData]?.message?.toString()}
                  </p>
                )}
              </div>
            ))}

            <Button type="submit">
              {isSubmitting ? "Submitting..." : "Sign Up"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default SignUp;
