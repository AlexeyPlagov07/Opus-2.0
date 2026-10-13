# Testing Guide: Recording Persistence Feature

This guide walks through testing all aspects of the recording persistence feature.

## Prerequisites

- Application built successfully (`npm run build` completes with no errors)
- Development server running (`npm run dev`)
- Logged in as a test user
- At least one song added to your library

## Quick Start Test (5 minutes)

### 1. Make a Recording

1. Navigate to the main page at `http://localhost:3000`
2. Ensure you're logged in
3. Find a song in your library (add one if needed)
4. Click **"Record"** button
5. Record audio for 3+ seconds (speak, sing, or play music)
6. Click **"Stop"**
7. Wait 2-3 seconds for analysis to complete
8. Look for "Saved Recordings" panel on the right sidebar

### 2. Verify Recording Saved

✅ **Expected**:
- Recording appears in "Saved Recordings" list
- Shows song title and artist
- Shows recording timestamp
- Shows duration in minutes

❌ **If not appearing**:
- Check browser console for errors (F12 → Console)
- Look for 401/404/500 errors
- Check server logs for database errors
- See Troubleshooting section below

### 3. View Recording Details

1. Click on the saved recording in the list
2. Recording should expand to show:
   - ✅ Feedback summary
   - ✅ Strengths (bulleted list)
   - ✅ Weaknesses (bulleted list)
   - ✅ Action items (bulleted list)
   - ✅ Play button

### 4. Play Back Recording

1. Click **"Play"** button in expanded recording
2. Audio player should appear
3. Click play icon to hear the recording
4. Audio should play through your speakers

## Comprehensive Test Suite

### Test 1: Basic Recording Save

**Objective**: Verify recording is saved after analysis

**Steps**:
1. Make a new recording
2. Wait for analysis
3. Check "Saved Recordings" appears
4. Query database:
   ```sql
   SELECT COUNT(*) FROM saved_recordings;
   ```
5. Count should increase by 1

**Expected Result**: ✅ Recording saved in database

---

### Test 2: Multiple Recordings Per Song

**Objective**: Verify multiple recordings for same song are all saved

**Steps**:
1. Pick one song
2. Make Recording #1
3. Wait for analysis, verify it appears
4. Make Recording #2 with the same song
5. Wait for analysis, verify it appears
6. Check sidebar shows both recordings
7. Query database:
   ```sql
   SELECT COUNT(*) FROM saved_recordings WHERE song_id = X;
   ```
   (Replace X with your song ID)

**Expected Result**: ✅ Both recordings appear and are distinct

---

### Test 3: Audio Playback

**Objective**: Verify saved audio can be played back

**Steps**:
1. Make a recording
2. Click on it to expand
3. Click "Play" button
4. Audio player appears
5. Click play icon
6. Listen to audio

**Expected Result**: ✅ Audio plays correctly

---

### Test 4: Analysis Display

**Objective**: Verify all analysis data displays correctly

**Steps**:
1. Make a recording
2. Expand recording in sidebar
3. Verify you see:
   - Feedback summary (text)
   - Strengths (at least 1)
   - Weaknesses (at least 1)
   - Action items (at least 1)

**Expected Result**: ✅ All analysis fields visible and populated

---

### Test 5: Data Persistence

**Objective**: Verify recordings persist after page refresh

**Steps**:
1. Make a recording
2. Verify it appears in sidebar
3. Press F5 to refresh page
4. Wait for page to load
5. Check if recording is still there

**Expected Result**: ✅ Recording still visible after refresh

---

### Test 6: User Isolation

**Objective**: Verify users only see their own recordings

**Steps**:
1. Make a recording as User A
2. Sign out
3. Sign in as User B (or create new account)
4. Check "Saved Recordings" panel

**Expected Result**: ✅ User B sees empty or different recordings

---

### Test 7: Recording List Sorting

**Objective**: Verify recordings are sorted by newest first

**Steps**:
1. Make Recording #1 (record the timestamp)
2. Wait a few seconds
3. Make Recording #2
4. Check sidebar - Recording #2 should be at top
5. Make Recording #3
6. Check sidebar - Recording #3 should be at top

**Expected Result**: ✅ Newest recordings appear first

---

### Test 8: Database Auto-Initialization

**Objective**: Verify database table is auto-created

**Steps**:
1. Delete the `saved_recordings` table from database (for testing):
   ```sql
   DROP TABLE IF EXISTS saved_recordings;
   ```
2. Refresh the app
3. Make a recording
4. Wait for analysis
5. Check database:
   ```sql
   SELECT * FROM saved_recordings LIMIT 1;
   ```

**Expected Result**: ✅ Table auto-created and recording saved

---

### Test 9: Manual Database Initialization

**Objective**: Verify `/api/init-db` endpoint works

**Steps**:
1. Drop the table again:
   ```sql
   DROP TABLE IF EXISTS saved_recordings;
   ```
2. Run: `curl -X POST http://localhost:3000/api/init-db`
3. Check response shows success:
   ```json
   {"message": "Database initialized successfully"}
   ```
4. Verify table exists:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'saved_recordings';
   ```

**Expected Result**: ✅ Endpoint creates table successfully

---

### Test 10: Error Handling

**Objective**: Verify proper error handling

**Steps**:
1. Make a recording
2. Before analysis completes, switch to a different song
3. Record again
4. Wait for both analyses
5. Check sidebar

**Expected Result**: ✅ Both recordings saved, no errors

---

## Database Verification Queries

Run these SQL queries to verify data:

```sql
-- Verify table exists and has correct structure
\d saved_recordings

