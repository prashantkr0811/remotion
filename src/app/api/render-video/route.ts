// app/api/render-video/route.ts
// import { renderMediaOnLambda } from '@remotion/lambda';
import { renderMediaOnLambda } from '@remotion/lambda';
export const POST = async (req: Request) => {
  try {
    const { videoUrl, captions, stylePreset } = await req.json();

    const result = await renderMediaOnLambda({
      region: 'ap-south-1', // Mumbai (fastest for India)
      functionName: 'remotion-render-123456', // <-- tera function name yahan daal dena (deploy ke baad milega)
      serveUrl: 'https://your-remotion-site.vercel.app', // <-- tera site URL yahan daal dena
      composition: 'CaptionedVideo',
      inputProps: { videoSrc: videoUrl, captions, stylePreset },
      codec: 'h264',
      privacy: 'public',
      framesPerLambda: 20,
      outName: `hinglish-reel-${Date.now()}.mp4`,
    });

    const downloadUrl = `https://${result.bucketName}.s3.ap-south-1.amazonaws.com/renders/${result.renderId}/out.mp4`;

    return Response.json({ downloadUrl });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};