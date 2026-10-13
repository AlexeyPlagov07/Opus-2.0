# Quick Start - Recording Practice Sessions Feature

Get up and running in 2 minutes - no manual setup required!

## Prerequisites ✓

- Opus application already set up and running
- Neon PostgreSQL database access
- Application built with the recording feature

## Step 1: Start Dev Server (30 seconds)

```bash
cd opus
npm run dev
```

Visit: http://localhost:3000

**The database table will be created automatically on first use!**

## Step 2: Test the Feature (90 seconds)

1. Sign in (or create an account)
2. Add a song (if you don't have any)
3. Click on the song to expand it
4. Click **"Record"** button
5. Speak or play something for 3+ seconds
6. Click **"Stop"**
7. Wait for analysis (~2-3 seconds)
8. Check the right sidebar for **"Saved Recordings"** section
9. Click on your recording to see the details
10. Click **"Play"** to hear your recording

## What You'll See

### Recording Appears In List
```
Song Title
Artist Name
Duration: 2 min
[Expand to see details]
```

### When Expanded
```
✓ Feedback Summary
  "Good tempo consistency, work on dynamics..."

✓ Strengths
  • Accurate rhythm
  • Clear articulation

✓ Weaknesses
  • Volume inconsistency
  • Need to work on pacing

✓ Action Items
  • Practice with a metronome
  • Record weekly to track progress

[Play] Audio Player
```

## Manual Setup (Optional)

If you want to initialize the database before making your first recording:

### Option 1: Use API Endpoint

```bash
curl -X POST http://localhost:3000/api/init-db
```

### Option 2: Run SQL Manually in Neon Console

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
```

## Verify It's Working ✓

Run this SQL to confirm recordings are saved:

```sql
SELECT COUNT(*) FROM saved_recordings;
```

Should return: `1` (or however many recordings you made)

## Troubleshooting

### "Table doesn't exist" Error
- This should not happen - table is auto-created
- If it does: run the manual setup SQL above
- Or make a recording to trigger auto-creation

### Recording doesn't appear after analysis
- Check browser console (F12) for errors
- Look at server logs for any issues
- Verify you're signed in (check auth)

### Audio won't play
- Ensure browser supports WebM format
- Check for CORS errors in console
- Try refreshing the page

### Nothing shows in "Saved Recordings"
- Did recording analysis complete? (look for "Complete" status)
- Check database: `SELECT COUNT(*) FROM saved_recordings;`
- Verify user_id matches: `SELECT user_id FROM saved_recordings;`

## Next Steps

1. **Test thoroughly** - Make several recordings to test the flow
2. **Read full docs** - Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) for details
3. **Explore features** - Try expanding different recordings
4. **Monitor performance** - Watch how the app feels with multiple recordings
5. **Gather feedback** - Let users test and provide feedback

## Key Features

🎯 **Automatic Saving**
Every recording is automatically saved with full AI analysis

📚 **Complete History**
Access all past recordings anytime from the sidebar

🎵 **Built-in Playback**
Listen to your recordings directly in the app without downloading

📊 **Full Analysis Display**
See feedback, strengths, weaknesses, and action items

✨ **Progress Tracking**
Compare multiple recordings to see improvement over time

## Common Use Cases

### Review Past Feedback
1. Open "Saved Recordings" panel
2. Click on a recording from last week
3. Read the feedback again
4. See what improvements have been made

### Track Progress
1. Make multiple recordings of the same piece
2. Compare analysis from different dates
3. Notice what areas are improving
4. Focus practice on remaining weak areas

### Share with Others
1. Open a recording
2. Share the analysis (future enhancement - coming soon!)
3. Discuss feedback with teacher or practice partner

### Build Practice Journal
- Every recording becomes part of your practice history
- Can look back months later to see progress
- Motivating to see improvements over time

## Performance Tips

- Recordings are indexed by user and date for fast access
- Audio isn't downloaded until you click Play
- Analysis loads instantly (stored in memory)
- Can handle hundreds of recordings without slowdown

## Storage Information

```
Per recording:
- Audio: 1-2 MB (1 minute of practice)
- Analysis: 1-2 KB (feedback data)
- Total per recording: ~1-2 MB

Examples:
- 100 recordings: ~100-200 MB
- 1000 recordings: ~1-2 GB
- 10000 recordings: ~10-20 GB
```

## Important Notes

⚠️ **Recordings are permanent** - Once saved, they remain in the database indefinitely

🔒 **Only you can see your recordings** - User isolation enforced at API and database level

📱 **Works on all browsers** - Chrome, Firefox, Safari, Edge (WebM support required)

🌍 **No internet required** - Audio is stored locally first, then sent to API

## Questions?

- **Setup issues?** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Technical details?** See [RECORDINGS_FEATURE.md](./RECORDINGS_FEATURE.md)
- **Database schema?** See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

---

**That's it! You're ready to use Recording Practice Sessions!** 🎉

1. Sign in (or create an account)
2. Add a song (if you don't have any)
3. Click on the song to expand it
4. Click **"Record"** button
5. Speak or play something for 3+ seconds
6. Click **"Stop"**
7. Wait for analysis (~2-3 seconds)
8. Check the right sidebar for **"Saved Recordings"** section
9. Click on your recording to see the details
10. Click **"Play"** to hear your recording

## What You'll See

### Recording Appears In List
```
Song Title
Artist Name
Duration: 2 min
[Expand to see details]
```

### When Expanded
```
✓ Feedback Summary
  "Good tempo consistency, work on dynamics..."

✓ Strengths
  • Accurate rhythm
  • Clear articulation

✓ Weaknesses
  • Volume inconsistency
  • Need to work on pacing

✓ Action Items
  • Practice with a metronome
  • Record weekly to track progress

[Play] Audio Player
```

## Verify It's Working ✓

Run this SQL to confirm recordings are saved:

```sql
SELECT COUNT(*) FROM saved_recordings;
```

Should return: `1` (or however many recordings you made)

## Troubleshooting

### "Table doesn't exist" Error
- Verify you ran the CREATE TABLE SQL
- Check that it completed without errors
- Try querying: `SELECT * FROM saved_recordings LIMIT 1;`

### Recording doesn't appear after analysis
- Check browser console (F12) for errors
- Look at server logs for any issues
- Verify you're signed in (check auth)

### Audio won't play
- Ensure browser supports WebM format
- Check for CORS errors in console
- Try refreshing the page

### Nothing shows in "Saved Recordings"
- Did recording analysis complete? (look for "Complete" status)
- Check database: `SELECT COUNT(*) FROM saved_recordings;`
- Verify user_id matches: `SELECT user_id FROM saved_recordings;`

## Next Steps

1. **Test thoroughly** - Make several recordings to test the flow
2. **Read full docs** - Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) for details
3. **Explore features** - Try expanding different recordings
4. **Monitor performance** - Watch how the app feels with multiple recordings
5. **Gather feedback** - Let users test and provide feedback

## Key Features

🎯 **Automatic Saving**
Every recording is automatically saved with full AI analysis

📚 **Complete History**
Access all past recordings anytime from the sidebar

🎵 **Built-in Playback**
Listen to your recordings directly in the app without downloading

📊 **Full Analysis Display**
See feedback, strengths, weaknesses, and action items

✨ **Progress Tracking**
Compare multiple recordings to see improvement over time

## Common Use Cases

### Review Past Feedback
1. Open "Saved Recordings" panel
2. Click on a recording from last week
3. Read the feedback again
4. See what improvements have been made

### Track Progress
1. Make multiple recordings of the same piece
2. Compare analysis from different dates
3. Notice what areas are improving
4. Focus practice on remaining weak areas

### Share with Others
1. Open a recording
2. Share the analysis (future enhancement - coming soon!)
3. Discuss feedback with teacher or practice partner

### Build Practice Journal
- Every recording becomes part of your practice history
- Can look back months later to see progress
- Motivating to see improvements over time

## Performance Tips

- Recordings are indexed by user and date for fast access
- Audio isn't downloaded until you click Play
- Analysis loads instantly (stored in memory)
- Can handle hundreds of recordings without slowdown

## Storage Information

```
Per recording:
- Audio: 1-2 MB (1 minute of practice)
- Analysis: 1-2 KB (feedback data)
- Total per recording: ~1-2 MB

Examples:
- 100 recordings: ~100-200 MB
- 1000 recordings: ~1-2 GB
- 10000 recordings: ~10-20 GB
```

## Important Notes

⚠️ **Recordings are permanent** - Once saved, they remain in the database indefinitely

🔒 **Only you can see your recordings** - User isolation enforced at API and database level

📱 **Works on all browsers** - Chrome, Firefox, Safari, Edge (WebM support required)

🌍 **No internet required** - Audio is stored locally first, then sent to API

## Questions?

- **Setup issues?** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Technical details?** See [RECORDINGS_FEATURE.md](./RECORDINGS_FEATURE.md)
- **Database schema?** See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

---

**That's it! You're ready to use Recording Practice Sessions!** 🎉
