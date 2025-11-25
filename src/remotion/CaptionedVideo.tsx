// src/remotion/CaptionedVideo.tsx
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { getCaptionContainerStyle, baseCaptionStyle, StylePreset } from './captionStyles';
import { Video } from 'remotion';

export type Caption = {
  from: number; // frame
  durationInFrames: number;
  text: string;
  start: number;
  end: number;
};

type Props = {
  videoSrc: string;
  captions: Caption[];
  stylePreset: StylePreset;
};

export const CaptionedVideo: React.FC<Props> = ({
  videoSrc,
  captions,
  stylePreset,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeCaption = captions.find(
    (c) => frame >= c.from && frame < c.from + c.durationInFrames
  );

  const progress =
    activeCaption && stylePreset === 'karaoke'
      ? (frame - activeCaption.from) / activeCaption.durationInFrames
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {videoSrc && (
        <Video
          src={videoSrc}
          startFrom={0}
          endAt={undefined}
        />
      )}

      {activeCaption && (
        <Sequence from={activeCaption.from} durationInFrames={activeCaption.durationInFrames}>
          <div style={getCaptionContainerStyle(stylePreset)}>
            {stylePreset === 'karaoke' ? (
              <div
                style={{
                  ...baseCaptionStyle,
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                <span
                  style={{
                    ...baseCaptionStyle,
                    color: '#ffffff88',
                  }}
                >
                  {activeCaption.text}
                </span>
                <span
                  style={{
                    ...baseCaptionStyle,
                    color: '#00e1ff',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeCaption.text}
                </span>
              </div>
            ) : (
              <div style={baseCaptionStyle}>{activeCaption.text}</div>
            )}
          </div>
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
