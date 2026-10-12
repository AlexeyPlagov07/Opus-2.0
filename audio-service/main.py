"""
Audio Analysis Service for Opus Music Practice App
Handles transcription, tempo detection, and music classification
"""

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import librosa
import soundfile as sf
import numpy as np
import os
import tempfile
import logging
from typing import Optional
import json

# Audio processing imports
from transformers import pipeline, AutoProcessor, AutoModelForCTC
import torch

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Opus Audio Service", version="1.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "https://opus-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models (will be loaded on first request)
transcriber = None
music_classifier = None

def load_models():
    """Load Hugging Face models on first request"""
    global transcriber, music_classifier
    
    if transcriber is None:
        logger.info("Loading Whisper model...")
        try:
            transcriber = pipeline(
                "automatic-speech-recognition",
                model="openai/whisper-base",
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading Whisper: {e}")
    
    if music_classifier is None:
        logger.info("Loading music classification model...")
        try:
            music_classifier = pipeline(
                "audio-classification",
                model="facebook/wav2vec2-large-xlsr-53-english",
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info("Music classifier loaded successfully")
        except Exception as e:
            logger.error(f"Error loading music classifier: {e}")
            music_classifier = None  # Fall back gracefully


def extract_audio_features(audio_path: str) -> dict:
    """
    Extract audio features using librosa:
    - Tempo (BPM)
    - Beat frames and times
    - Dynamic range
    - Zero crossing rate (for silence detection)
    """
    try:
        logger.info(f"Extracting features from {audio_path}")
        
        # Load audio file
        y, sr = librosa.load(audio_path, sr=22050)
        
        # Tempo detection
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, beats = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        
        # Get beat frames in seconds
        beat_times = librosa.frames_to_time(beats, sr=sr)
        
        # Calculate beat interval consistency (rhythm stability)
        if len(beat_times) > 1:
            beat_intervals = np.diff(beat_times)
            mean_interval = np.mean(beat_intervals)
            std_interval = np.std(beat_intervals)
            rhythm_consistency = 1.0 - min(std_interval / mean_interval, 1.0) if mean_interval > 0 else 0.5
        else:
            rhythm_consistency = 0.5
        
        # Dynamic range (loudness variation)
        S = librosa.feature.melspectrogram(y=y, sr=sr)
        S_db = librosa.power_to_db(S, ref=np.max)
        loudness = np.mean(S_db, axis=0)
        loudness_std = np.std(loudness)
        
        # Zero crossing rate (articulation proxy)
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        mean_zcr = np.mean(zcr)
        
        # Audio duration
        duration = librosa.get_duration(y=y, sr=sr)
        
        # MFCC for timbre (first 13 coefficients)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1).tolist()
        
        features = {
            "tempo_bpm": float(tempo),
            "beat_count": len(beats),
            "rhythm_consistency": float(min(max(rhythm_consistency, 0.0), 1.0)),
            "loudness_variation": float(min(loudness_std / 20.0, 1.0)),  # Normalize
            "articulation_score": float(min(mean_zcr * 2, 1.0)),  # Normalize
            "duration_seconds": float(duration),
            "mfcc_features": mfcc_mean,
            "beat_times": beat_times.tolist()[:20]  # First 20 beats for UI display
        }
        
        logger.info(f"Features extracted successfully: tempo={features['tempo_bpm']} BPM")
        return features
        
    except Exception as e:
        logger.error(f"Error extracting features: {e}")
        return {
            "tempo_bpm": 0.0,
            "beat_count": 0,
            "rhythm_consistency": 0.5,
            "loudness_variation": 0.5,
            "articulation_score": 0.5,
            "duration_seconds": 0.0,
            "mfcc_features": [0.0] * 13,
            "beat_times": []
        }


def transcribe_audio(audio_path: str) -> str:
    """Transcribe audio using Hugging Face Whisper"""
    try:
        global transcriber
        
        if transcriber is None:
            return ""
        
        logger.info("Starting transcription...")
        result = transcriber(audio_path, chunk_length_s=30, stride_length_s=(4, 2))
        transcript = result.get("text", "").strip()
        logger.info(f"Transcription complete: {len(transcript)} characters")
        
        return transcript
        
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return ""


def classify_audio(audio_path: str) -> dict:
    """
    Classify audio type and confidence
    Returns instrument detection and confidence scores
    """
    try:
        global music_classifier
        
        if music_classifier is None:
            return {
                "is_piano": 0.5,
                "is_music": 0.5,
                "confidence": 0.0
            }
        
        logger.info("Classifying audio...")
        
        # For now, use a simple heuristic based on audio features
        # In production, would use actual audio classification model
        y, sr = librosa.load(audio_path, sr=22050)
        
        # Piano characteristics: relatively steady tempo, harmonic content
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        
        # Heuristic: piano typically 40-200 BPM
        is_reasonable_tempo = 40 < tempo < 200
        
        # Check for harmonic content (piano should have substantial harmonic content)
        S = librosa.feature.melspectrogram(y=y, sr=sr)
        S_db = librosa.power_to_db(S, ref=np.max)
        harmonic_content = np.mean(S_db[20:, :])  # Higher frequencies for harmonics
        
        is_piano = float(is_reasonable_tempo and harmonic_content > -40)
        
        classification = {
            "is_piano": min(max(is_piano, 0.0), 1.0),
            "is_music": 0.9,  # Assume it's music
            "confidence": min(max(abs(harmonic_content) / 50, 0.0), 1.0)
        }
        
        logger.info(f"Classification: piano confidence={classification['is_piano']}")
        return classification
        
    except Exception as e:
        logger.error(f"Classification error: {e}")
        return {
            "is_piano": 0.5,
            "is_music": 0.5,
            "confidence": 0.0
        }


@app.on_event("startup")
async def startup_event():
    """Load models on application startup"""
    logger.info("Application starting up...")
    load_models()
    logger.info("Application startup complete")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Opus Audio Analysis Service",
        "version": "1.0.0"
    }


@app.post("/analyze")
async def analyze_audio(
    audio: UploadFile = File(...),
    song_title: str = Form(...),
    artist: str = Form(...)
):
    """
    Main endpoint: Analyze uploaded audio file
    
    Returns:
    - transcript: Speech-to-text output
    - audio_features: Tempo, rhythm, dynamics
    - classification: Whether it's piano, confidence
    """
    
    temp_file_path = None
    
    try:
        # Save uploaded file to temp location
        suffix = os.path.splitext(audio.filename)[1]
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
            temp_file_path = temp_file.name
            content = await audio.read()
            temp_file.write(content)
        
        logger.info(f"Analyzing audio: {song_title} by {artist}")
        logger.info(f"Temp file saved to: {temp_file_path}")
        
        # Extract features
        features = extract_audio_features(temp_file_path)
        
        # Transcribe
        transcript = transcribe_audio(temp_file_path)
        
        # Classify
        classification = classify_audio(temp_file_path)
        
        # Prepare response
        response = {
            "transcript": transcript,
            "audio_features": features,
            "classification": classification,
            "song_context": {
                "title": song_title,
                "artist": artist
            }
        }
        
        logger.info("Analysis complete, returning results")
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f"Error in /analyze endpoint: {e}")
        return JSONResponse(
            status_code=400,
            content={
                "error": str(e),
                "audio_features": {
                    "tempo_bpm": 0.0,
                    "beat_count": 0,
                    "rhythm_consistency": 0.5,
                    "loudness_variation": 0.5,
                    "articulation_score": 0.5,
                    "duration_seconds": 0.0,
                    "mfcc_features": [0.0] * 13,
                    "beat_times": []
                },
                "transcript": "",
                "classification": {
                    "is_piano": 0.5,
                    "is_music": 0.5,
                    "confidence": 0.0
                }
            }
        )
        
    finally:
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                logger.info(f"Cleaned up temp file: {temp_file_path}")
            except Exception as e:
                logger.error(f"Error cleaning up temp file: {e}")


