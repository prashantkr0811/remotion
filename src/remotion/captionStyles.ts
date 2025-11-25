// src/remotion/captionStyles.ts
import { CSSProperties } from 'react';

export type StylePreset = 'bottom' | 'topBar' | 'karaoke';

export const baseCaptionStyle: CSSProperties = {
  color: 'white',
  fontSize: 36,
  textAlign: 'center',
  fontFamily: "'Noto Sans', 'Noto Sans Devanagari', system-ui",
};

export const getCaptionContainerStyle = (
  preset: StylePreset
): CSSProperties => {
  if (preset === 'topBar') {
    return {
      position: 'absolute',
      top: 40,
      left: 0,
      right: 0,
      padding: '10px 20px',
      backgroundColor: 'rgba(0,0,0,0.8)',
    };
  }
  if (preset === 'karaoke') {
    return {
      position: 'absolute',
      bottom: 80,
      left: '10%',
      right: '10%',
      padding: '10px 16px',
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: 12,
    };
  }
  // bottom default
  return {
    position: 'absolute',
    bottom: 60,
    left: '10%',
    right: '10%',
    padding: '10px 16px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
  };
};
