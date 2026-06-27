"use client";

import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { VideoShareBox } from "@/components/VideoShareBox";

export function BandVideoPlayer({ videos, initialVideoId }) {
  const initialVideo = useMemo(() => {
    return videos.find((video) => video.id === initialVideoId) || videos[0] || null;
  }, [initialVideoId, videos]);
  const [selectedVideo, setSelectedVideo] = useState(initialVideo);

  function selectVideo(video) {
    setSelectedVideo(video);
    const nextUrl = `/band/video?v=${encodeURIComponent(video.id)}`;
    window.history.replaceState(null, "", nextUrl);
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_.8fr] lg:px-8">
      <section>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-radio">Unlisted transmission</p>
        <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">Band Video</h1>
        <div className="mt-8 border-2 border-newsprint bg-ink p-3">
          {selectedVideo ? (
            <video key={selectedVideo.id} className="aspect-video w-full bg-tar" controls playsInline preload="metadata" src={selectedVideo.src} />
          ) : (
            <div className="grid aspect-video place-items-center bg-tar p-6 text-center text-newsprint">
              Drop a video file into storage/videos. Supported: MP4, WEBM, OGG.
            </div>
          )}
        </div>

        {videos.length > 1 ? (
          <div className="mt-8 border-y-2 border-newsprint py-5">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-rust">More reels</p>
            <div className="mt-4 grid gap-3">
              {videos.map((video) => {
                const active = selectedVideo?.id === video.id;

                return (
                  <button
                    className={`group grid gap-2 border-2 p-4 text-left transition ${
                      active
                        ? "border-radio bg-radio text-ink shadow-flyer"
                        : "border-newsprint bg-tar text-bone hover:border-arcade hover:text-arcade"
                    }`}
                    key={video.id}
                    onClick={() => selectVideo(video)}
                    type="button"
                  >
                    <span className="flex items-center gap-2 font-display text-2xl uppercase">
                      <Play size={18} />
                      {video.title}
                    </span>
                    {video.description ? <span className={`leading-7 ${active ? "text-ink" : "text-newsprint"}`}>{video.description}</span> : null}
                    <span className="font-mono text-xs uppercase tracking-[0.2em]">
                      {[video.band, video.song, video.year, video.venue].filter(Boolean).join(" / ") || "Route666 video"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <aside className="grid gap-5 self-start">
        <div className="paper-edge border-4 border-ink bg-newsprint p-5 text-ink shadow-flyer">
          <p className="font-mono text-xs uppercase text-rust">Iframe ready</p>
          <h2 className="mt-2 font-display text-3xl uppercase">{selectedVideo?.title || "No Video Loaded"}</h2>
          {selectedVideo?.description ? <p className="mt-4 leading-7">{selectedVideo.description}</p> : null}
          <p className="mt-4 leading-7">
            This page is intentionally unlisted. Use the embed code to place the selected video on another website.
          </p>
        </div>
        <VideoShareBox selectedVideoId={selectedVideo?.id} />
      </aside>
    </div>
  );
}
