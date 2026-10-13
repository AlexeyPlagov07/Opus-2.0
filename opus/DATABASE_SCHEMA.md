# Database Schema for Saved Recordings

The saved recordings feature automatically creates its database table on first use. However, you can manually initialize it using one of the methods below.

## Method 1: Automatic Initialization (Recommended)

The application will automatically create the `saved_recordings` table when:
1. A user makes their first recording and it gets analyzed
2. A user tries to view their saved recordings

No manual setup is required - just start using the app!

## Method 2: Manual Setup with API Endpoint

Make a POST request to initialize the database:

```bash
curl -X POST http://localhost:3000/api/init-db
```

Response on success:
```json
{
  "message": "Database initialized successfully"
}
```

## Method 3: Direct SQL in Neon Console

If you prefer to manually create the table, run this SQL in your Neon database console:

```sql
CREATE TABLE IF NOT EXISTS saved_recordings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  song_id UUID NOT NULL,
  audio_data BYTEA NOT NULL,
  analysis_json JSONB NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_recordings_user_id ON saved_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recordings_created_at ON saved_recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_recordings_song_user ON saved_recordings(song_id, user_id);
```

## Table Structure

- **Audio Storage**: The `audio_data` column stores the recording as a base64-encoded string (BYTEA type)
- **Analysis Storage**: The `analysis_json` column stores the AI-generated analysis including:
  - Transcript
  - Whether the recording matches the expected song
  - Feedback summary
  - Strengths
  - Weaknesses  
  - Action items
- **Quick Access**: Indexed by `user_id` and `created_at` for fast retrieval
- **Duration Tracking**: Stores the recording duration for quick display in UI

## How it works

1. When a user records a new take, it's analyzed by OpenAI
2. The recording (audio blob + analysis) is saved to the database
3. Users can view all their saved recordings in the "Saved Recordings" panel
4. Clicking on a saved recording shows the full analysis
5. The recording can be played back directly in the UI
6. Recordings persist indefinitely and can be reviewed anytime

## Example query

```sql
-- Get all recordings for a user
SELECT 
  sr.id,
  sr.song_id,
  s.song_title,
  s.artist,
  sr.analysis_json,
  sr.created_at,
  sr.duration_seconds
FROM saved_recordings sr
JOIN songs s ON s.id = sr.song_id
WHERE sr.user_id = 'user123'
ORDER BY sr.created_at DESC;
```
