# Opus Audio Service - Instructions

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Run the service:
```bash
python main.py
```

The service will start on `http://localhost:8000`

## Testing

Health check:
```bash
curl http://localhost:8000/health
```

## Endpoints

### POST /analyze
Main endpoint for complete audio analysis.

**Request**: multipart/form-data
- `audio`: Audio file (WAV, MP3, etc.)
- `song_title`: String
- `artist`: String

**Response**:
```json
{
  "transcript": "...",
  "audio_features": {
    "tempo_bpm": 120.5,
    "beat_count": 16,
    "rhythm_consistency": 0.95,
    "loudness_variation": 0.6,
    "articulation_score": 0.75,
    "duration_seconds": 45.2,
    "mfcc_features": [...],
    "beat_times": [...]
  },
  "classification": {
    "is_piano": 0.92,
    "is_music": 0.98,
    "confidence": 0.75
  },
  "song_context": {
    "title": "...",
    "artist": "..."
  }
}
```

### POST /extract-features (Debug)
Extract features only without transcription.

### POST /transcribe (Debug)
Transcribe only without feature extraction.

## Deployment

For production on Railway/Render:

1. Ensure `requirements.txt` is in root directory
2. Use Python 3.9+ buildpack
3. Add buildpack to skip PyTorch wheel optimization (or increase build time to 30min+)
4. Set `SERVER_PORT` to the port provided by platform

## Notes

- First run will download models (~3GB total)
- Model loading happens on first request to `/analyze`
- Service gracefully handles missing models
- All temp files are cleaned up after processing

