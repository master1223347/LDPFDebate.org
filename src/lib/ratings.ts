import {
  doc,
  runTransaction,
  getDoc,
  serverTimestamp,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
// ...existing code...
// Adjust this import to match your firebase.ts export (e.g. export const db = getFirestore(app))
import { db } from "./firebase";

/** Elo helpers */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function kFactor(rating: number, gamesPlayed = 0): number {
  // example policy: higher K for new players
  if (gamesPlayed < 30) return 40;
  if (rating < 2100) return 20;
  return 10;
}

export function computeNewRatings(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  kA = 20,
  kB = 20
) {
  const expA = expectedScore(ratingA, ratingB);
  const expB = expectedScore(ratingB, ratingA);
  const newA = Math.round(ratingA + kA * (scoreA - expA));
  const newB = Math.round(ratingB + kB * ((1 - scoreA) - expB));
  return { newA, newB, changeA: newA - ratingA, changeB: newB - ratingB };
}

/**
 * Update two players' ratings in a transaction.
 * - playerAId, playerBId: user doc ids
 * - scoreA: 1 | 0.5 | 0
 * - matchId: optional id to record in history
 */
export async function updateRatingsTransaction({
  playerAId,
  playerBId,
  scoreA,
  matchId,
}: {
  playerAId: string;
  playerBId: string;
  scoreA: number; // 1, 0.5, 0
  matchId?: string;
}) {
  const refA = doc(db, "users", playerAId);
  const refB = doc(db, "users", playerBId);

  return runTransaction(db, async (tx) => {
    const snapA = await tx.get(refA);
    const snapB = await tx.get(refB);

    if (!snapA.exists() || !snapB.exists()) {
      throw new Error("Player documents missing");
    }

    const dataA = snapA.data() as DocumentData;
    const dataB = snapB.data() as DocumentData;

    const ratingA: number = dataA.rating ?? 1200;
    const ratingB: number = dataB.rating ?? 1200;
    const gamesA: number = dataA.gamesPlayed ?? 0;
    const gamesB: number = dataB.gamesPlayed ?? 0;

    const kA = kFactor(ratingA, gamesA);
    const kB = kFactor(ratingB, gamesB);

    const { newA, newB, changeA, changeB } = computeNewRatings(
      ratingA,
      ratingB,
      scoreA,
      kA,
      kB
    );

    const now = serverTimestamp();

    tx.update(refA, {
      rating: newA,
      gamesPlayed: gamesA + 1,
      ratingHistory: [
        ...(dataA.ratingHistory ?? []),
        {
          matchId: matchId ?? null,
          old: ratingA,
          new: newA,
          delta: changeA,
          opponentId: playerBId,
          timestamp: now,
        },
      ],
    });

    tx.update(refB, {
      rating: newB,
      gamesPlayed: gamesB + 1,
      ratingHistory: [
        ...(dataB.ratingHistory ?? []),
        {
          matchId: matchId ?? null,
          old: ratingB,
          new: newB,
          delta: changeB,
          opponentId: playerAId,
          timestamp: now,
        },
      ],
    });

    return { playerA: { old: ratingA, new: newA, delta: changeA }, playerB: { old: ratingB, new: newB, delta: changeB } };
  });
}