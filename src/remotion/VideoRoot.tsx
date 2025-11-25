// src/remotion/VideoRoot.tsx
import React from 'react';
import { Composition } from 'remotion';
// import { CaptionedVideo } from './CaptionedVideo';
import { CaptionedVideo } from './CaptionedVideo';

export const VideoRoot: React.FC = () => {
  return (
    <>
     <Composition
  id="CaptionedVideo"
  component={CaptionedVideo}
  durationInFrames={1800}
  fps={30}
  width={1080}
  height={1920}
  defaultProps={{ videoSrc: '', captions: [], stylePreset: 'bottom' }}
/>
    </>
  );
};
