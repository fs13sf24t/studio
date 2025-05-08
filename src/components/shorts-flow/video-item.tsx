"use client";

import type { VideoData } from "@/types";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoItemProps {
  video: VideoData;
  isActive: boolean;
}

const VideoItem: React.FC<VideoItemProps> = ({ video, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false); // Individual mute state for this video
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.warn("Video play failed:", error);
          // Autoplay might be blocked, user interaction needed
          // Try to play muted if unmuted autoplay fails
          if (error.name === "NotAllowedError" && videoRef.current && !videoRef.current.muted) {
            videoRef.current.muted = true;
            setIsMuted(true); // Reflect this change in UI
            videoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn("Muted play also failed:", e));
          }
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to video play/pause
    setIsMuted((prev) => !prev);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Placeholder for like functionality
    console.log(`Liked video: ${video.id}`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Placeholder for share functionality
    console.log(`Shared video: ${video.id}`);
     if (navigator.share) {
      navigator.share({
        title: video.title || 'Check out this video!',
        url: window.location.href, // Or a direct link to the video if available
      }).catch(console.error);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };
  
  // Show native controls on hover/focus for accessibility, otherwise minimal UI
  // For this project, we'll use overlayed custom controls instead of native ones
  // to match the minimal UI requirement.
  // The `controls` attribute on video tag is removed for this reason.

  return (
    <div 
      className="h-full w-full relative bg-black flex items-center justify-center"
      onClick={togglePlayPause} // Click on video to play/pause
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={video.uri}
        loop
        playsInline // Important for mobile browsers
        className="w-full h-full object-cover"
        data-ai-hint="short form video"
        // controls // Native controls, disabled for custom UI
      />
      {/* Overlay for video title/user if available */}
      {(video.title || video.user) && (
        <div className="absolute bottom-16 left-4 text-white p-2 rounded bg-black/30">
          {video.user && <p className="font-semibold text-sm">@{video.user}</p>}
          {video.title && <p className="text-xs">{video.title}</p>}
        </div>
      )}

      {/* Interaction Icons */}
      <div className="absolute bottom-1/4 right-3 sm:right-4 md:right-5 flex flex-col space-y-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLike}
          className="text-white bg-black/40 hover:bg-black/60 rounded-full p-2.5 sm:p-3 shadow-lg transition-transform hover:scale-110"
          aria-label="Like video"
        >
          <Heart size={24} className="sm:size-28 md:size-32" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="text-white bg-black/40 hover:bg-black/60 rounded-full p-2.5 sm:p-3 shadow-lg transition-transform hover:scale-110"
          aria-label="Share video"
        >
          <Share2 size={24} className="sm:size-28 md:size-32" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="text-white bg-black/40 hover:bg-black/60 rounded-full p-2.5 sm:p-3 shadow-lg transition-transform hover:scale-110"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX size={24} className="sm:size-28 md:size-32" /> : <Volume2 size={24} className="sm:size-28 md:size-32" />}
        </Button>
      </div>

      {/* Play/Pause indicator (optional, for center of screen) */}
      {showControls && !isPlaying && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play"><polygon points="6 3 20 12 6 21 6 3"/></svg>
        </div>
      )}
    </div>
  );
};

export default VideoItem;
