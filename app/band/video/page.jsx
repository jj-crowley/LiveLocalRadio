import { BandVideoPlayer } from "@/components/BandVideoPlayer";
import { getBandVideo, getBandVideos } from "@/lib/videos";

export const metadata = {
  title: "Band Video | Route666.live"
};

export const dynamic = "force-dynamic";

export default async function BandVideoPage({ searchParams }) {
  const query = await searchParams;
  const videos = getBandVideos();
  const video = getBandVideo(query?.v || query?.file);

  return <BandVideoPlayer initialVideoId={video?.id} videos={videos} />;
}
