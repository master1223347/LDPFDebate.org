import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import axios from 'axios';

const FIREFLIES_API_BASE = 'https://api.fireflies.ai/graphql';

function initializeFirebaseAdmin() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'debatetogether';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials missing. Please set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY environment variables.');
    }

    try {
      // Handle different private key formats
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = JSON.parse(privateKey);
      }
      
      if (!privateKey.includes('\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.error('Firebase Admin initialization failed:', error);
      throw new Error(`Failed to initialize Firebase Admin: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return getFirestore();
}

async function firefliesApiRequest(query: string, variables?: Record<string, unknown>) {
  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) {
    throw new Error('FIREFLIES_API_KEY environment variable not set');
  }

  console.log('Fireflies API Request:', {
    query: query.replace(/\s+/g, ' ').substring(0, 150),
    variables
  });

  try {
    const response = await axios.post(
      FIREFLIES_API_BASE,
      { 
        query, 
        variables: variables || {} 
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    console.log('Fireflies API Response:', {
      status: response.status,
      data: JSON.stringify(response.data).substring(0, 500)
    });

    if (response.data.errors) {
      const errorMsg = response.data.errors.map((e: any) => e.message).join(', ');
      console.error('GraphQL Errors:', response.data.errors);
      throw new Error(`Fireflies API error: ${errorMsg}`);
    }

    return response.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 400) {
        throw new Error(`Bad Request: ${JSON.stringify(error.response.data)}. Please check the meeting URL format and API parameters.`);
      }
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Authentication failed. Please verify your Fireflies API key is correct.');
      }

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Fireflies allows 3 requests per 20 minutes for addToLiveMeeting.');
      }
    }
    
    throw error;
  }
}

// Validate and clean Google Meet URL
function validateGoogleMeetUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Must be a Google Meet URL
    if (!urlObj.hostname.includes('meet.google.com')) {
      throw new Error('URL must be a Google Meet link (meet.google.com)');
    }

    // Extract meeting code
    const meetingCode = urlObj.pathname.split('/').filter(Boolean).pop();
    
    if (!meetingCode || meetingCode.length < 8) {
      throw new Error('Invalid Google Meet meeting code');
    }

    // Return clean URL without query parameters for Fireflies
    return `https://meet.google.com/${meetingCode}`;
  } catch (error) {
    if (error instanceof Error && error.message.includes('URL')) {
      throw error;
    }
    throw new Error('Invalid Google Meet URL format');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { googleMeetUrl, debateId, meetingTitle } = req.body;

    console.log('Received invite request:', { 
      hasUrl: !!googleMeetUrl, 
      hasDebateId: !!debateId,
      title: meetingTitle 
    });

    // Validate required fields
    if (!googleMeetUrl || !debateId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Both googleMeetUrl and debateId are required' 
      });
    }

    // Validate and clean Google Meet URL
    let cleanMeetUrl: string;
    try {
      cleanMeetUrl = validateGoogleMeetUrl(googleMeetUrl);
      console.log('Cleaned Meet URL:', cleanMeetUrl);
    } catch (error) {
      return res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Invalid Google Meet URL'
      });
    }

    // Initialize Firebase Admin
    const db = initializeFirebaseAdmin();

    // Use the correct Fireflies API mutation: addToLiveMeeting
    // Documentation: https://docs.fireflies.ai/graphql-api/mutation/add-to-live
    const addToLiveMeetingMutation = `
      mutation AddToLiveMeeting($meetingLink: String!, $title: String) {
        addToLiveMeeting(meeting_link: $meetingLink, title: $title) {
          success
        }
      }
    `;

    const result = await firefliesApiRequest(addToLiveMeetingMutation, {
      meetingLink: cleanMeetUrl,
      title: meetingTitle || `Debate ${debateId}`,
    });

    console.log('Fireflies API result:', result);

    // Check if the mutation was successful
    const success = result?.addToLiveMeeting?.success;

    if (!success) {
      throw new Error('Fireflies did not confirm successful bot invitation. Response: ' + JSON.stringify(result));
    }

    // Update debate document
    // Note: Fireflies doesn't return a meeting ID for addToLiveMeeting
    // The bot joins the meeting directly
    await db.collection('debates').doc(debateId).update({
      firefliesInvited: true,
      transcriptionStatus: 'active',
      transcriptLastUpdated: FieldValue.serverTimestamp(),
      googleMeetUrl: cleanMeetUrl,
    });

    console.log('Successfully invited Fireflies bot and updated Firestore');

    return res.status(200).json({
      success: true,
      message: 'Fireflies bot invited successfully. It will join the meeting shortly.',
    });
  } catch (error: unknown) {
    console.error('Error in invite handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to invite Fireflies bot';
    
    return res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
