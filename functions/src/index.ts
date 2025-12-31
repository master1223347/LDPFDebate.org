import {onRequest} from "firebase-functions/https";
import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();

const db = admin.firestore();

const FIREFLIES_API_BASE = "https://api.fireflies.ai/graphql";

// Get Fireflies API key from environment
function getFirefliesApiKey(): string {
  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) {
    throw new Error("FIREFLIES_API_KEY environment variable not set");
  }
  return apiKey;
}

async function firefliesApiRequest(query: string, variables?: Record<string, unknown>) {
  const apiKey = getFirefliesApiKey();
  
  try {
    const response = await axios.post(
      FIREFLIES_API_BASE,
      { query, variables: variables || {} },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.errors) {
      throw new Error(`Fireflies API error: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data;
  } catch (error: unknown) {
    logger.error("Fireflies API request failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to communicate with Fireflies API";
    throw new Error(errorMessage);
  }
}

// Invite Fireflies bot to join a Google Meet meeting
export const inviteFirefliesBot = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  const {googleMeetUrl, debateId, meetingTitle} = request.data as {
    googleMeetUrl: string;
    debateId: string;
    meetingTitle?: string;
  };

  if (!googleMeetUrl || !debateId) {
    throw new Error("googleMeetUrl and debateId are required");
  }

  try {
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

    const meetingId = (result as {createMeeting?: {meetingId?: string}}).createMeeting?.meetingId;

    if (!meetingId) {
      throw new Error("Failed to create Fireflies meeting");
    }

    await db.collection("debates").doc(debateId).update({
      firefliesMeetingId: meetingId,
      transcriptionStatus: "pending",
      transcriptLastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      firefliesMeetingId: meetingId,
      message: "Fireflies bot invited successfully",
    };
  } catch (error: unknown) {
    logger.error("Error inviting Fireflies bot:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to invite Fireflies bot";
    throw new Error(errorMessage);
  }
});

// Webhook endpoint to receive transcript updates from Fireflies
export const firefliesWebhook = onRequest(async (req, res) => {
  const webhookSecret = process.env.FIREFLIES_WEBHOOK_SECRET;
  if (webhookSecret && req.headers["x-fireflies-secret"] !== webhookSecret) {
    res.status(401).send("Unauthorized");
    return;
  }

  try {
    const {meetingId, transcript, segments, status} = req.body as {
      meetingId?: string;
      transcript?: string;
      segments?: unknown[];
      status?: string;
    };

    if (!meetingId) {
      res.status(400).send("meetingId is required");
      return;
    }

    const debatesSnapshot = await db
      .collection("debates")
      .where("firefliesMeetingId", "==", meetingId)
      .limit(1)
      .get();

    if (debatesSnapshot.empty) {
      logger.warn(`No debate found for Fireflies meeting ${meetingId}`);
      res.status(200).send("No matching debate found");
      return;
    }

    const debateDoc = debatesSnapshot.docs[0];
    const debateId = debateDoc.id;

    const updateData: Record<string, unknown> = {
      transcriptLastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (transcript) updateData.transcript = transcript;
    if (segments) updateData.transcriptSegments = segments;
    if (status) updateData.transcriptionStatus = status;

    await db.collection("debates").doc(debateId).update(updateData);

    res.status(200).send("Transcript updated successfully");
  } catch (error: unknown) {
    logger.error("Error processing Fireflies webhook:", error);
    res.status(500).send("Internal server error");
  }
});

// Manually fetch transcript from Fireflies API
export const fetchTranscript = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  const {debateId} = request.data as {debateId?: string};

  if (!debateId) {
    throw new Error("debateId is required");
  }

  try {
    const debateDoc = await db.collection("debates").doc(debateId).get();
    
    if (!debateDoc.exists) {
      throw new Error("Debate not found");
    }

    const debateData = debateDoc.data();
    const firefliesMeetingId = debateData?.firefliesMeetingId as string | undefined;

    if (!firefliesMeetingId) {
      throw new Error("No Fireflies meeting ID found for this debate");
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

    const transcriptData = (result as {transcript?: {
      fullTranscript?: string;
      segments?: unknown[];
      status?: string;
    }}).transcript;

    if (!transcriptData) {
      throw new Error("No transcript data returned from Fireflies");
    }

    await db.collection("debates").doc(debateId).update({
      transcript: transcriptData.fullTranscript || "",
      transcriptSegments: transcriptData.segments || [],
      transcriptionStatus: transcriptData.status || "active",
      transcriptLastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      transcript: transcriptData.fullTranscript,
      segments: transcriptData.segments,
      status: transcriptData.status,
    };
  } catch (error: unknown) {
    logger.error("Error fetching transcript:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch transcript";
    throw new Error(errorMessage);
  }
});
