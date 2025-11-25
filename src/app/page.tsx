'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Player } from '@remotion/player';
import { CaptionedVideo, type Caption as ImportedCaption } from '@/remotion/CaptionedVideo';
import { Upload, Sparkles, Download, Loader2 } from 'lucide-react';

const DEFAULT_FPS = 30;

export default function HomePage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [captions, setCaptions] = useState<ImportedCaption[]>([]);
  const [stylePreset, setStylePreset] = useState<'bottom' | 'topBar' | 'karaoke'>('bottom');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [durationInFrames, setDurationInFrames] = useState<number>(DEFAULT_FPS * 30);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prevObjectUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (prevObjectUrl.current) {
        URL.revokeObjectURL(prevObjectUrl.current);
        prevObjectUrl.current = null;
      }
    };
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (prevObjectUrl.current) {
      URL.revokeObjectURL(prevObjectUrl.current);
      prevObjectUrl.current = null;
    }
    const url = URL.createObjectURL(file);
    prevObjectUrl.current = url;
    setVideoFile(file);
    setVideoUrl(url);
    setCaptions([]);
    setDurationInFrames(Math.round(DEFAULT_FPS * 30));

    const tmp = document.createElement('video');
    tmp.preload = 'metadata';
    tmp.src = url;
    tmp.onloadedmetadata = () => {
      const dur = isFinite(tmp.duration) && tmp.duration > 0 ? tmp.duration : 30;
      setDurationInFrames(Math.round(dur * DEFAULT_FPS));
      tmp.src = '';
    };
  };

  /**
   * convert raw captions (various shapes) -> ImportedCaption[] with { text, start, end } in seconds
   * supported input shapes:
   * - { start: number (s), end: number (s), text }
   * - { from: number (frames), durationInFrames: number (frames), text }  // from previous attempts
   * - { fromSeconds, durationSeconds, text }
   * - Already matching { start, end, text } will be preserved
   */
  const convertToImportedCaptions = (rawCaptions: any[], apiFps?: number): ImportedCaption[] => {
    const fps = apiFps && apiFps > 0 ? apiFps : DEFAULT_FPS;
    return rawCaptions.map((c) => {
      // already the shape we want
      if (typeof c.start === 'number' && typeof c.end === 'number') {
        return {
          // ensure text is string
          text: String(c.text ?? ''),
          start: c.start,
          end: c.end,
          // include any other fields if your Caption type has them (keep minimal)
        } as ImportedCaption;
      }

      // from/durationInFrames -> convert to seconds
      if (typeof c.from === 'number' && typeof c.durationInFrames === 'number') {
        const start = c.from / fps;
        const end = start + c.durationInFrames / fps;
        return { text: String(c.text ?? ''), start, end } as ImportedCaption;
      }

      // startSeconds/durationSeconds fields
      if (typeof c.fromSeconds === 'number' || typeof c.durationSeconds === 'number') {
        const start = typeof c.fromSeconds === 'number' ? c.fromSeconds : 0;
        const end = start + (typeof c.durationSeconds === 'number' ? c.durationSeconds : 1);
        return { text: String(c.text ?? ''), start, end } as ImportedCaption;
      }

      // common transcription shape: { start, duration } with seconds
      if (typeof c.start === 'number' && typeof c.duration === 'number') {
        return { text: String(c.text ?? ''), start: c.start, end: c.start + c.duration } as ImportedCaption;
      }

      // fallback: treat as single short caption at 0
      return { text: String(c.text ?? ''), start: 0, end: Math.max(0.1, 3) } as ImportedCaption;
    });
  };

  const generateCaptions = async () => {
    if (!videoFile) {
      alert('Pehle video upload karo!');
      return;
    }
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append('file', videoFile);
    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('transcribe error', res.status, txt);
        throw new Error('Transcription API error: ' + res.status);
      }
      const data = await res.json();
      // data.captions could be in various shapes; data.fps may be present
      const apiFps = typeof data.fps === 'number' && data.fps > 0 ? data.fps : DEFAULT_FPS;
      const imported = Array.isArray(data.captions) ? convertToImportedCaptions(data.captions, apiFps) : [];
      setCaptions(imported);

      if (typeof data.durationInSeconds === 'number' && data.durationInSeconds > 0) {
        setDurationInFrames(Math.round(data.durationInSeconds * apiFps));
      } else if (videoRef.current && isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
        setDurationInFrames(Math.round(videoRef.current.duration * apiFps));
      }

      alert('Captions ready ho gaye!');
    } catch (err) {
      console.error(err);
      alert('Transcription failed — check console.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const downloadVideo = () => {
    if (captions.length === 0) return alert('Pehle captions generate karo!');
    const video = videoRef.current;
    if (!video) return alert('Video load nahi hua');
    if (!isFinite(video.duration) || video.duration <= 0) return alert('Video duration not ready yet');

    setIsDownloading(true);

    const width = 1080;
    const height = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('Canvas not supported');
      setIsDownloading(false);
      return;
    }

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hinglish-Reel-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsDownloading(false);
      alert('Download complete! Captions burned hai!');
    };

    const fps = 30;
    const frameInterval = 1000 / fps;

    const drawFrame = () => {
      try {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        const vidW = video.videoWidth || video.clientWidth;
        const vidH = video.videoHeight || video.clientHeight;
        const vidRatio = vidW / vidH;
        const canvasRatio = width / height;
        let dw = width;
        let dh = height;
        let dx = 0;
        let dy = 0;
        if (vidRatio > canvasRatio) {
          dh = height;
          dw = Math.round(dh * vidRatio);
          dx = Math.round((width - dw) / 2);
        } else {
          dw = width;
          dh = Math.round(dw / vidRatio);
          dy = Math.round((height - dh) / 2);
        }
        ctx.drawImage(video, dx, dy, dw, dh);

        const now = video.currentTime;
        const current = captions.find((c) => now >= c.start && now <= c.end);
        if (current) {
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          const boxHeight = 260;
          ctx.fillRect(0, height - boxHeight - 60, width, boxHeight);
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          const fontSize = 72;
          ctx.font = `${fontSize}px "Arial"`;
          const maxWidth = width - 160;
          const words = String(current.text).split(' ');
          let line = '';
          const lines: string[] = [];
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              lines.push(line.trim());
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          if (line) lines.push(line.trim());
          const startY = height - boxHeight - 60 + 60;
          const lineHeight = fontSize + 8;
          const totalHeight = lines.length * lineHeight;
          let y = startY + (boxHeight - totalHeight) / 2 + fontSize;
          for (const l of lines) {
            ctx.fillText(l, width / 2, y);
            y += lineHeight;
          }
        }
      } catch (e) {
        console.error('draw error', e);
      }
    };

    const interval = setInterval(drawFrame, frameInterval);
    video.currentTime = 0;
    video.play().catch(() => {
      console.warn('Video play interrupted by autoplay policy.');
    });

    recorder.start();
    setTimeout(() => {
      clearInterval(interval);
      try {
        video.pause();
      } catch {}
      try {
        recorder.stop();
      } catch (e) {
        console.warn('recorder stop error', e);
      }
    }, Math.round(video.duration * 1000) + 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white p-12">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-8xl font-black mb-8 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
          Hinglish Magic
        </h1>

        <input
          type="file"
          accept="video/*"
          onChange={handleUpload}
          className="mb-12 text-xl file:mr-6 file:py-5 file:px-10 file:rounded-xl file:bg-purple-600 file:text-white"
        />

        <div className="flex gap-12 justify-center mb-16">
          {(['bottom', 'topBar', 'karaoke'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStylePreset(s)}
              className={`px-16 py-8 rounded-3xl font-bold text-3xl ${stylePreset === s ? 'bg-purple-600' : 'bg-gray-800'}`}
            >
              {s === 'topBar' ? 'Top Bar' : s}
            </button>
          ))}
        </div>

        <div className="flex gap-16 justify-center mb-20">
          <button
            onClick={generateCaptions}
            disabled={isTranscribing || !videoFile}
            className="px-24 py-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl font-bold text-4xl flex items-center gap-8 disabled:opacity-50"
          >
            {isTranscribing ? 'Generating...' : 'Generate Captions'} <Sparkles />
          </button>

          <button
            onClick={downloadVideo}
            disabled={isDownloading || captions.length === 0}
            className="px-24 py-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl font-bold text-4xl flex items-center gap-8 disabled:opacity-50"
          >
            {isDownloading ? 'Downloading...' : 'Download Final MP4'} {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
          </button>
        </div>

        {videoUrl && (
          <div className="max-w-md mx-auto bg-black rounded-[70px] p-8 shadow-2xl">
            <div className="relative aspect-[9/19.5] rounded-[50px] overflow-hidden border-12 border-black">
              <video ref={videoRef} src={videoUrl} controls className="w-full h-full object-contain" />
              <Player
                component={CaptionedVideo}
                inputProps={{ videoSrc: videoUrl, captions, stylePreset }}
                durationInFrames={durationInFrames}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={DEFAULT_FPS}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
