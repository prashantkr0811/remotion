// src/app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Caption } from '@/remotion/CaptionedVideo';

const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
const DEFAULT_FPS = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      console.error('No file in formData');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      console.error('formData.get("file") is not a File, value =', file);
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    console.log('Received file:', file.name, file.type, file.size);

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    const openaiForm = new FormData();
    openaiForm.append('file', blob, file.name);
    openaiForm.append('model', 'whisper-1');
    openaiForm.append('response_format', 'verbose_json');

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is missing');
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiForm,
    });

    console.log('Whisper status:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('Whisper error body:', text);

      // Fallback: quota error ya 429 pe dummy captions
      if (res.status === 429 || text.includes('insufficient_quota')) {
        console.log('Using fallback dummy captions due to quota');

        const fallbackCaptions: Caption[] = [
          {
            from: 0,
            durationInFrames: 90,
            text: 'Quota exceeded on STT API. Showing demo captions only.',
          },
          {
            from: 90,
            durationInFrames: 120,
            text: 'Integrate your own Whisper/AssemblyAI key to enable real captions.',
          },
        ];

        return NextResponse.json({
          captions: fallbackCaptions,
          fps: DEFAULT_FPS,
          durationInSeconds: 7,
        });
      }

      return NextResponse.json(
        { error: 'Whisper API error', details: text },
        { status: 500 }
      );
    }

    const data: any = await res.json();
    console.log('Whisper response keys:', Object.keys(data));

    const segments = data.segments ?? [];
    const captions: Caption[] = segments.map((seg: any) => {
      const startSeconds = seg.start as number;
      const endSeconds = seg.end as number;
      const from = Math.round(startSeconds * DEFAULT_FPS);
      const durationInFrames = Math.max(
        1,
        Math.round((endSeconds - startSeconds) * DEFAULT_FPS)
      );
      return {
        from,
        durationInFrames,
        text: seg.text as string,
      };
    });

    const durationInSeconds =
      segments.length > 0 ? segments[segments.length - 1].end : data.duration ?? 30;

    return NextResponse.json({
      captions,
      fps: DEFAULT_FPS,
      durationInSeconds,
    });
  } catch (err: any) {
    console.error('Transcribe route error:', err);
    return NextResponse.json(
      { error: 'Server error', message: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
