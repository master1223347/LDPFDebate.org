import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

function initializeFirebaseAdmin() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'debatetogether';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials missing');
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

// Decode API key (reverse of base64 encoding)
const decodeApiKey = (encoded: string): string => {
  try {
    return atob(encoded);
  } catch {
    return '';
  }
};

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
    const db = initializeFirebaseAdmin();
    const { debateId, userId } = req.body;

    if (!debateId || !userId) {
      return res.status(400).json({ error: 'debateId and userId are required' });
    }

    // Get user's API key
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (!userData?.geminiApiKey) {
      return res.status(412).json({ error: 'No API key found. Please set up your API key in your profile.' });
    }

    const apiKey = decodeApiKey(userData.geminiApiKey);
    if (!apiKey) {
      return res.status(500).json({ error: 'Failed to decode API key' });
    }

    // Get debate data
    const debateDoc = await db.collection('debates').doc(debateId).get();
    if (!debateDoc.exists) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    const debateData = debateDoc.data();
    
    // Get transcript if available
    const transcript = debateData?.transcript || '';
    
    // Prepare prompt for Gemini
    const format = debateData?.format || 'LD';
    const hostName = debateData?.hostUsername || debateData?.hostName || 'Affirmative';
    const opponentName = debateData?.opponentUsername || debateData?.opponentName || 'Negative';
    
    const prompt = `You are an expert debate judge evaluating a ${format} (${format === 'LD' ? 'Lincoln-Douglas' : 'Public Forum'}) debate.

Debate Format: ${format}
Affirmative: ${hostName}
Negative: ${opponentName}

${transcript ? `Debate Transcript:\n${transcript}\n\n` : 'No transcript available for this debate.\n\n'}

Please provide a detailed judgment including:
1. A brief summary of the debate
2. Key arguments presented by each side
3. Analysis of argumentation quality, evidence usage, and logical consistency
4. Winner determination (Affirmative or Negative) with clear reasoning
5. Speaker points (if applicable) or overall ratings for each debater

Format your response clearly with sections. Be fair, thorough, and constructive.`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return res.status(geminiResponse.status).json({ 
        error: 'Failed to get AI judgment',
        details: geminiResponse.status === 401 ? 'Invalid API key. Please check your API key in your profile.' : errorText
      });
    }

    const geminiData = await geminiResponse.json();
    const judgmentText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No judgment generated';

    // Store judgment in debate document (optional - for caching)
    await db.collection('debates').doc(debateId).update({
      aiJudgment: judgmentText,
      aiJudgmentAt: new Date().toISOString(),
      aiJudgedBy: userId,
    });

    return res.status(200).json({
      success: true,
      judgment: judgmentText,
      format,
      affirmative: hostName,
      negative: opponentName,
    });
  } catch (error: unknown) {
    console.error('Error getting AI judgment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get AI judgment';
    return res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    });
  }
}

