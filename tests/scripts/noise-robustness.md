# Noise Robustness Test Script

**Purpose**: Test Echo's ability to filter background noise and maintain transcription accuracy in suboptimal conditions.

**Duration**: ~5 minutes  
**Speakers**: 1 (Primary speaker with background noise)

---

## Test Script

### Primary Speaker
**[0:00]** Let's discuss the Q3 planning document I shared yesterday.

**[0:30]** *[keyboard typing sounds]* The main priority is the user authentication overhaul we've been discussing.

**[1:00]** *[notification ping]* I need to schedule a meeting with the design team about the new dashboard layout.

**[1:30]** *[more typing]* The API endpoints need to be updated to support the new OAuth 2.0 implementation.

**[2:00]** *[phone vibration/brief notification]* Also, we should consider implementing rate limiting to prevent abuse.

**[2:30]** *[coffee mug clink, typing continues]* I'll create a technical specification document by end of day.

**[3:00]** *[another notification sound]* The stakeholders want a demo by next Friday, so we need to prioritize features.

**[3:30]** *[typing intensifies]* I'm thinking we focus on authentication first, then the dashboard improvements.

**[4:00]** *[notification chime]* Can everyone review the pull request I submitted this morning?

**[4:30]** *[final typing sounds]* That's all for now - let's sync up tomorrow morning.

---

## Background Noise Elements

Add these sounds during the marked timestamps:
- **Keyboard typing**: Continuous throughout, especially at [0:30], [1:30], [2:30], [3:30], [4:30]
- **Notifications**: Phone/email/notification sounds at [1:00], [2:00], [3:00], [4:00]
- **Environmental**: Coffee mug clink at [2:30], chair movement, paper shuffling
- **System sounds**: Computer fan hum, occasional system alerts

---

## Expected Test Results

### Transcription Accuracy
- **Primary Content**: All main points should be captured accurately
- **Noise Filtering**: Background typing and notifications should NOT appear in transcript
- **Content Integrity**: No hallucinated words from background noise
- **Technical Terms**: OAuth 2.0, API endpoints, rate limiting, pull request, dashboard

### Summary Should Extract
**Executive Summary**: Brief planning session discussing Q3 priorities including authentication overhaul, dashboard updates, and upcoming demo preparation.

**Decisions**: Focus on authentication implementation first, followed by dashboard improvements.

**Action Items**:
- Create technical specification for OAuth 2.0 (Owner: Primary speaker, Due: Today EOD)
- Schedule meeting with design team (Owner: Primary speaker, Due: TBD)
- Review submitted pull request (Owner: Team, Due: Today)
- Prepare stakeholder demo (Owner: Team, Due: Next Friday)

**Calendar Candidates**:
- Design team meeting (TBD)
- Stakeholder demo (Next Friday)
- Tomorrow morning sync-up

**Risks/Follow-ups**: Need to confirm design team availability for dashboard layout meeting.

---

## Testing Instructions

1. **Setup**: 
   - Play background noises at moderate volume
   - Speak clearly but naturally over the noise
   - Use typical office environment sounds

2. **Environment**: 
   - Quiet room with added background noise
   - Maintain normal speaking volume
   - Don't over-enunciate (test real-world conditions)

3. **Verification**: Check that:
   - Only speech content is transcribed
   - No typing sounds appear in transcript
   - Notifications don't create false transcriptions
   - Summary focuses on actual spoken content

4. **Metrics to Record**:
   - Signal-to-noise ratio handling
   - False positive rate (noise transcribed as speech)
   - Content accuracy despite background interference
   - Summary quality with noisy input
