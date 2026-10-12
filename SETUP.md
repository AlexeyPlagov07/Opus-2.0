# Opus 2.0 - Audio Service & Groq Integration Setup Guide

## Overview

Your Opus app has been updated with:
- **Groq LLM** for music feedback generation (replaces OpenAI GPT)
- **Python Audio Service** for music analysis (Librosa + HF Whisper)
- **MetricsDisplay** React component for showing audio metrics
- **Database schema** for storing analysis results

## Setup Instructions

### Step 1: Get a Groq API Key (5 minutes)

1. Visit https://console.groq.com/keys
2. Sign up with email or Google
3. Copy your API key
4. Add it to `.env` in your opus folder:
   ```
   GROQ_API_KEY=your-key-here
   ```

### Step 2: Install Dependencies (1 hour)

#### For the Next.js App (Opus)
```bash
cd opus
npm install
```

#### For the Python Audio Service
```bash
cd audio-service
pip install -r requirements.txt
```

*Note: First time takes ~30-60 min due to torch installation. Subsequent installs are faster.*

### Step 3: Run Locally (Development)

**Terminal 1 - Python Audio Service:**
```bash
cd audio-service
python main.py
```
Service starts on `http://localhost:8000`

**Terminal 2 - Next.js App:**
```bash
cd opus
npm run dev
```
App starts on `http://localhost:3000`

**Test it:**
1. Go to http://localhost:3000
2. Upload an audio file
3. Check the terminal for logs

### Step 4: Database Migration (2 minutes)

The database schema will be created automatically on first app load. If you want to run it manually:

```bash
cd opus
npx ts-node lib/migrations.ts
```

---

## Deployment to Production

### Option A: Railway (Recommended for Python Service)

**Deploy Audio Service to Railway:**

1. Push code to GitHub
2. Go to https://railway.app
3. Import repo
4. Create new service for `audio-service` folder
5. Add `AUDIO_SERVICE_URL` to Railway env vars

**Update Next.js .env:**
```
AUDIO_SERVICE_URL=https://your-railway-url.railway.app
```

### Option B: Render

Similar to Railway, use Render's free tier for Python service.

### Option C: Vercel (Next.js) + Cloud Run (Python Service)

Deploy Next.js to Vercel as before.
Deploy Python service to Google Cloud Run (free tier available).

---

## API Reference

### Analyze Audio
```
POST /api/analyze
Content-Type: multipart/form-data

Parameters:
- idToken: Firebase auth token
- songId: Database song ID
- audio: Audio file (WAV, MP3, M4A)

Response:
{
  "songId": "...",
  "analysis": {
    "transcript": "...",
    "matches_expected_song": true,
    "feedback_summary": "...",
    "strengths": [...],
    "weaknesses": [...],
    "action_items": [...],
    "audio_metrics": {
      "tempo_bpm": 120.5,
      "rhythm_consistency": 0.95,
      ...
    },
    "classification": {
      "is_piano": 0.92,
      ...
    }
  }
}
```

---

## Troubleshooting

### Audio Service Won't Start
```bash
# Check if port 8000 is in use
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process and try again
```

### Groq API Errors
- Check your API key in `.env`
- Ensure you have free tier quota remaining
- Check https://status.groq.com

### Models Not Downloading
- First request loads models (~3GB)
- Ensure you have 10GB+ free disk space
- Models cache in `~/.cache/huggingface/`

### Database Errors
- Check your DATABASE_URL is correct
- Ensure Neon project is active
- Run migration manually if needed

---

## Next Steps

After setup works:

1. **Configure Groq model**: Try `llama2-70b-4096` vs `mixtral-8x7b-32768` in `route.ts`
2. **Optimize models**: Use smaller Whisper model (e.g., `tiny`, `base`) for faster processing
3. **Add metrics to UI**: Update SongCard to show MetricsDisplay component
4. **Deploy**: Push to GitHub and deploy

---

## File Structure

```
audio-service/
├── main.py                 # FastAPI server
├── requirements.txt        # Python dependencies
├── README.md              # Service documentation
├── Procfile               # Deployment config
└── .env.example           # Environment template

opus/
├── app/api/analyze/route.ts    # Updated with Groq + audio service
├── lib/
│   ├── migrations.ts      # Database schema
│   └── db-init.ts         # Auto-init helper
├── components/
│   └── MetricsDisplay.tsx # Audio metrics UI
└── .env                   # Add GROQ_API_KEY here
```

---

## Cost Breakdown (Monthly)

- **Groq**: FREE (generous free tier)
- **Audio Service**: FREE to ~$5/mo (depending on hosting)
- **Whisper (HF)**: FREE (self-hosted)
- **Database**: FREE to $15/mo (Neon free tier)
- **Vercel**: FREE to $20/mo (depending on usage)

**Total**: ~$5-30/mo (compared to ~$100+/mo with OpenAI)

---

## Support

If you encounter issues:

1. Check logs in both terminals
2. Verify all `.env` variables are set
3. Try the `/health` endpoint: `curl http://localhost:8000/health`
4. Check GitHub issues for similar problems
5. Review Groq/HF documentation

Good luck! 🎵
