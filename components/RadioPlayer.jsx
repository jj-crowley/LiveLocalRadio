"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Radio, Volume2 } from "lucide-react";

export function RadioPlayer() {
  const audioRef = useRef(null);
  const [tracks, setTracks] = useState([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [liveOffset, setLiveOffset] = useState(0);
  const [stationTime, setStationTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("Loading signal...");
  const [stationDay, setStationDay] = useState("");

  const currentTrack = tracks[trackIndex];
  const currentTrackSrc = currentTrack?.src;

  useEffect(() => {
    let ignore = false;

    async function loadTracks() {
      try {
        const response = await fetch("/api/radio/tracks", { cache: "no-store" });
        const payload = await response.json();

        if (ignore) {
          return;
        }

        applyStationState(payload, { force: true });
        setStatus(payload.tracks?.length ? "Signal found" : "Drop MP3s into storage/radio");
      } catch {
        if (!ignore) {
          setStatus("Radio signal unavailable");
        }
      }
    }

    loadTracks();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      syncStationState();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [currentTrackSrc, isPlaying]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) {
      return;
    }

    if (audioRef.current.getAttribute("src") !== currentTrack.src) {
      audioRef.current.src = currentTrack.src;
    }

    if (isPlaying) {
      startCurrentTrack(liveOffset);
    }
  }, [currentTrackSrc]);

  async function togglePlayback() {
    if (!audioRef.current || !currentTrack) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    await startCurrentTrack(getCurrentLiveOffset());
  }

  function nextTrack() {
    syncStationState(true);
  }

  async function syncStationState(shouldPlay = false) {
    try {
      const response = await fetch("/api/radio/tracks", { cache: "no-store" });
      const payload = await response.json();
      applyStationState(payload);

      if (shouldPlay && payload.nowPlaying?.track) {
        setIsPlaying(true);
        await startSpecificTrack(payload.nowPlaying.track, payload.nowPlaying.offsetSeconds || 0);
      }
    } catch {
      setStatus("Radio signal unavailable");
    }
  }

  function applyStationState(payload, options = {}) {
    const nextTracks = payload.tracks || [];
    const nextIndex = payload.nowPlaying?.trackIndex || 0;
    const nextTrack = nextTracks[nextIndex];
    const sameTrack = currentTrack && nextTrack && currentTrack.src === nextTrack.src;

    setTracks(nextTracks);
    setStationDay(payload.day || "");

    if (options.force || !isPlaying || !sameTrack) {
      setTrackIndex(nextIndex);
      setLiveOffset(payload.nowPlaying?.offsetSeconds || 0);
      setStationTime(payload.stationTime || Date.now());
    }
  }

  async function startCurrentTrack(offsetSeconds = 0) {
    if (!audioRef.current) {
      return;
    }

    const audio = audioRef.current;

    if (Number.isFinite(offsetSeconds) && offsetSeconds > 0) {
      const seek = () => {
        audio.currentTime = Math.min(offsetSeconds, Math.max(0, audio.duration - 1 || offsetSeconds));
      };

      if (audio.readyState >= 1) {
        seek();
      } else {
        audio.addEventListener("loadedmetadata", seek, { once: true });
      }
    }

    await audio.play().catch(() => setIsPlaying(false));
  }

  async function startSpecificTrack(track, offsetSeconds = 0) {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.src = track.src;
    await startCurrentTrack(offsetSeconds);
  }

  function getCurrentLiveOffset() {
    if (!currentTrack || !stationTime) {
      return liveOffset;
    }

    const elapsed = Math.floor((Date.now() - stationTime) / 1000);
    return (liveOffset + elapsed) % currentTrack.durationSeconds;
  }

  return (
    <section className="border-b-2 border-newsprint/25 bg-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-arcade bg-tar text-arcade shadow-glow">
            <Radio size={20} />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-radio">
              Route666 live radio{stationDay ? ` / ${stationDay}` : ""}
            </p>
            <h2 className="truncate font-display text-2xl uppercase leading-none text-bone">
              {currentTrack ? currentTrack.band : "No Tracks Loaded"}
            </h2>
            <p className="truncate font-mono text-xs uppercase text-newsprint">
              {currentTrack ? currentTrack.song : status}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex h-10 w-10 items-center justify-center border-2 border-bone text-bone hover:border-radio hover:text-radio disabled:opacity-40"
            disabled={!currentTrack}
            onClick={togglePlayback}
            title={isPlaying ? "Pause" : "Play"}
            type="button"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div className="flex items-center gap-2 border border-newsprint/40 px-3 py-2 font-mono text-xs uppercase text-newsprint">
            <Volume2 size={15} />
            {tracks.length ? `Live ${trackIndex + 1}/${tracks.length}` : "0/0"}
          </div>
        </div>

        <audio ref={audioRef} onEnded={nextTrack} preload="metadata" />
      </div>
    </section>
  );
}
