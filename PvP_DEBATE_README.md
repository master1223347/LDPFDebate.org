# PvP Debate System

This document describes the new Player vs Player (PvP) debate system added to LDPFDebate.org.

## Features

### 1. Match Creation
- Players can create debate matches with different formats (LD, PF)
- Configurable time controls and difficulty levels
- Matches start in "waiting" status

### 2. Match Joining
- Other players can propose times to join waiting matches
- Players fill out availability forms with timezone, date, time, and contact info
- Host receives notifications and can accept/reject proposals
- When a proposal is accepted, the match status changes to "ready"
- Both players must be present to start the debate

### 3. Debate Interface
- **Google Meet Integration**: Host can create a Google Meet link for video conferencing
- **Prep Timer**: Dedicated preparation time before the debate begins
- **Speech Timer**: Automatic timing for different debate phases
- **Phase Management**: Automatic progression through debate structure

### 4. Debate Phases
The system supports both Lincoln-Douglas (LD) and Public Forum (PF) formats:

#### LD Format:
- Preparation Time: 4 minutes
- First Affirmative Speech: 6 minutes
- Cross-Examination: 3 minutes
- First Negative Speech: 6 minutes
- Cross-Examination: 3 minutes
- First Rebuttal: 4 minutes
- Second Rebuttal: 4 minutes
- First Summary: 2 minutes
- Second Summary: 2 minutes

#### PF Format:
- Preparation Time: 2 minutes
- First Affirmative Speech: 4 minutes
- Cross-Examination: 3 minutes
- First Negative Speech: 4 minutes
- Cross-Examination: 3 minutes
- First Rebuttal: 4 minutes
- Second Rebuttal: 4 minutes
- First Summary: 2 minutes
- Second Summary: 2 minutes

## How to Use

### 1. Create a Match
1. Navigate to `/vs-player`
2. Click "Start Match"
3. Select debate format (LD or PF)
4. Choose time control
5. Set difficulty level
6. Click "Create Match"

### 2. Join a Match
1. Go to the Lobby (`/lobby`)
2. Find an available match
3. Click "Propose Time"
4. Fill out your availability and contact information
5. Submit your proposal

### 3. Start the Debate
1. Host reviews proposals and accepts one that works
2. When a proposal is accepted, both players return to the lobby
3. Both players can join the debate when ready from the "Ready to Join" section
4. Host can create Google Meet and start the debate
5. Non-host player joins the debate

### 4. During the Debate
1. **Host Actions**:
   - Create Google Meet link
   - Start the debate (only when both players have joined)
   - Control timers
   
2. **Timer Controls**:
   - Start/Pause/Reset timers
   - Automatic phase progression
   - Visual progress indicators

3. **Video Conference**:
   - Join Google Meet
   - Toggle video/audio
   - Share meeting link

4. **Player Management**:
   - Both players must join before debate can start
   - Host sees "Waiting for Opponent" until both join
   - Easy rejoin from dashboard or lobby

4. **Re-joining**:
   - Both players can rejoin active debates
   - Easy navigation back to lobby
   - Refresh functionality for real-time updates
   - Dashboard shows all active games with quick rejoin buttons

## Technical Implementation

### Routes
- `/vs-player` - Match creation page
- `/lobby` - Match browsing and proposal submission
- `/match-proposals/:matchId` - Host proposal management
- `/debate/:matchId` - Active debate interface

### Database Schema
Matches collection includes:
- `format`: "LD" or "PF"
- `timeControl`: Time limit string
- `difficulty`: "easy", "medium", "hard"
- `hostId`: Host user ID
- `opponentId`: Opponent user ID (when joined)
- `status`: "waiting", "ready", "active"
- `googleMeetUrl`: Video conference link
- `createdAt`, `joinedAt`, `startedAt`: Timestamps

### Components
- `PlayerVsPlayer.tsx` - Match creation
- `Lobby.tsx` - Match browsing and proposal submission
- `MatchProposals.tsx` - Host proposal management
- `Debate.tsx` - Debate interface with timers
- `JoinMatchModal.tsx` - Proposal submission modal
- `ActiveGamesPanel.tsx` - Dashboard active games display

## Future Enhancements

1. **Real Google Meet API Integration**: Replace mock meet creation with actual API calls
2. **Audio Notifications**: Add sound files for phase transitions
3. **Debate Recording**: Save debate sessions for review
4. **Judging System**: Add scoring and feedback mechanisms
5. **Spectator Mode**: Allow others to watch debates
6. **Chat System**: Text-based communication during debates
7. **Document Sharing**: Share evidence and case files

## Notes

- The current Google Meet integration generates mock URLs for demonstration
- Timer sounds are optional and won't play without audio files
- The system automatically manages debate phases and timing
- All debate data is stored in Firebase Firestore
- Real-time updates ensure all players see current match status
