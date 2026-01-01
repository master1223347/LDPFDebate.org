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
    query: query.replace(/\s+/g, ' ').substring(0, 100),
    variables: JSON.stringify(variables)
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
        timeout: 30000,
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      }
    );

    console.log('Fireflies API Response:', {
      status: response.status,
      data: JSON.stringify(response.data)
    });

    // Handle GraphQL errors
    if (response.data.errors) {
      const errorMsg = response.data.errors.map((e: any) => e.message).join(', ');
      throw new Error(`Fireflies API error: ${errorMsg}`);
    }

    // Handle HTTP errors
    if (response.status !== 200) {
      throw new Error(`Fireflies API returned status ${response.status}: ${JSON.stringify(response.data)}`);
    }

    return response.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      if (error.response?.status === 400) {
        throw new Error(`Invalid request to Fireflies API. Check: 1) API key is valid, 2) Google Meet URL format is correct, 3) You have Fireflies API access`);
      }
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Fireflies API authentication failed. Check your API key.');
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
      throw new Error('Invalid Google Meet URL format');
    }

    // Return clean URL
    return `https://meet.google.com/${meetingCode}`;
  } catch (error) {
    throw new Error(`Invalid Google Meet URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    // Try the Fireflies API request
    // Note: The exact mutation format might vary - check Fireflies API docs
    const createMeetingMutation = `
      mutation($meetingUrl: String!, $title: String) {
        addMeetingToBot(
          meetingUrl: $meetingUrl
          title: $title
        ) {
          success
          meeting_id
        }
      }
    `;

    let result;
    try {
      result = await firefliesApiRequest(createMeetingMutation, {
        meetingUrl: cleanMeetUrl,
        title: meetingTitle || `Debate ${debateId}`,
      });
    } catch (apiError) {
      console.error('Fireflies API call failed:', apiError);
      
      // Try alternative mutation format
      console.log('Trying alternative mutation format...');
      
      const alternativeMutation = `
        mutation CreateMeeting($input: CreateMeetingInput!) {
          createMeeting(input: $input) {
            id
            status
          }
        }
      `;
      
      try {
        result = await firefliesApiRequest(alternativeMutation, {
          input: {
            meetingUrl: cleanMeetUrl,
            title: meetingTitle || `Debate ${debateId}`,
          }
        });
      } catch (altError) {
        throw new Error(`Both mutation formats failed. Please check Fireflies API documentation for the correct format. Original error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
    }

    // Extract meeting ID from response
    const meetingId = 
      result?.addMeetingToBot?.meeting_id || 
      result?.createMeeting?.id ||
      result?.createMeeting?.meetingId;

    if (!meetingId) {
      console.error('No meeting ID in response:', JSON.stringify(result));
      throw new Error('Fireflies API did not return a meeting ID. Response: ' + JSON.stringify(result));
    }

    console.log('Fireflies meeting created with ID:', meetingId);

    // Update debate document with Fireflies meeting ID
    await db.collection('debates').doc(debateId).update({
      firefliesMeetingId: meetingId,
      transcriptionStatus: 'pending',
      transcriptLastUpdated: FieldValue.serverTimestamp(),
      googleMeetUrl: cleanMeetUrl, // Store the clean URL
    });

    console.log('Firestore updated successfully');

    return res.status(200).json({
      success: true,
      firefliesMeetingId: meetingId,
      message: 'Fireflies bot invited successfully',
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