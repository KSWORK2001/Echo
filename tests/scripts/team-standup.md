# Team Standup Meeting Script

**Purpose**: Test multi-speaker handling, rapid speech patterns, and action item extraction in a collaborative meeting.

**Duration**: ~12 minutes  
**Speakers**: 4 (Team Lead, Dev 1, Dev 2, Dev 3)

---

## Meeting Dialogue

### Team Lead (Speaker 1)
**[0:00]** Morning team! Quick standup - let's keep it tight today. What's everyone working on?

**[0:15]** Great. Any blockers or dependencies?

**[1:00]** Quick update on the Q2 roadmap - we need to finalize the API migration plan by Wednesday. I've scheduled a design review for Tuesday at 2 PM.

**[1:30]** Also, the client demo is next Thursday, so we need to freeze features by end of day Tuesday.

**[2:00]** Anything else before we wrap?

**[3:45]** Perfect. Let's sync up again tomorrow. Have a productive day!

---

### Dev 1 (Speaker 2)
**[0:20]** I'm wrapping up the authentication refactor. Should have PR ready by noon today. Need code review from someone familiar with OAuth flows.

**[0:40]** Actually, I'm blocked on the new rate limiting service - waiting on Dev 3 to complete the Redis configuration.

**[1:10]** Got it. I'll prioritize the auth work and push the migration tasks to after the demo.

**[2:10]** That's it for me.

---

### Dev 2 (Speaker 3)
**[0:30]** I'm continuing with the dashboard performance optimization. Implemented virtual scrolling yesterday, cut load times by 60%.

**[0:50]** No blockers, but I need to pair with Dev 1 on the API integration changes.

**[1:20]** Perfect timing - I was planning to work on that this afternoon. Can we pair at 3 PM?

**[2:20]** I'll also need to update the documentation before the demo freeze.

---

### Dev 3 (Speaker 4)
**[0:35]** Working on the Redis setup for rate limiting. Should have it deployed by lunch. Then moving to the WebSocket connection pool.

**[0:55]** The Redis cluster is taking longer than expected - hitting some configuration issues with the staging environment.

**[1:25]** I'll have Redis done by 2 PM latest, then Dev 1 can proceed with auth testing.

**[2:25]** Also, I noticed some memory leaks in the WebSocket implementation - will investigate after Redis.

**[2:35]** That's all from me.

---

## Expected Test Results

### Transcription Accuracy
- **Speaker Separation**: Clear distinction between 4 different speakers
- **Technical Terms**: Authentication, OAuth, rate limiting, Redis, virtual scrolling, WebSocket, connection pool, memory leaks
- **Overlapping Speech**: Some interruptions should be handled gracefully
- **Numbers and Times**: Noon, 2 PM, Wednesday, Thursday, 60%, 3 PM, lunch

### Summary Should Extract
**Executive Summary**: Daily standup covering auth refactor progress, dashboard optimization, Redis setup delays, and upcoming deadlines for API migration and client demo.

**Decisions**: 
- Feature freeze by end of Tuesday for client demo
- API migration plan finalization by Wednesday
- Design review scheduled for Tuesday 2 PM

**Action Items**:
- Complete authentication refactor PR by noon (Owner: Dev 1, Due: Today noon)
- Deploy Redis configuration by 2 PM (Owner: Dev 3, Due: Today 2 PM)
- Pair programming on API integration at 3 PM (Owner: Dev 2 & Dev 1, Due: Today 3 PM)
- Update documentation before demo freeze (Owner: Dev 2, Due: Tuesday EOD)
- Finalize API migration plan (Owner: Team Lead, Due: Wednesday)
- Investigate WebSocket memory leaks (Owner: Dev 3, Due: After Redis)

**Calendar Candidates**:
- Design review: Tuesday 2 PM
- Client demo: Next Thursday
- Code review for auth refactor: Today afternoon
- Pair programming session: Today 3 PM

**Risks/Follow-ups**: Redis configuration delays may impact auth testing timeline; need to monitor WebSocket memory usage.

---

## Testing Instructions

1. **Setup**: Have 4 people read this script or use different voice recordings
2. **Environment**: Normal meeting pace, some natural interruptions
3. **Verification**: Check that:
   - All 4 speakers are correctly identified
   - Action items have correct owners and deadlines
   - Technical terms are accurately transcribed
   - Calendar events are properly extracted

4. **Metrics to Record**:
   - Speaker identification accuracy (4 speakers)
   - Action item completeness (all 6 items captured)
   - Technical term accuracy
   - Handling of overlapping speech
