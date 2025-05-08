
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import type { ObjectDetection, DetectedObject } from '@tensorflow-models/coco-ssd';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Camera as CameraIcon, Loader2, AlertTriangle } from 'lucide-react';

const AICameraView: React.FC = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [model, setModel] = useState<ObjectDetection | null>(null);
  const [predictions, setPredictions] = useState<DetectedObject[]>([]);
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const rafId = useRef<number | null>(null);

  const loadModelAndCamera = useCallback(async () => {
    setIsLoading(true);
    try {
      await tf.ready();
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Prefer rear camera
      });
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        };
      }
    } catch (error) {
      console.error('Error loading model or camera:', error);
      setHasPermission(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.name === "NotAllowedError" ? 'Camera permission denied. Please enable camera access in your browser settings.' : 'Failed to initialize AI camera.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadModelAndCamera();

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [loadModelAndCamera]);

  const detectFrame = useCallback(async () => {
    if (videoRef.current && videoRef.current.readyState === 4 && model && canvasRef.current) {
      const video = videoRef.current;
      const detectedObjects = await model.detect(video);
      setPredictions(detectedObjects);

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        // Scale predictions to canvas size if video is displayed differently than its native resolution
        // Assuming canvas is same aspect ratio as video and scaled via CSS if needed
        // Bbox coords are relative to video's intrinsic size.
        const scaleX = canvasRef.current.width / video.videoWidth;
        const scaleY = canvasRef.current.height / video.videoHeight;

        detectedObjects.forEach(obj => {
          const [x, y, width, height] = obj.bbox;
          ctx.strokeStyle = 'hsl(var(--primary))';
          ctx.lineWidth = 2;
          ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
          ctx.fillStyle = 'hsl(var(--primary))';
          ctx.font = '16px Arial';
          ctx.fillText(
            `${obj.class} (${Math.round(obj.score * 100)}%)`,
            x * scaleX,
            y * scaleY > 10 ? y * scaleY - 5 : 10
          );
        });
      }

      const hasPerson = detectedObjects.some(obj => obj.class === 'person');
      if (hasPerson && !alarmTriggered) {
        setAlarmTriggered(true);
        console.warn("Person detected! Alarm!");
        if (navigator.vibrate) {
          navigator.vibrate(1000);
        }
        toast({
          title: 'Alert: Person Detected!',
          variant: 'destructive',
          duration: 3000,
        });
      } else if (!hasPerson && alarmTriggered) {
        setAlarmTriggered(false);
      }
    }
    rafId.current = requestAnimationFrame(detectFrame);
  }, [model, alarmTriggered, toast]);

  useEffect(() => {
    if (model && videoRef.current && hasPermission) {
      detectFrame();
    }
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [model, hasPermission, detectFrame]);


  const captureScreenshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        // Redraw current predictions onto the tempCanvas for saving
        predictions.forEach(obj => {
          const [x, y, width, height] = obj.bbox;
          tempCtx.strokeStyle = 'hsl(var(--primary))';
          tempCtx.lineWidth = 3; // Slightly thicker for saved image
          tempCtx.strokeRect(x, y, width, height);
          tempCtx.fillStyle = 'hsl(var(--primary))';
          tempCtx.font = '18px Arial'; // Slightly larger for saved image
          tempCtx.fillText(
            `${obj.class} (${Math.round(obj.score * 100)}%)`,
            x,
            y > 10 ? y - 5 : 18
          );
        });

        const image = tempCanvas.toDataURL('image/jpeg');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'ai-camera-snapshot.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Screenshot Saved', description: 'The image has been saved to your downloads.' });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading AI Camera...</p>
        <p className="text-sm text-muted-foreground">Please wait while we set things up.</p>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <Alert variant="destructive" className="max-w-md m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Camera Access Denied</AlertTitle>
        <AlertDescription>
          Please enable camera permissions in your browser settings to use the AI Camera.
          Then, refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 relative">
      <div className={`relative w-full max-w-4xl aspect-video shadow-2xl rounded-lg overflow-hidden border-2 ${alarmTriggered ? 'border-destructive ring-4 ring-destructive/50' : 'border-primary/20'} transition-all duration-300`}>
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          playsInline
          autoPlay
          muted
          data-ai-hint="camera feed"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
      {alarmTriggered && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg text-sm font-semibold animate-pulse">
          PERSON DETECTED!
        </div>
      )}
      <Button onClick={captureScreenshot} className="mt-6 shadow-md" size="lg" disabled={!model || predictions.length === 0}>
        <CameraIcon className="mr-2 h-5 w-5" /> Capture Screenshot
      </Button>
       <p className="text-xs text-muted-foreground mt-4">TensorFlow.js + COCO-SSD Model</p>
    </div>
  );
};

export default AICameraView;
