"use client";

import { useRef, useEffect, useCallback } from "react";

interface TrackedVideoPlayerProps {
  tagId: string;
  videoSrc: string;
}

export default function TrackedVideoPlayer({ tagId, videoSrc }: TrackedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sentMilestones = useRef<Set<string>>(new Set());

  const sendEvent = useCallback((event: string, watchTime?: number) => {
    try {
      fetch("/api/video-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId,
          event,
          watchTime: watchTime != null ? Math.round(watchTime) : undefined,
        }),
        keepalive: true,
      });
    } catch {
      // tracking failed, ignore
    }
  }, [tagId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      if (!sentMilestones.current.has("play")) {
        sendEvent("play");
        sentMilestones.current.add("play");
      }
    };

    const onPause = () => {
      sendEvent("pause", video.currentTime);
    };

    const onEnded = () => {
      sendEvent("ended", video.duration);
      if (!sentMilestones.current.has("progress_100")) {
        sendEvent("progress_100", video.duration);
        sentMilestones.current.add("progress_100");
      }
    };

    const onTimeUpdate = () => {
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;

      if (pct >= 25 && !sentMilestones.current.has("progress_25")) {
        sendEvent("progress_25", video.currentTime);
        sentMilestones.current.add("progress_25");
      }
      if (pct >= 50 && !sentMilestones.current.has("progress_50")) {
        sendEvent("progress_50", video.currentTime);
        sentMilestones.current.add("progress_50");
      }
      if (pct >= 75 && !sentMilestones.current.has("progress_75")) {
        sendEvent("progress_75", video.currentTime);
        sentMilestones.current.add("progress_75");
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [sendEvent]);

  return (
    <video
      ref={videoRef}
      className="w-full"
      controls
      autoPlay
      playsInline
      preload="metadata"
      style={{ maxHeight: "80vh" }}
    >
      <source src={videoSrc} type="video/mp4" />
      <source src={videoSrc} type="video/webm" />
      Twoja przegladarka nie wspiera odtwarzania wideo.
    </video>
  );
}
