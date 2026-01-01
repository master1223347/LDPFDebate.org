import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import axios from 'axios';

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
const FIREFLIES_API_BASE = 'https://api.fireflies.ai/graphql';

async function firefliesApiRequest(query: string, variables?: Record<string, unknown>) {
  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) {
    throw new Error('FIREFLIES_API_KEY environment variable not set');
  }

  try {
    const response = await axios.post(
      FIREFLIES_API_BASE,
      { query, variables: variables || {} },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.errors) {
      throw new Error(`Fireflies API error: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to communicate with Fireflies API';
    throw new Error(errorMessage);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user is authenticated (you can add Firebase Auth token verification here)
    const { googleMeetUrl, debateId, meetingTitle } = req.body;

    if (!googleMeetUrl || !debateId) {
      return res.status(400).json({ error: 'googleMeetUrl and debateId are required' });
    }

    const createMeetingMutation = `
      mutation CreateMeeting($meetingUrl: String!, $title: String) {
        createMeeting(meetingUrl: $meetingUrl, title: $title) {
          meetingId
          status
          botJoined
        }
      }
    `;

    const result = await firefliesApiRequest(createMeetingMutation, {
      meetingUrl: googleMeetUrl,
      title: meetingTitle || `Debate ${debateId}`,
    });

    const meetingId = (result as { createMeeting?: { meetingId?: string } }).createMeeting?.meetingId;

    if (!meetingId) {
      throw new Error('Failed to create Fireflies meeting');
    }

    // Update debate document with Fireflies meeting ID
    await db.collection('debates').doc(debateId).update({
      firefliesMeetingId: meetingId,
      transcriptionStatus: 'pending',
      transcriptLastUpdated: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      firefliesMeetingId: meetingId,
      message: 'Fireflies bot invited successfully',
    });
  } catch (error: unknown) {
    console.error('Error inviting Fireflies bot:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to invite Fireflies bot';
    return res.status(500).json({ error: errorMessage });
  }
}

