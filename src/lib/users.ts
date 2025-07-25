import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export type UserProfile = {
  firstName: string;
  lastName: string;
  username: string;
  grade: string;
  school: string;
  dob: Date;
  email: string;
  phone: string;
  password: string;
};

export async function createUserProfile(data: UserProfile) {
  const usersRef = collection(db, "users");

  const docRef = await addDoc(usersRef, {
    ...data,
    dob: Timestamp.fromDate(data.dob),
    createdAt: Timestamp.now()
  });

  return docRef.id;
}