-- Count total recordings
SELECT COUNT(*) FROM saved_recordings;

-- Count recordings per song
SELECT s.song_title, COUNT(*) 
FROM saved_recordings sr
JOIN songs s ON s.id = sr.song_id
GROUP BY s.song_title;

-- View recent recordings
SELECT sr.id, s.song_title, sr.duration_seconds, sr.created_at
FROM saved_recordings sr
JOIN songs s ON s.id = sr.song_id
ORDER BY sr.created_at DESC
LIMIT 10;

-- Check audio data size
SELECT 
  sr.id,
  s.song_title,
  pg_size_pretty(octet_length(sr.audio_data)) as audio_size,
  sr.created_at
FROM saved_recordings sr
JOIN songs s ON s.id = sr.song_id
ORDER BY sr.created_at DESC;

-- Verify analysis JSON structure
SELECT sr.id, s.song_title, sr.analysis_json
FROM saved_recordings sr
JOIN songs s ON s.id = sr.song_id
LIMIT 1;
```

## Performance Testing

### Load Testing

```sql
-- Create dummy recordings for stress testing
INSERT INTO saved_recordings (user_id, song_id, audio_data, analysis_json, duration_seconds)
SELECT 
  'test-user-123',
  s.id,
  'dummy_audio_data_base64'::bytea,
  '{"feedback_summary":"Test","strengths":[],"weaknesses":[],"action_items":[]}'::jsonb,
  60
FROM songs s
LIMIT 100;  -- Creates 100 test recordings
```

Then test:
- List recordings - should load instantly
- Playback - should be quick
- Analysis display - should be fast

### Storage Monitoring

```sql
-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('saved_recordings'));

-- Check growth rate
SELECT 
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('saved_recordings')) as total_size,
  pg_size_pretty(pg_total_relation_size('saved_recordings') / NULLIF(COUNT(*), 0)) as avg_per_recording
FROM saved_recordings;
```

## Browser Testing

### Chrome/Chromium
- ✅ WebM audio support
- ✅ Audio player
- ✅ Database features
- ✅ Performance

### Firefox
- ✅ WebM audio support
- ✅ Audio player
- ✅ Database features
- ✅ Performance

### Safari
- ⚠️ WebM support may vary
- ✅ Other features should work
- ⚠️ Audio playback may require codec conversions

### Edge
- ✅ WebM audio support
- ✅ Audio player
- ✅ Database features
- ✅ Performance

## Troubleshooting

### Recording Doesn't Appear in List

**Symptoms**: Recording completes analysis but doesn't show in "Saved Recordings"

**Debugging**:
1. Check browser console for errors
2. Run: `SELECT COUNT(*) FROM saved_recordings;` - any new records?
3. Check server logs for exceptions
4. Try refreshing the page
5. Check user_id in database matches logged-in user

**Solutions**:
- Refresh the page
- Clear browser cache and reload
- Check that you're signed in properly
- Restart the server

### Audio Won't Play

**Symptoms**: Play button doesn't work or audio doesn't play

**Debugging**:
1. Check browser console for fetch errors
2. Verify audio file was stored: `SELECT audio_data FROM saved_recordings LIMIT 1;`
3. Check browser WebM support
4. Try different browser

**Solutions**:
- Try Chrome/Firefox
- Refresh the page
- Restart the server
- Re-record and try again

### 401 Unauthorized Error

**Symptoms**: API returns 401 error

**Debugging**:
1. Check authentication token is valid
2. Verify user is logged in
3. Check browser dev tools → Network → /api/recordings request
4. Look at Authorization header

**Solutions**:
- Sign out and sign back in
- Refresh the page
- Clear browser cookies
- Check Firebase configuration

### Database Table Doesn't Exist

**Symptoms**: Error messages about "relation does not exist"

**Debugging**:
1. Query: `SELECT * FROM information_schema.tables WHERE table_name = 'saved_recordings';`
2. If empty, table doesn't exist
3. Try making a recording to trigger auto-creation
4. Or manually run init: `curl -X POST http://localhost:3000/api/init-db`

**Solutions**:
- Make a recording to trigger auto-creation
- Manually initialize: `curl -X POST http://localhost:3000/api/init-db`
- Run CREATE TABLE SQL manually

## Performance Benchmarks

Target metrics (should be achieved):

| Operation | Target | Notes |
|-----------|--------|-------|
| List recordings | <100ms | With indexes |
| Download audio | <500ms | Depends on file size |
| Playback start | <200ms | After download |
| Save new recording | 2-3s | Includes AI analysis |
| Page load with list | <1s | Includes all recordings |

## Sign-Off Checklist

After testing, verify:

- [ ] Build completes with no errors
- [ ] Dev server starts without errors
- [ ] Can make a recording
- [ ] Recording appears in sidebar
- [ ] Can expand recording
- [ ] Analysis displays correctly
- [ ] Can play back audio
- [ ] Recordings persist after refresh
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] Database queries return expected results
- [ ] Multiple recordings work
- [ ] Different users see different recordings

---

**Ready to Deploy**: Once all checks pass ✅

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for production deployment instructions.
