import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const q = query(
        collection(db, "notifications"),
        where("hostId", "==", auth.currentUser?.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Match Proposals</h1>
      {notifications.map((n) => (
        <div key={n.id} className="border-b py-2 flex justify-between">
          <span>{n.message}</span>
          {!n.read && (
            <button className="text-blue-500" onClick={() => markAsRead(n.id)}>
              Mark as Read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
