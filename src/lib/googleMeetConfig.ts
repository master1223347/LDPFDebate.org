// Google Meet Configuration and Advanced Features

export interface GoogleMeetConfig {
  // Meeting settings
  autoJoinWithMic: boolean;
  autoJoinWithVideo: boolean;
  muteOnEntry: boolean;
  // Advanced features
  enableChat: boolean;
  enableHandRaise: boolean;
  enableScreenShare: boolean;
  // Security
  requireApproval: boolean;
  allowAnonymous: boolean;
}

export const defaultMeetConfig: GoogleMeetConfig = {
  autoJoinWithMic: true,
  autoJoinWithVideo: false,
  muteOnEntry: true,
  enableChat: true,
  enableHandRaise: true,
  enableScreenShare: true,
  requireApproval: false,
  allowAnonymous: false,
};

/**
 * Creates a Google Meet URL with advanced parameters
 */
export const createAdvancedMeetUrl = (
  meetId: string, 
  config: Partial<GoogleMeetConfig> = {}
): string => {
  const finalConfig = { ...defaultMeetConfig, ...config };
  const baseUrl = `https://meet.google.com/${meetId}`;
  
  const params = new URLSearchParams();
  
  // Basic parameters
  params.append('hs', '122'); // Host settings
  params.append('authuser', '0');
  
  // Audio/Video settings
  if (finalConfig.autoJoinWithMic) params.append('am', '1');
  if (finalConfig.autoJoinWithVideo) params.append('av', '1');
  if (finalConfig.muteOnEntry) params.append('mute', '1');
  
  // Feature settings
  if (finalConfig.enableChat) params.append('chat', '1');
  if (finalConfig.enableHandRaise) params.append('hand', '1');
  if (finalConfig.enableScreenShare) params.append('share', '1');
  
  // Security settings
  if (finalConfig.requireApproval) params.append('approval', '1');
  if (finalConfig.allowAnonymous) params.append('anon', '1');
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Generates a meeting invitation template
 */
export const generateMeetingInvitation = (
  meetId: string,
  title: string,
  hostName: string,
  startTime?: string,
  config: Partial<GoogleMeetConfig> = {}
): string => {
  const formattedId = meetId.toUpperCase();
  const joinUrl = createAdvancedMeetUrl(meetId, config);
  
  return `📅 ${title}

👤 Host: ${hostName}
🆔 Meeting ID: ${formattedId}
🔗 Join Link: ${joinUrl}
${startTime ? `⏰ Start Time: ${startTime}` : ''}

📋 Instructions:
1. Click the join link above
2. Or go to meet.google.com and enter: ${formattedId}
3. Join with your microphone and camera
4. Wait for the host to start

💡 Tips:
• Test your audio/video before joining
• Use headphones for better audio quality
• Find a quiet location for the debate
• Have your arguments ready!`;
};

/**
 * Creates a QR code URL for easy mobile joining
 */
export const createQRCodeUrl = (meetId: string): string => {
  const meetUrl = `https://meet.google.com/${meetId}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(meetUrl)}`;
};

/**
 * Validates and formats a meeting ID for display
 */
export const formatMeetingId = (meetId: string): string => {
  // Remove any URL parts and extract just the ID
  const cleanId = meetId.replace(/^https?:\/\/meet\.google\.com\//, '').split('?')[0];
  
  if (cleanId.length >= 3 && cleanId.length <= 4) {
    return cleanId.toUpperCase();
  }
  
  return cleanId;
};
