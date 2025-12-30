import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { google } from "googleapis";

admin.initializeApp();

/**
 * Creates a Google Meet meeting using Google Calendar API
 * Requires Google Calendar API credentials to be set up
 */
export const createGoogleMeet = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { title, startTime, endTime } = data;

  try {
    // Initialize Google Calendar API
    // Note: You'll need to set up OAuth2 credentials and store them securely
    // For now, this is a template that requires proper OAuth setup
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Get user's access token from Firestore (stored after OAuth flow)
    const userDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.googleAccessToken) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "User needs to authorize Google Calendar access"
      );
    }

    oauth2Client.setCredentials({
      access_token: userData.googleAccessToken,
      refresh_token: userData.googleRefreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Create calendar event with Google Meet link
    const event = {
      summary: title || "Debate Meeting",
      start: {
        dateTime: startTime || new Date().toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
        timeZone: "UTC",
      },
      conferenceData: {
        createRequest: {
          requestId: `debate-${context.auth.uid}-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: 1,
    });

    const meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri;

    if (!meetLink) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create Google Meet link"
      );
    }

    return {
      meetLink,
      meetingId: response.data.id,
      hangoutLink: response.data.hangoutLink,
    };
  } catch (error: any) {
    console.error("Error creating Google Meet:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to create Google Meet"
    );
  }
});

