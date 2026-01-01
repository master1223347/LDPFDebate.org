import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook secret if configured
  const webhookSecret = process.env.FIREFLIES_WEBHOOK_SECRET;
  if (webhookSecret && req.headers['x-fireflies-secret'] !== webhookSecret) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const { meetingId, transcript, segments, status } = req.body as {
      meetingId?: string;
      transcript?: string;
      segments?: unknown[];
      status?: string;
    };

    if (!meetingId) {
      return res.status(400).send('meetingId is required');
    }

    // Find debate by firefliesMeetingId
    const debatesSnapshot = await db
      .collection('debates')
      .where('firefliesMeetingId', '==', meetingId)
      .limit(1)
      .get();

    if (debatesSnapshot.empty) {
      console.warn(`No debate found for Fireflies meeting ${meetingId}`);
      return res.status(200).send('No matching debate found');
    }

    const debateDoc = debatesSnapshot.docs[0];
    const debateId = debateDoc.id;

    const updateData: Record<string, unknown> = {
      transcriptLastUpdated: FieldValue.serverTimestamp(),
    };

    if (transcript) updateData.transcript = transcript;
    if (segments) updateData.transcriptSegments = segments;
    if (status) updateData.transcriptionStatus = status;

    await db.collection('debates').doc(debateId).update(updateData);

    return res.status(200).send('Transcript updated successfully');
  } catch (error: unknown) {
    console.error('Error processing Fireflies webhook:', error);
    return res.status(500).send('Internal server error');
  }
}

