"use client";

import type { VideoData } from "@/types";
import React, { useState, useEffect, useRef, useCallback } from "react";
import VideoItem from "./video-item";

const MOCK_VIDEOS: VideoData[] = [
  {
    id: "1",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    title: "For Bigger Fun",
    user: "google",
    likes: 1200,
    shares: 300,
  },
  {
    id: "2",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    title: "Elephants Dream",
    user: "blenderfoundation",
    likes: 25000,
    shares: 1200,
  },
  {
    id: "3",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Big Buck Bunny",
    user: "blenderfoundation",
    likes: 150000,
    shares: 8000,
  },
  {
    id: "4",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "For Bigger Blazes",
    user: "google",
    likes: 980,
    shares: 150,
  },
   {
    id: "5",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    title: "For Bigger Escapes",
    user: "google",
    likes: 7500,
    shares: 450,
  },
  {
    id: "6",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    title: "Sintel",
    user: "blenderfoundation",
    likes: 95000,
    shares: 3200,
  }
];

const VideoFeed: React.FC = () => {
  const [videos] = useState<VideoData[]>(MOCK_VIDEOS);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      const videoId = entry.target.getAttribute("data-video-id");
      if (videoId) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          setActiveVideoId(videoId);
        } else if (activeVideoId === videoId && !entry.isIntersecting) {
          // Optional: if the active video scrolls completely out, 
          // you might want to set activeVideoId to null or the next one.
          // For now, it only changes when another becomes >50% visible.
        }
      }
    });
  }, [activeVideoId]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null, // viewport
      rootMargin: "0px",
      threshold: 0.5, // 50% visibility
    });

    const currentObserver = observerRef.current;

    videoItemRefs.current.forEach((videoElement) => {
      if (videoElement) {
        currentObserver.observe(videoElement);
      }
    });
    
    // Set initial active video if first one is visible
    if (videos.length > 0 && videoItemRefs.current.get(videos[0].id)) {
        // A small timeout can help ensure the layout is stable before checking intersection.
        setTimeout(() => {
            const firstVideoElement = videoItemRefs.current.get(videos[0].id);
            if (firstVideoElement) {
                const rect = firstVideoElement.getBoundingClientRect();
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                if (rect.top >= 0 && rect.bottom <= viewportHeight && rect.height > 0) {
                     // Check if it's roughly in view
                    const intersectionRatio = Math.max(0, Math.min(rect.height, viewportHeight - rect.top, rect.bottom)) / rect.height;
                    if (intersectionRatio >= 0.5) {
                        setActiveVideoId(videos[0].id);
                    }
                }
            }
        }, 100);
    }


    return () => {
      if (currentObserver) {
        videoItemRefs.current.forEach((videoElement) => {
          if (videoElement) {
            currentObserver.unobserve(videoElement);
          }
        });
      }
    };
  }, [handleIntersection, videos]);

  return (
    <div className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory bg-background">
      {videos.map((video) => (
        <div
          key={video.id}
          ref={(el) => {
            if (el) videoItemRefs.current.set(video.id, el);
            else videoItemRefs.current.delete(video.id);
          }}
          data-video-id={video.id}
          className="h-screen w-screen snap-align-start flex-shrink-0"
        >
          <VideoItem
            video={video}
            isActive={activeVideoId === video.id}
          />
        </div>
      ))}
    </div>
  );
};

export default VideoFeed;
