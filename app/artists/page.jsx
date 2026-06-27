import { BandCard } from "@/components/BandCard";
import { getBands } from "@/lib/db";

export const metadata = {
  title: "Artists & Bands | Route666.live"
};

export default function ArtistsPage() {
  const bands = getBands();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-arcade">Amplifiers in the wash</p>
      <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">Artists / Bands</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {bands.map((band) => <BandCard key={band.id} band={band} />)}
      </div>
    </div>
  );
}
