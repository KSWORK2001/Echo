# Test Automation Runner

## Purpose
Automated test execution and results collection for Echo meeting transcription and summarization features.

## Usage

```bash
# Run all tests
npm run test:all

# Run specific test category
npm run test:interview
npm run test:meeting
npm run test:noise
npm run test:edge-cases
npm run test:performance

# Generate test report
npm run test:report
```

## Test Categories

### 1. Interview Tests
- **Script**: `tests/scripts/technical-interview.md`
- **Purpose**: Test technical term accuracy and speaker separation
- **Validation**: Check transcription accuracy, summary completeness
- **Expected Duration**: 8 minutes

### 2. Meeting Tests
- **Script**: `tests/scripts/team-standup.md`
- **Purpose**: Test multi-speaker handling and action item extraction
- **Validation**: Speaker identification, action item completeness
- **Expected Duration**: 12 minutes

### 3. Noise Robustness Tests
- **Script**: `tests/scripts/noise-robustness.md`
- **Purpose**: Test background noise filtering
- **Validation**: Signal-to-noise ratio, false positive rate
- **Expected Duration**: 5 minutes

### 4. Edge Cases Tests
- **Script**: `tests/scripts/edge-cases.md`
- **Purpose**: Test silence, non-speech audio, interruptions
- **Validation**: Edge case handling, boundary detection
- **Expected Duration**: 6 minutes

### 5. Performance Tests
- **Script**: `tests/scripts/performance-test.md`
- **Purpose**: Test long-duration performance and memory usage
- **Validation**: System stability, processing latency
- **Expected Duration**: 15 minutes

## Test Results

Results are saved to `test-results/` directory with timestamps:
- `transcription-accuracy.json` - Word error rate, technical term accuracy
- `summary-quality.json` - Completeness, action item extraction
- `performance-metrics.json` - Memory usage, processing time
- `speaker-separation.json` - Speaker identification accuracy

## Success Criteria

### Transcription Accuracy
- Word Error Rate (WER) < 15%
- Technical term accuracy > 90%
- Speaker separation accuracy > 85%

### Summary Quality
- All required sections present
- Action items with owners/dates > 80% completeness
- Calendar candidates identified > 70% accuracy

### Performance
- Memory usage < 500MB for 15-minute sessions
- Summary generation < 30 seconds
- No crashes or hangs during tests

### Edge Cases
- False positive rate < 5% (noise transcribed as speech)
- False negative rate < 10% (speech not detected)
- Graceful handling of silence and non-speech audio
