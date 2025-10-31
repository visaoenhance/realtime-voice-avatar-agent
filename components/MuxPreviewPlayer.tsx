'use client';

import dynamic from 'next/dynamic';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

type MuxPreviewPlayerProps = {
  playbackId: string;
  title: string;
  poster?: string;
};

export function MuxPreviewPlayer({ playbackId, title, poster }: MuxPreviewPlayerProps) {
  if (!playbackId) {
    return null;
  }

  return (
    <MuxPlayer
      className="w-full rounded-xl border border-black/40"
      playbackId={playbackId}
      metadata={{ video_id: playbackId, video_title: title }}
      streamType="on-demand"
      autoPlay
      playsInline
      poster={poster}
      accentColor="#e50914"
    />
  );
}
