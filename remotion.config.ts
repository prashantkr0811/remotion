// remotion.config.ts — NEW FORMAT (v4.0+ Compatible)
import { Config } from '@remotion/cli/config';  // ← Import sahi kar diya

// Video rendering ke liye (default 'jpeg')
Config.setVideoImageFormat('jpeg');

// Still images ke liye (default 'png')
Config.setStillImageFormat('png');

// Output overwrite allow karo
Config.setOverwriteOutput(true);

// Bonus: High quality set kar do
Config.setJpegQuality(100);  // 100% quality for JPEG
Config.setCodec('h264');     // Standard MP4 codec

// Export karo (optional, agar aur config chahiye)
export default Config;