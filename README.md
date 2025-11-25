# Hinglish Magic - Remotion Captioning Platform

**Live Demo**: 

## Features
- Upload any MP4 video
- Auto-generate Hinglish captions (OpenAI Whisper)
- 3 caption styles: Bottom, Top Bar, Karaoke
- Real-time preview with Remotion Player
- **Direct Download Final MP4 with burned captions** (no CLI needed!)

## Tech Stack
- Next.js 16 + Turbopack
- Remotion v4
- Tailwind CSS
- Lucide Icons
- OpenAI Whisper API (via /api/transcribe)

## Local Setup
```bash
git clone https://github.com/prashantkr0811/remotion.git
cd remotion
npm install
npm run dev