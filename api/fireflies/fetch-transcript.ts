import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore, serverTimestamp } from 'firebase-admin/firestore';
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
    const { debateId } = req.body;

    if (!debateId) {
      return res.status(400).json({ error: 'debateId is required' });
    }

    // Get debate document
    const debateDoc = await db.collection('debates').doc(debateId).get();

    if (!debateDoc.exists) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    const debateData = debateDoc.data();
    const firefliesMeetingId = debateData?.firefliesMeetingId as string | undefined;

    if (!firefliesMeetingId) {
      return res.status(400).json({ error: 'No Fireflies meeting ID found for this debate' });
    }

    const getTranscriptQuery = `
      query GetTranscript($meetingId: String!) {
        transcript(meetingId: $meetingId) {
          fullTranscript
          segments {
            speaker
            text
            timestamp
          }
          status
        }
      }
    `;

    const result = await firefliesApiRequest(getTranscriptQuery, {
      meetingId: firefliesMeetingId,
    });

    const transcriptData = (result as {
      transcript?: {
        fullTranscript?: string;
        segments?: unknown[];
        status?: string;
      };
    }).transcript;

    if (!transcriptData) {
      throw new Error('No transcript data returned from Fireflies');
    }

    // Update debate document
    await db.collection('debates').doc(debateId).update({
      transcript: transcriptData.fullTranscript || '',
      transcriptSegments: transcriptData.segments || [],
      transcriptionStatus: transcriptData.status || 'active',
      transcriptLastUpdated: serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      transcript: transcriptData.fullTranscript,
      segments: transcriptData.segments,
      status: transcriptData.status,
    });
  } catch (error: unknown) {
    console.error('Error fetching transcript:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transcript';
    return res.status(500).json({ error: errorMessage });
  }
}

