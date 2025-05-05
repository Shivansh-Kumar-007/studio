'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Upload, Download, Play, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pixelationLevel, setPixelationLevel] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setProcessedVideoUrl(null); // Reset processed video on new upload
      const url = URL.createObjectURL(file);
      setOriginalVideoUrl(url);
      // Clean up previous object URL
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoFile(null);
      setOriginalVideoUrl(null);
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid video file.",
        variant: "destructive",
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleProcessVideo = useCallback(() => {
    if (!videoFile) {
      toast({
        title: "No Video Uploaded",
        description: "Please upload a video file first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessedVideoUrl(null); // Clear previous preview

    // Simulate video processing
    console.log(`Simulating pixelation with level: ${pixelationLevel}`);
    setTimeout(() => {
      // In a real app, this URL would come from the backend/processing service
      // For simulation, we'll reuse the original video URL for preview
      const url = URL.createObjectURL(videoFile);
      setProcessedVideoUrl(url);
      setIsProcessing(false);
      toast({
        title: "Processing Complete",
        description: "Your pixelated video clip is ready for preview.",
      });
    }, 2500); // Simulate 2.5 seconds processing time

  }, [videoFile, pixelationLevel, toast]);

  const handleDownload = () => {
    if (!processedVideoUrl || !videoFile) return;

    // Simulate downloading the processed file.
    // In a real app, this would point to the actual processed file URL.
    const link = document.createElement('a');
    link.href = processedVideoUrl;
    // Suggest a filename (in a real app, this would be more meaningful)
    link.download = `pixelated_${videoFile.name.split('.')[0].slice(0,10)}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Note: URL.revokeObjectURL(processedVideoUrl) should be called eventually
    // if the blob URL isn't needed anymore, potentially in a useEffect cleanup.
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 md:p-24 bg-secondary">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">PixelClip</CardTitle>
          <CardDescription className="text-center">
            Generate a 10-second pixelated clip for your videos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Upload */}
          <div className="space-y-2">
            <Label htmlFor="video-upload">1. Upload Video</Label>
            <div
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-card hover:bg-muted"
              onClick={handleUploadClick}
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {videoFile ? videoFile.name : 'Click or drag video here'}
              </p>
              <input
                ref={fileInputRef}
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {originalVideoUrl && (
               <div className="mt-2 text-center">
                 <p className="text-xs text-muted-foreground">Original video selected.</p>
               </div>
            )}
          </div>

          {/* Pixelation Control */}
          <div className="space-y-2">
            <Label htmlFor="pixelation-slider">2. Set Pixelation Level</Label>
            <Slider
              id="pixelation-slider"
              min={2}
              max={50}
              step={1}
              value={[pixelationLevel]}
              onValueChange={(value) => setPixelationLevel(value[0])}
              disabled={!videoFile || isProcessing}
              className="cursor-pointer"
            />
            <p className="text-sm text-center text-muted-foreground">Level: {pixelationLevel}</p>
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcessVideo}
            disabled={!videoFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Pixelated Clip
              </>
            )}
          </Button>

          {/* Video Preview */}
          {processedVideoUrl && (
            <div className="space-y-2">
              <Label>3. Preview Clip</Label>
              <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border">
                <video controls src={processedVideoUrl} className="w-full h-full">
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleDownload}
            disabled={!processedVideoUrl || isProcessing}
            variant="outline"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Clip
          </Button>
        </CardFooter>
      </Card>
      <Toaster />
    </main>
  );
}
