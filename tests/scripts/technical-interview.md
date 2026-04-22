# Technical Interview Script

**Purpose**: Test Echo's transcription accuracy with technical terms, speaker separation, and summary extraction for action items and calendar candidates.

**Duration**: ~8 minutes  
**Speakers**: 2 (Interviewer, Candidate)

---

## Interview Dialogue

### Interviewer (Speaker 1)
**[0:00]** Hi there! Thanks for coming in today. I'm Sarah, the engineering manager here at TechCorp. We're looking for a senior frontend engineer to join our platform team.

**[0:15]** To start, could you tell me about your experience with React and TypeScript? We use those heavily in our main application.

**[0:30]** That's impressive. Can you walk me through a recent project where you had to optimize performance? What were the specific metrics you improved?

**[1:00]** Interesting approach. How do you handle state management in large applications? Have you worked with Redux Toolkit or Zustand?

**[1:30]** Let's talk about testing. What's your experience with unit testing and integration testing in React applications?

**[2:00]** Great. Now I'd like to discuss a real scenario. We have a performance issue where our dashboard loads slowly with large datasets. How would you approach debugging this?

**[2:45]** Perfect. What tools would you use? And how would you measure the improvements?

**[3:15]** Let's move on to system design. How would you architect a real-time collaboration feature similar to Google Docs?

**[4:00]** That's a solid approach. Have you worked with WebSockets or WebRTC before?

**[4:30]** Excellent. Now, about team collaboration - how do you handle code reviews and providing feedback to junior developers?

**[5:00]** One more technical question - what's your experience with build tools and CI/CD pipelines? We use GitHub Actions.

**[5:45]** Great. Do you have any questions for me about the role or the team?

**[6:15]** Those are good questions. Let me address the tech stack first...

**[6:45]** Regarding the team structure, we have 6 engineers total...

**[7:00]** And for the onboarding process, we typically do a 2-week pairing period...

**[7:30]** Perfect. Well, I think we have a good picture. We'll be making decisions by end of week and will reach out to references by Friday.

**[7:45]** Thanks again for coming in. You should hear from us by next Monday at the latest.

---

### Candidate (Speaker 2)
**[0:10]** Thanks for having me, Sarah! I'm excited to learn more about the opportunity.

**[0:20]** I've been working with React for about 6 years now, and TypeScript for the last 4. In my current role at StartupXYZ, I led the migration of our entire codebase from JavaScript to TypeScript, which reduced our bug rate by about 40%.

**[0:40]** Sure! We had a dashboard that was taking 8-10 seconds to load with our customer data. I implemented virtual scrolling, memoized expensive calculations using React.memo, and optimized our Redux selectors. Got it down to under 2 seconds. The key metrics were load time, memory usage, and CPU utilization during rendering.

**[1:10]** I've used both extensively. I prefer Redux Toolkit for larger applications because of its dev tools and standardized patterns. For simpler use cases, Zustand is great - much less boilerplate.

**[1:45]** I'm a big advocate for testing. I typically write unit tests with Jest and React Testing Library, aiming for at least 80% coverage. For integration testing, I've used Cypress and Playwright. I believe in testing user behavior rather than implementation details.

**[2:15]** I'd start by profiling the component using React DevTools Profiler to identify expensive renders. Then I'd check network requests using Chrome DevTools. Common culprits are unnecessary re-renders, large bundle sizes, or inefficient data fetching patterns.

**[3:00]** I'd use Lighthouse for performance scores, React Profiler for render optimization, and custom performance.mark() in the code to measure specific operations. The goal would be to get Lighthouse score above 90 and Time to Interactive under 3 seconds.

**[3:30]** I'd use WebSockets for real-time updates combined with CRDTs (Conflict-free Replicated Data Types) for conflict resolution. The architecture would include: WebSocket connection manager, operational transformation for text changes, and a local cache with optimistic updates. For scaling, I'd implement connection pooling and consider WebRTC for peer-to-peer in larger sessions.

**[4:15]** Yes, I've implemented WebSockets for a chat feature and experimented with WebRTC for screen sharing. WebSockets are great for server-client communication, while WebRTC excels at peer-to-peer data transfer with lower latency.

**[4:45]** I believe in constructive, specific feedback. I use the "praise-question-suggestion" model. For code reviews, I focus on maintainability, performance, and security. With junior devs, I pair program and explain the 'why' behind decisions, not just the 'how'.

**[5:15]** I've set up GitHub Actions workflows for automated testing and deployment. I'm familiar with Docker, npm scripts, and have experience with Vite and Webpack. I've also implemented automated semantic versioning and changelog generation.

**[6:00]** Yes, I'd love to know more about the tech stack beyond React/TypeScript. Are you using any particular state management library or testing framework?

**[6:30]** What does the typical project lifecycle look like? And how does the team handle technical debt?

**[6:55]** That sounds great. What are the biggest challenges the team is currently facing?

**[7:15]** Thank you for the detailed information! I'm really excited about this opportunity.

**[7:30]** Sounds good. I'll make sure my references are available this week. Thanks again for your time!

---

## Expected Test Results

### Transcription Accuracy
- **Technical Terms**: React, TypeScript, Redux Toolkit, Zustand, Jest, Cypress, Playwright, WebSockets, WebRTC, CRDTs, GitHub Actions, Docker, Vite, Webpack
- **Metrics**: Numbers and measurements (8-10 seconds, 40%, 2 seconds, 80%, 90%, 3 seconds, 6 years, 4 years)
- **Speaker Separation**: Clear distinction between interviewer and candidate responses

### Summary Should Extract
**Executive Summary**: 45-minute technical interview for senior frontend engineer position covering React/TypeScript experience, performance optimization, and system design.

**Decisions**: Candidate experience aligns well with requirements; strong technical background demonstrated.

**Action Items**:
- Reference checks to be completed by Friday (Owner: Sarah, Due: Friday)
- Decision to be made by end of week (Owner: Hiring team, Due: Friday)
- Candidate to be notified by next Monday (Owner: Sarah, Due: Monday)

**Calendar Candidates**:
- Follow-up interview with team members (Potential next week)
- Technical assessment or coding challenge (If needed)
- Reference calls scheduled (Thursday-Friday)

**Risks/Follow-ups**: Need to verify candidate's experience with specific tech stack mentioned in questions.

---

## Testing Instructions

1. **Setup**: Play this script through speakers while Echo records system audio
2. **Environment**: Quiet room, clear audio, moderate speaking pace
3. **Verification**: Check that:
   - Technical terms are transcribed correctly
   - Speaker attribution is accurate
   - Summary captures all action items with owners/dates
   - Calendar candidates are identified
   - No hallucinated content appears

4. **Metrics to Record**:
   - Transcription accuracy (count of correct technical terms)
   - Speaker separation accuracy
   - Summary completeness (all sections present)
   - Processing time for summary generation