@app.post("/extract-features")
async def extract_features(audio: UploadFile = File(...)):
    """
    Endpoint for audio feature extraction only
    Useful for testing/debugging
    """
    
    temp_file_path = None
    
    try:
        suffix = os.path.splitext(audio.filename)[1]
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
            temp_file_path = temp_file.name
            content = await audio.read()
            temp_file.write(content)
        
        features = extract_audio_features(temp_file_path)
        return JSONResponse(content={"audio_features": features})
        
    except Exception as e:
        logger.error(f"Error in /extract-features: {e}")
        return JSONResponse(status_code=400, content={"error": str(e)})
        
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.error(f"Error cleaning up temp file: {e}")


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Endpoint for transcription only
    Useful for testing/debugging
    """
    
    temp_file_path = None
    
    try:
        suffix = os.path.splitext(audio.filename)[1]
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
            temp_file_path = temp_file.name
            content = await audio.read()
            temp_file.write(content)
        
        transcript = transcribe_audio(temp_file_path)
        return JSONResponse(content={"transcript": transcript})
        
    except Exception as e:
        logger.error(f"Error in /transcribe: {e}")
        return JSONResponse(status_code=400, content={"error": str(e)})
        
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.error(f"Error cleaning up temp file: {e}")


if __name__ == "__main__":
    import uvicorn
    
    # Development server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
