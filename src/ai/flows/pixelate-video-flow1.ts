'use server';

import { z } from 'genkit';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { Buffer } from 'buffer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Input schema
const PixelateVideoInputSchema = z.object({
  videoDataUri: z.string().describe("Base64-encoded video (data URI)"),
  pixelationLevel: z.number().min(2).max(50).describe("Pixelation level (2-50)"),
});
export type PixelateVideoInput = z.infer<typeof PixelateVideoInputSchema>;

// Output schema
const PixelateVideoOutputSchema = z.object({
  processedVideoDataUri: z.string().describe("Processed video (simulated) in data URI format"),
});
export type PixelateVideoOutput = z.infer<typeof PixelateVideoOutputSchema>;

// Main flow
const pixelateVideoFlow = {
  name: 'pixelateVideoFlow',
  inputSchema: PixelateVideoInputSchema,
  outputSchema: PixelateVideoOutputSchema,
  run: async (input: PixelateVideoInput): Promise<PixelateVideoOutput> => {
    // Save video to temp file
    const videoPath = path.join(os.tmpdir(), `video-${Date.now()}.mp4`);
    const framePath = path.join(os.tmpdir(), `frame-${Date.now()}.png`);

    const videoBuffer = decodeDataUri(input.videoDataUri);
    fs.writeFileSync(videoPath, videoBuffer);

    // Extract frame using ffmpeg
    await extractFrame(videoPath, framePath);

    // Send frame to OpenAI for variation
    const file = await OpenAI.toFile(fs.createReadStream(framePath), 'frame.png');
    const response = await openai.images.createVariation({
      image: file,
      n: 1,
      size: '512x512',
      response_format: 'b64_json',
    });

    const pixelArtBase64 = response.data[0].b64_json;

    // Simulate returning the image as "video"
    const simulatedVideoDataUri = `data:video/mp4;base64,${pixelArtBase64}`;

    return {
      processedVideoDataUri: simulatedVideoDataUri,
    };
  },
};

// Exported function
export async function pixelateVideo(input: PixelateVideoInput): Promise<PixelateVideoOutput> {
  return pixelateVideoFlow.run(input);
}

// Helper: Decode base64 Data URI
function decodeDataUri(dataUri: string): Buffer {
  const base64 = dataUri.split(',')[1];
  return Buffer.from(base64, 'base64');
}

// Helper: Extract frame using ffmpeg
async function extractFrame(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .on('end', () => resolve())
      .on('error', reject)
      .screenshots({
        count: 1,
        folder: path.dirname(outputPath),
        filename: path.basename(outputPath),
        size: '512x512',
      });
  });
}
``