// app/api/render/route.ts
import { renderMedia } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import { getCompositions, selectComposition } from '@remotion/renderer';
import path from 'path';

export const POST = async (req: Request) => {
  try {
    const { videoUrl, captions, stylePreset } = await req.json();

    // 1. Bundle your Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./src/remotion/index.ts'),
      webpackOverride: (config) => config,
    });

    // 2. Get composition
    const compositions = await getCompositions(bundleLocation);
    const composition = await selectComposition({
      bundleLocation,
      id: 'CaptionedVideo',
      inputProps: { videoSrc: videoUrl, captions, stylePreset },
    });

    // 3. Render final video with burned captions
    const outputLocation = `/tmp/output-${Date.now()}.mp4`;
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation,
      inputProps: { videoSrc: videoUrl, captions, stylePreset },
    });

    // 4. Return video as blob
    const file = Bun.file(outputLocation);
    return new Response(file, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="hinglish-reel.mp4"',
      },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};