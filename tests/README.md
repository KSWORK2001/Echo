# Echo Test Suite

## Purpose
Automated and manual tests for Echo's meeting recording, transcription, and summarization features.

## Running Tests

### Manual Tests
```bash
# Run interview simulation script
npm run test:interview

# Run meeting simulation script
npm run test:meeting

# Run noise cancellation test
npm run test:noise
```

### Automated Tests (Future)
```bash
# Run all automated tests
npm run test:all

# Run transcription accuracy tests
npm run test:transcription

# Run summary quality tests
npm run test:summary
```

## Test Categories

### 1. Interview Simulation
- **Scenario**: Mock technical interview with back-and-forth dialogue
- **Purpose**: Test real-time transcription, speaker separation, and summary extraction
- **Expected**: Accurate capture of technical terms, action items, and calendar candidates

### 2. Meeting Simulation
- **Scenario**: Team standup with multiple speakers
- **Purpose**: Test multi-speaker handling and decision capture
- **Expected**: Clear speaker attribution and accurate action item extraction

### 3. Noise Robustness
- **Scenario**: Meeting with background noise (keyboard typing, notifications)
- **Purpose**: Test audio filtering and transcription accuracy
- **Expected**: Minimal noise interference and clean transcript

### 4. Edge Cases
- **Scenario**: Accidental recording, silence, non-speech audio
- **Purpose**: Test graceful handling and false positive prevention
- **Expected**: No hallucinated content, proper silence handling

### 5. Performance Tests
- **Scenario**: Long meetings (60+ minutes), rapid speech, interruptions
- **Purpose**: Test memory usage, processing latency, and stability
- **Expected**: Consistent performance throughout

## Test Data

All test scripts and audio files should be placed in `/tests/` directory (gitignored).

## Results Tracking

- Test results saved to `/test-results/` (gitignored)
- Include transcription accuracy metrics
- Summary quality assessments
- Performance benchmarks
