// Google Meet utility functions

export interface GoogleMeetDetails {
  meetId: string;
  url: string;
  joinUrl: string;
  hostUrl: string;
}

/**
 * Generates a realistic Google Meet ID
 * Google Meet IDs are typically 3-4 character lowercase alphabetic codes
 */
export const generateMeetId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const length = Math.random() > 0.5 ? 3 : 4; // 50% chance of 3 or 4 chars
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Creates a complete Google Meet setup
 */
export const createGoogleMeet = (): GoogleMeetDetails => {
  const meetId = generateMeetId();
  const baseUrl = 'https://meet.google.com';
  
  return {
    meetId,
    url: `${baseUrl}/${meetId}`,
    joinUrl: `${baseUrl}/${meetId}?hs=122&authuser=0`,
    hostUrl: `${baseUrl}/${meetId}?hs=122&authuser=0&meeting=1`
  };
};

/**
 * Validates if a Google Meet ID is properly formatted
 */
export const isValidMeetId = (meetId: string): boolean => {
  // Google Meet IDs are 3-4 lowercase letters
  const meetIdRegex = /^[a-z]{3,4}$/;
  return meetIdRegex.test(meetId);
};

/**
 * Formats a Google Meet ID for display
 */
export const formatMeetId = (meetId: string): string => {
  return meetId.toUpperCase();
};

/**
 * Creates a shareable meeting link with proper formatting
 */
export const createShareableLink = (meetId: string, title?: string): string => {
  const baseUrl = `https://meet.google.com/${meetId}`;
  if (title) {
    return `${baseUrl}?hs=122&authuser=0&meeting=1&title=${encodeURIComponent(title)}`;
  }
  return `${baseUrl}?hs=122&authuser=0&meeting=1`;
};

/**
 * Generates meeting instructions for participants
 */
export const generateMeetingInstructions = (meetId: string, title?: string): string => {
  const formattedId = formatMeetId(meetId);
  const shareableLink = createShareableLink(meetId, title);
  
  return `Join the debate meeting:
  
Meeting ID: ${formattedId}
Direct Link: ${shareableLink}

Instructions:
1. Click the link above or go to meet.google.com
2. Enter the meeting ID: ${formattedId}
3. Join with your microphone and camera
4. Wait for the host to start the debate`;
};
