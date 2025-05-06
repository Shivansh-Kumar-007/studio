
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Upload, Download, Play, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { pixelateVideo, type PixelateVideoInput } from '@/ai/flows/pixelate-video-flow'; // Import the flow

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pixelationLevel, setPixelationLevel] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null); // Will store Blob URL
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null); // Will store Blob URL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Clean up object URLs when component unmounts or video changes
  React.useEffect(() => {
    return () => {
      if (originalVideoUrl) URL.revokeObjectURL(originalVideoUrl);
      if (processedVideoUrl) URL.revokeObjectURL(processedVideoUrl);
    };
  }, [originalVideoUrl, processedVideoUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      // Clean up previous URLs before setting new ones
      if (originalVideoUrl) URL.revokeObjectURL(originalVideoUrl);
      if (processedVideoUrl) URL.revokeObjectURL(processedVideoUrl);

      setVideoFile(file);
      setProcessedVideoUrl(null); // Reset processed video on new upload
      const url = URL.createObjectURL(file);
      setOriginalVideoUrl(url);
    } else {
      setVideoFile(null);
      setOriginalVideoUrl(null);
      setProcessedVideoUrl(null);
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

  // Converts Blob URL to Data URI
  const blobUrlToDataUri = async (blobUrl: string): Promise<string> => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

   // Converts Data URI back to Blob URL for video player source
   const dataUriToBlobUrl = (dataUri: string): string | null => {
     try {
       const byteString = atob(dataUri.split(',')[1]);
       const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
       const ab = new ArrayBuffer(byteString.length);
       const ia = new Uint8Array(ab);
       for (let i = 0; i < byteString.length; i++) {
         ia[i] = byteString.charCodeAt(i);
       }
       const blob = new Blob([ab], { type: mimeString });
       return URL.createObjectURL(blob);
     } catch (error) {
       console.error("Error converting Data URI to Blob URL:", error);
       return null;
     }
   };


  const handleProcessVideo = useCallback(async () => {
    if (!videoFile || !originalVideoUrl) {
      toast({
        title: "No Video Uploaded",
        description: "Please upload a video file first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessedVideoUrl(null); // Clear previous preview

    try {
      // Convert the Blob URL to a Data URI for the flow
      const videoDataUri = await blobUrlToDataUri(originalVideoUrl);

      const input: PixelateVideoInput = {
        videoDataUri: videoDataUri,
        pixelationLevel: pixelationLevel,
      };

      // Call the Genkit flow
      const result = await pixelateVideo(input);

      // Convert the resulting Data URI back to a Blob URL for the video player
      const processedBlobUrl = dataUriToBlobUrl(result.processedVideoDataUri);

      if (processedBlobUrl) {
         // Revoke previous processed URL if it exists
         if (processedVideoUrl) URL.revokeObjectURL(processedVideoUrl);
         setProcessedVideoUrl(processedBlobUrl);
         toast({
           title: "Processing Complete",
           description: "Your simulated pixelated video clip is ready.",
         });
      } else {
        throw new Error("Failed to create blob URL for processed video.");
      }

    } catch (error) {
      console.error("Processing failed:", error);
      toast({
        title: "Processing Failed",
        description: "Could not process the video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [videoFile, originalVideoUrl, pixelationLevel, toast, processedVideoUrl]); // Added processedVideoUrl dependency for cleanup

  const handleDownload = () => {
    if (!processedVideoUrl || !videoFile) return;

    // Download the blob URL directly
    const link = document.createElement('a');
    link.href = processedVideoUrl;
    // Generate a filename like pixelated_origfilename_p10.mp4
    const pixelationSuffix = `_p${pixelationLevel}`;
    const fileExtension = videoFile.name.split('.').pop() || 'mp4';
    const baseName = videoFile.name.substring(0, videoFile.name.lastIndexOf('.')) || 'video';
    link.download = `pixelated_${baseName.slice(0,15)}${pixelationSuffix}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 md:p-24 bg-secondary">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">PixelClip</CardTitle>
          <CardDescription className="text-center">
            Upload a video, choose a pixelation level, and generate a short, pixelated clip. (Simulation)
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
             {/* Combined Preview Area */}
             {(originalVideoUrl || processedVideoUrl) && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {originalVideoUrl && (
                  <div className="border rounded-lg overflow-hidden aspect-video bg-black">
                    <Label className="text-xs text-muted-foreground block pt-1 text-center">Original</Label>
                    <video src={originalVideoUrl} controls className="w-full h-auto max-h-40">
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                {processedVideoUrl && (
                  <div className="border rounded-lg overflow-hidden aspect-video bg-black">
                     <Label className="text-xs text-muted-foreground block pt-1 text-center">Pixelated (p{pixelationLevel})</Label>
                    <video controls src={processedVideoUrl} className="w-full h-auto max-h-40">
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                 {/* Placeholder if only original is loaded */}
                 {originalVideoUrl && !processedVideoUrl && !isProcessing && (
                    <div className="border border-dashed rounded-lg aspect-video bg-muted flex items-center justify-center">
                       <p className="text-xs text-muted-foreground">Pixelated preview will appear here</p>
                    </div>
                 )}
                 {/* Loading indicator */}
                 {isProcessing && (
                    <div className="border border-dashed rounded-lg aspect-video bg-muted flex flex-col items-center justify-center">
                         <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" />
                       <p className="text-xs text-muted-foreground">Processing...</p>
                    </div>
                 )}
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
