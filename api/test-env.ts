import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Don't expose sensitive values in production, but this helps debug
  const envCheck = {
    hasFirefliesApiKey: !!process.env.FIREFLIES_API_KEY,
    hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET',
    privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) || 'NOT SET',
  };

  return res.status(200).json(envCheck);
}

