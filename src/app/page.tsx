'use client';

import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { CaptionedVideo, Caption } from '@/remotion/CaptionedVideo';
import type { StylePreset } from '@/remotion/captionStyles';
import { Upload, Sparkles, Download, Loader2, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [stylePreset, setStylePreset] = useState<StylePreset>('bottom');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setCaptions([]);
  };

  const generateCaptions = async () => {
    if (!videoFile) return;
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append('file', videoFile);
    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json();
      setCaptions(data.captions);
      alert('Captions ready ho gaye!');
    } catch {
      alert('Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  // YE HAI FINAL MAGIC — Direct MP4 Download (No AWS, No Lambda)
  const downloadVideo = () => {
    if (captions.length === 0) return alert('Pehle captions generate karo!');

    const command = `npx remotion render CaptionedVideo out/reel.mp4 --props='${JSON.stringify({ videoSrc: videoUrl, captions, stylePreset })}'`;

    // Copy to clipboard
    navigator.clipboard.writeText(command);

    alert(
      `Command clipboard mein copy ho gaya!\n\n` +
      `Terminal kholo aur paste kar do:\n\n` +
      `${command}\n\n` +
      `Final MP4 with burned captions ban jayega!`
    );
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

        {videoFile && (
          <div className="mb-10">
            <CheckCircle className="w-16 h-16 mx-auto text-emerald-400" />
            <p className="text-2xl mt-4">{videoFile.name}</p>
          </div>
        )}

        <div className="flex gap-10 justify-center mb-16">
          {(['bottom', 'topBar', 'karaoke'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStylePreset(s)}
              className={`px-16 py-8 rounded-3xl font-bold text-3xl ${stylePreset === s ? 'bg-purple-600 shadow-2xl' : 'bg-gray-800'}`}
            >
              {s === 'topBar' ? 'Top Bar' : s}
            </button>
          ))}
        </div>

        <div className="flex gap-16 justify-center mb-20">
          <button
            onClick={generateCaptions}
            disabled={isTranscribing || !videoFile}
            className="px-24 py-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl font-bold text-4xl flex items-center gap-8 disabled:opacity-50 hover:scale-105 transition shadow-2xl"
          >
            {isTranscribing ? 'Generating...' : 'Generate Captions'} 
            {isTranscribing ? <Loader2 className="animate-spin w-16 h-16" /> : <Sparkles className="w-16 h-16" />}
          </button>

          <button
            onClick={downloadVideo}
            disabled={captions.length === 0}
            className="px-24 py-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl font-bold text-4xl flex items-center gap-8 disabled:opacity-50 hover:scale-105 transition shadow-2xl"
          >
            Download Final MP4 <Download className="w-16 h-16" />
          </button>
        </div>

        {videoUrl && (
          <div className="max-w-md mx-auto bg-black rounded-[70px] p-8 shadow-2xl">
            <div className="aspect-[9/19.5] rounded-[50px] overflow-hidden border-12 border-black">
              <Player
                component={CaptionedVideo}
                inputProps={{ videoSrc: videoUrl, captions, stylePreset }}
                durationInFrames={1800}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={30}
                controls
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}