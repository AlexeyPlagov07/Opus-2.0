# Setup Guide: Recording Practice Sessions Feature

This guide walks you through setting up the new recording persistence feature in Opus.

## Prerequisites

- Opus application running with existing database setup
- Access to your Neon PostgreSQL database (for monitoring, not required for setup)
- Node.js and npm installed

## Quick Setup (Auto-Initialization)

The application will **automatically create the database table** on first use! No manual setup required.

### For Development:

```bash
cd opus
npm install
npm run dev
```

Visit `http://localhost:3000` and start recording. The table will be created automatically!

## Manual Database Initialization (Optional)

If you prefer to initialize the database before making your first recording:

### Option 1: Via API Endpoint

```bash
curl -X POST http://localhost:3000/api/init-db
```

Response:
```json
{
  "message": "Database initialized successfully"
}
```

### Option 2: Via Neon Web Console

1. Go to your Neon Project Dashboard
2. Open the SQL Editor
3. Copy and paste the following SQL:

```sql
CREATE TABLE IF NOT EXISTS saved_recordings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  song_id INTEGER NOT NULL,
  audio_data BYTEA NOT NULL,
  analysis_json JSONB NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_recordings_user_id ON saved_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recordings_created_at ON saved_recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_recordings_song_user ON saved_recordings(song_id, user_id);
```

4. Run the query
5. Verify the table was created by querying:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'saved_recordings';
   ```

### Option 3: Via Command Line

If you have `psql` installed:

```bash
psql $DATABASE_URL -c "
CREATE TABLE IF NOT EXISTS saved_recordings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  song_id INTEGER NOT NULL,
  audio_data BYTEA NOT NULL,
  analysis_json JSONB NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_recordings_user_id ON saved_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recordings_created_at ON saved_recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_recordings_song_user ON saved_recordings(song_id, user_id);
"
```

## Step 1: Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in.

## Step 2: Test the Feature

1. **Add a song** to practice
2. **Expand the song card** by clicking on it
3. **Click "Record"** and record yourself playing
4. **Click "Stop"** to finish recording
5. **Wait for analysis** to complete (the database table will be auto-created here)
6. **Check the "Saved Recordings" panel** on the right side
7. **Click on your saved recording** to view:
   - Full analysis with feedback
   - Strengths and weaknesses
   - Action items
   - Recording timestamp and duration
8. **Click "Play"** button to listen to the recording again

## Step 3: Verify Data Persistence

To confirm recordings are being saved to the database:

```sql
-- Check how many recordings you have
SELECT COUNT(*) FROM saved_recordings;

-- View your recordings with their analysis
SELECT 
  sr.id,
  sr.song_id,
  s.song_title,
  sr.duration_seconds,
  sr.created_at,
  sr.analysis_json
FROM saved_recordings sr
JOIN songs s ON s.id = sr.song_id
ORDER BY sr.created_at DESC;
```

## File Structure

New files created:
```
opus/
├── app/api/recordings/route.ts          # API endpoints for retrieving recordings
├── components/RecordingsList.tsx        # UI component for displaying saved recordings
├── hooks/useRecordings.ts               # React hook for managing recordings state
├── DATABASE_SCHEMA.md                   # Detailed schema documentation
├── RECORDINGS_FEATURE.md                # Feature overview and technical details
└── SETUP_GUIDE.md                       # This file
```

Modified files:
```
opus/
├── lib/types.ts                         # Added SavedRecording type
├── app/api/analyze/route.ts             # Now saves recordings to database
├── components/RecordingAnalyzer.tsx     # Added support for displaying saved recordings
├── components/SongCard.tsx              # Added recording saved callback
└── app/page.tsx                         # Integrated recordings list
```

## Troubleshooting

### "Table does not exist" Error

**Problem**: Getting "relation 'saved_recordings' does not exist" error when recording

**Solution**: 
1. Verify the table was created:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'saved_recordings';
   ```
2. If it doesn't exist, run the CREATE TABLE SQL from Step 1

### Build Fails with TypeScript Errors

**Problem**: `npm run build` fails with type errors

**Possible Solutions**:
1. Ensure all files were properly edited
2. Run `npm install` to update dependencies
3. Delete `.next` folder and rebuild: `rm -rf .next && npm run build`

### Recordings Don't Appear After Recording

**Problem**: Recording analysis completes but recording doesn't appear in the list

**Possible Solutions**:
1. Check browser console for errors (F12 → Console tab)
2. Verify database connection is working with a test query
3. Check that user is properly authenticated
4. Look for API errors in server logs

### Audio Won't Play Back

**Problem**: Saved recording appears in list but audio player doesn't work

**Possible Solutions**:
1. Check browser console for CORS or fetch errors
2. Verify audio file size isn't too large
3. Check that browser supports WebM audio format
4. Try downloading the recording directly via the recordings API

### Slow Performance with Many Recordings

**Problem**: App becomes slow after saving many recordings

**Possible Solutions**:
1. Confirm indexes were created:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'saved_recordings';
   ```
2. Consider pagination for the recordings list (future enhancement)
3. Monitor database query performance with `EXPLAIN ANALYZE`

## Next Steps

After successful setup:

1. **Test thoroughly** - Record several takes and verify they all appear and can be played back
2. **Review analysis** - Verify that AI feedback is accurate and helpful
3. **Check storage** - Monitor database size growth as recordings accumulate
4. **Gather feedback** - Let users test and share improvement ideas

## Expected Behavior

✅ **Working Correctly**:
- New recordings appear in "Saved Recordings" panel immediately after analysis
- Clicking on a recording shows full analysis details
- Play button works and audio can be heard
- Multiple recordings for same song are all preserved
- Recordings persist after page refresh
- Old recordings can be viewed anytime

❌ **Issues to Investigate**:
- Recording created but doesn't appear in list
- Error messages in browser console
- Analysis JSON looks malformed
- Audio download fails or returns wrong data

## Monitoring Queries

Run these SQL queries to monitor the feature:

```sql
-- Total recordings per user (for the first user)
SELECT user_id, COUNT(*) as recording_count
FROM saved_recordings
GROUP BY user_id
ORDER BY recording_count DESC;

-- Average recording duration
SELECT AVG(duration_seconds) as avg_duration_seconds
FROM saved_recordings;

-- Database size used by recordings table
SELECT pg_size_pretty(pg_total_relation_size('saved_recordings')) as size;

-- Recent recordings
SELECT sr.id, sr.song_id, s.song_title, sr.created_at
FROM saved_recordings sr
JOIN songs s ON s.id = sr.song_id
ORDER BY sr.created_at DESC
LIMIT 10;
```

## Support

For issues or questions:
1. Check the [RECORDINGS_FEATURE.md](./RECORDINGS_FEATURE.md) for technical details
2. Review [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for schema documentation
3. Examine server logs for error messages
4. Check browser developer console (F12) for client-side errors
