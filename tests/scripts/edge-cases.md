# Edge Cases Test Script

**Purpose**: Test Echo's handling of edge cases including silence, non-speech audio, accidental recordings, and unusual speaking patterns.

**Duration**: ~6 minutes  
**Speakers**: 1 (with various audio scenarios)

---

## Test Scenarios

### Scenario 1: Extended Silence
**[0:00]** *[Start recording]*

**[0:05 - 1:30]** *[Complete silence - no speech]*

**[1:30]** Okay, let's test if the system handled that silence period correctly.

---

### Scenario 2: Non-Speech Audio
**[2:00]** *[Play music for 15 seconds]*

**[2:15]** *[Coughing, throat clearing]*

**[2:30]** *[Phone ringing - let it ring 3 times]*

**[2:45]** The system should not have transcribed any of those non-speech sounds.

---

### Scenario 3: Accidental Recording
**[3:00]** *[Mutter to self]* "Oops, I hit record by accident."

**[3:15]** *[Normal voice]* This is a test of accidental recording detection.

**[3:30]** *[Whispering]* This should still be transcribed even if quiet.

---

### Scenario 4: Rapid Speech & Interruptions
**[4:00]** SpeakingveryquicklywithminimalpausetesthowthehandlesspeechboundariesandsegmentationthisisachallengetestfortheVADsystem.

**[4:15]** *[Self-interruption]* Wait, let me restart that more clearly.

**[4:30]** Speaking very quickly tests how the system handles speech boundaries and segmentation. This is a challenge test for the VAD system.

**[4:45]** *[False start]* The implementation needs to handle-

**[5:00]** *[Restart]* The implementation needs to handle interruptions and restarts gracefully.

---

### Scenario 5: Mixed Languages & Technical Terms
**[5:30]** Let's test some technical terms: API, JWT, OAuth, CORS, SQL, NoSQL, Kubernetes, Docker, CI/CD, REST, GraphQL.

**[5:45]** *[Brief Spanish phrase]* Esto es una prueba de multilingüe.

**[5:55]** *[Back to English]* The system should handle mixed languages appropriately.

---

## Expected Test Results

### Transcription Accuracy
- **Silence Handling**: No transcript generated during silent periods
- **Non-Speech Filtering**: Music, coughing, phone rings should NOT appear
- **Quiet Speech**: Whispering should still be captured
- **Speech Boundaries**: Rapid speech properly segmented
- **Self-Corrections**: False starts and restarts handled naturally
- **Technical Terms**: All technical terms correctly transcribed
- **Mixed Languages**: Non-English phrases handled appropriately

### Summary Should Extract
**Executive Summary**: Edge case testing session covering silence handling, non-speech audio filtering, and speech boundary detection.

**Decisions**: System correctly handles various edge cases without generating false transcriptions.

**Action Items**:
- None (this is a test session, not a real meeting)

**Calendar Candidates**:
- None (test scenario)

**Risks/Follow-ups**: Verify that production system maintains these edge case handling capabilities.

---

## Testing Instructions

1. **Setup**: 
   - Follow each scenario exactly as described
   - Use actual audio files for non-speech sounds
   - Speak naturally in each scenario

2. **Environment**: 
   - Quiet room for silence test
   - Add deliberate non-speech audio
   - Vary speaking volume and pace

3. **Verification**: Check that:
   - Silent periods produce no transcript content
   - Non-speech sounds are filtered out
   - Quiet speech is still captured
   - Rapid speech is properly segmented
   - Self-corrections appear naturally
   - Technical terms are accurate
   - Mixed languages don't break the system

4. **Metrics to Record**:
   - False positive rate (noise transcribed as speech)
   - False negative rate (speech not detected)
   - Speech boundary accuracy
   - Technical term recognition rate
   - Language switching robustness
