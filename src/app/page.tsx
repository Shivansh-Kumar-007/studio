
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Added Input component
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // Added Alert component
import { Upload, Download, Play, Loader2, KeyRound, Info } from 'lucide-react'; // Added KeyRound, Info
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { pixelateVideo, type PixelateVideoInput } from '@/ai/flows/pixelate-video-flow'; // Import the flow

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pixelationLevel, setPixelationLevel] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null);
  const [openAIApiKey, setOpenAIApiKey] = useState<string>(''); // State for API Key
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
      if (originalVideoUrl) URL.revokeObjectURL(originalVideoUrl);
      if (processedVideoUrl) URL.revokeObjectURL(processedVideoUrl);

      setVideoFile(file);
      setProcessedVideoUrl(null);
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
    // Temporarily removed API key check as DALL-E integration is not feasible for video transformation
    // if (!openAIApiKey) {
    //   toast({
    //     title: "API Key Missing",
    //     description: "Please enter your OpenAI API key.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    setIsProcessing(true);
    setProcessedVideoUrl(null);

    try {
      const videoDataUri = await blobUrlToDataUri(originalVideoUrl);

      const input: PixelateVideoInput = {
        videoDataUri: videoDataUri,
        pixelationLevel: pixelationLevel,
        // Although we collect the key, the simulation flow doesn't use it
        // as DALL-E video transformation isn't implemented.
        // openAIApiKey: openAIApiKey,
      };

      const result = await pixelateVideo(input);
      const processedBlobUrl = dataUriToBlobUrl(result.processedVideoDataUri);

      if (processedBlobUrl) {
         if (processedVideoUrl) URL.revokeObjectURL(processedVideoUrl);
         setProcessedVideoUrl(processedBlobUrl);
         toast({
           title: "Processing Simulation Complete",
           description: "Video processing simulation finished.",
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
  }, [videoFile, originalVideoUrl, pixelationLevel, toast, processedVideoUrl, openAIApiKey]); // Added openAIApiKey

  const handleDownload = () => {
    if (!processedVideoUrl || !videoFile) return;

    const link = document.createElement('a');
    link.href = processedVideoUrl;
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
          {/* Disclaimer about simulation */}
          <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
            <Info className="h-4 w-4 !text-blue-600" />
            <AlertTitle className="font-semibold">Simulation Notice</AlertTitle>
            <AlertDescription>
              This tool currently <strong className="font-medium">simulates</strong> video pixelation. It does not perform actual video transformation or use AI models like DALL-E for conversion. The output video will be the same as the input.
            </AlertDescription>
          </Alert>

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
                     <Label className="text-xs text-muted-foreground block pt-1 text-center">Simulated Output (p{pixelationLevel})</Label>
                    <video controls src={processedVideoUrl} className="w-full h-auto max-h-40">
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                 {originalVideoUrl && !processedVideoUrl && !isProcessing && (
                    <div className="border border-dashed rounded-lg aspect-video bg-muted flex items-center justify-center">
                       <p className="text-xs text-muted-foreground">Simulated output preview will appear here</p>
                    </div>
                 )}
                 {isProcessing && (
                    <div className="border border-dashed rounded-lg aspect-video bg-muted flex flex-col items-center justify-center">
                         <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" />
                       <p className="text-xs text-muted-foreground">Simulating...</p>
                    </div>
                 )}
              </div>
            )}
          </div>

          {/* Pixelation Control */}
          <div className="space-y-2">
            <Label htmlFor="pixelation-slider">2. Set Pixelation Level (Simulation)</Label>
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

           {/* OpenAI API Key Input - Kept for UI demonstration */}
           <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key (Optional - Not currently used)</Label>
            <div className="flex items-center space-x-2">
               <KeyRound className="w-4 h-4 text-muted-foreground" />
               <Input
                id="openai-key"
                type="password"
                placeholder="Enter your OpenAI API key"
                value={openAIApiKey}
                onChange={(e) => setOpenAIApiKey(e.target.value)}
                disabled={isProcessing}
              />
            </div>
             <p className="text-xs text-muted-foreground">Your key is used locally and not stored. Note: This key is not currently used for processing.</p>
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcessVideo}
            disabled={!videoFile || isProcessing } // Temporarily removed API key check from disabled state
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Simulation
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
            Download Simulated Clip
          </Button>
        </CardFooter>
      </Card>
      <Toaster />
    </main>
  );
}
