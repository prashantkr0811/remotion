// src/app/api/transcribe/route.ts
import { NextRequest } from 'next/server';

// Caption type define kar diya
type Caption = {
  text: string;
  start: number;
  end: number;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
    }

    // Real API call (tera OpenAI ya jo bhi use kar raha hai)
    // Example:
    // const response = await fetch('https://api.openai.com/v1/audio/transcriptions', { ... })

    // For demo purpose — fallback captions
    const fallbackCaptions: Caption[] = [
  
  ];

    return new Response(
      JSON.stringify({
        captions: fallbackCaptions,
        fps: 30,
        durationInSeconds: 18,
      })
    );
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ error: 'Transcription failed' }), { status: 500 });
  }
}