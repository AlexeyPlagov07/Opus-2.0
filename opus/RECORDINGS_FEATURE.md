# Recording Practice Sessions Feature

This document describes the new feature that saves all recordings as practice sessions that can be accessed through logs and re-analyzed.

## Overview

Previously, recordings were analyzed and displayed immediately but not persisted. Now:

1. **All recordings are saved** to the database with their analysis
2. **Practice sessions are logged** with recording data 
3. **Historical access** - Users can view all past recordings via the "Saved Recordings" panel
4. **Re-analysis available** - Each saved recording can be analyzed again or viewed with its original analysis

## Architecture Changes

### New Database Table

`saved_recordings` table stores:
- Recording audio (as base64-encoded BYTEA)
- Complete AI analysis (as JSONB)
- Duration in seconds
- Creation timestamp
- User ID and Song ID for organization

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for the SQL schema.

### New API Endpoint

`POST/GET /api/recordings`

**GET**: Retrieves all saved recordings for the current user
```bash
curl -X GET http://localhost:3000/api/recordings \
  -H "Authorization: Bearer {idToken}"
```

Response:
```json
{
  "recordings": [
    {
      "id": 1,
      "user_id": "user123",
      "song_id": 42,
      "song_title": "Moonlight Sonata",
      "artist": "Ludwig van Beethoven",
      "analysis": {
        "transcript": "",
        "matches_expected_song": true,
        "mismatch_reason": null,
        "feedback_summary": "Good tempo control...",
        "strengths": ["..."],
        "weaknesses": ["..."],
        "action_items": ["..."]
      },
      "created_at": "2026-10-13T09:42:09Z",
      "duration_seconds": 120
    }
  ]
}
```

**POST**: Downloads audio for a specific recording
```bash
curl -X POST http://localhost:3000/api/recordings \
  -H "Content-Type: application/json" \
  -d '{"idToken": "...", "recordingId": 1}' \
  -o recording.webm
```

### Updated `/api/analyze` Route

When analyzing a recording, the system now:
1. Calls OpenAI Whisper for transcription (existing)
2. Calls OpenAI GPT-4o-mini for feedback (existing)
3. **Encodes the audio as base64**
4. **Saves recording + analysis to the database** (NEW)
5. Returns the analysis + recording ID to the client

Response now includes `recordingId`:
```json
{
  "songId": 42,
  "recordingId": 1,
  "analysis": { ... }
}
```

### New React Hook

`useRecordings()` - Located in [hooks/useRecordings.ts](./hooks/useRecordings.ts)

```typescript
const { recordings, loading, error, refreshRecordings, downloadRecording } = useRecordings();

// Load all recordings for current user
await refreshRecordings(idToken);

// Download audio for playback
const audioBlob = await downloadRecording(idToken, recordingId);
```

### New React Components

#### `RecordingsList` Component
- Located in [components/RecordingsList.tsx](./components/RecordingsList.tsx)
- Displays all saved recordings in an expandable list
- Shows analysis details when expanded
- Includes play button to stream audio
- Sorted by creation date (newest first)

#### Enhanced `RecordingAnalyzer` Component
- Now accepts optional `savedRecording` prop
- Can display saved recording analysis
- Supports playback with audio player
- Maintains all original recording functionality

### Page Updates

Main app page ([app/page.tsx](./app/page.tsx)) now:
- Imports and uses `useRecordings` hook
- Displays `RecordingsList` in the right sidebar
- Shows expandable list of all saved recordings
- Opens modal/overlay when a recording is selected
- Displays full analysis in the modal

## Usage Flow

### Recording and Saving a Session

1. User opens a song card and expands it
2. Clicks "Record" in the RecordingAnalyzer
3. Records themselves playing
4. Clicks "Stop"
5. RecordingAnalyzer sends audio + metadata to `/api/analyze`
6. Server:
   - Runs Whisper transcription
   - Gets GPT feedback
   - Saves audio + analysis to database
   - Returns recordingId + analysis
7. Component refreshes recordings list
8. New recording appears in "Saved Recordings" panel

### Viewing Past Recordings

1. User scrolls to "Saved Recordings" panel on right sidebar
2. Clicks on any recording to expand and see details
3. Clicks "Play" to listen to the recording again
4. Full analysis is displayed alongside audio
5. Can click recording title to open full modal view

### Accessing Analysis Anytime

- All analysis data is persisted with the recording
- No re-processing needed - view analysis instantly
- Audio is streamable for playback
- Can review progress over time by comparing past recordings

## Database Migration

Before using this feature, you must create the `saved_recordings` table:

```bash
# In your Neon console or via psql:
CREATE TABLE saved_recordings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  audio_data BYTEA NOT NULL,
  analysis_json JSONB NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_recordings_user_id ON saved_recordings(user_id);
CREATE INDEX idx_saved_recordings_created_at ON saved_recordings(created_at DESC);
```

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for full details.

## Files Changed

### New Files
- `app/api/recordings/route.ts` - API endpoints for recording retrieval
- `hooks/useRecordings.ts` - React hook for managing recordings
- `components/RecordingsList.tsx` - UI component for displaying saved recordings
- `DATABASE_SCHEMA.md` - Database schema documentation
- `RECORDINGS_FEATURE.md` - This file

### Modified Files
- `lib/types.ts` - Added `SavedRecording` type, updated `AnalyzeRecordingResponse`
- `app/api/analyze/route.ts` - Now saves recordings to database
- `components/RecordingAnalyzer.tsx` - Added support for displaying saved recordings
- `components/SongCard.tsx` - Added `onRecordingSaved` callback
- `app/page.tsx` - Integrated recordings list and modal display

## Technical Details

### Audio Storage
- Audio is stored as base64-encoded BYTEA in PostgreSQL
- This allows storage of any audio format (WebM, MP3, etc.)
- Retrieved as base64 and converted back to blob for playback
- Storage overhead: ~33% larger than raw binary due to base64 encoding

### Analysis Storage
- Analysis stored as JSONB for efficient querying
- Includes all feedback generated by GPT-4o-mini
- Can be indexed and filtered by content if needed in future

### Performance Considerations
- Audio data is NOT retrieved in list queries (only in individual downloads)
- Analysis data IS retrieved for display (it's small, ~1-2 KB each)
- Recordings indexed by user_id and created_at for fast retrieval
- Foreign key to songs table ensures data integrity

## Future Enhancements

Possible additions:
1. Recording comparison - compare two takes side-by-side
2. Progress visualization - charts showing improvement over time
3. Download recordings - export audio files
4. Re-analyze with different parameters
5. Tags/notes - add custom notes to recordings
6. Sharing - share analysis with teachers/mentors
7. Audio editing - trim/crop recordings before analysis
