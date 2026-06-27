import { Disc3, MapPinned } from "lucide-react";

export function BandCard({ band }) {
  return (
    <article className="grid gap-4 border-2 border-newsprint bg-tar p-4 sm:grid-cols-[96px_1fr]">
      <div className="grid aspect-square place-items-center border-2 border-rust bg-ink text-radio">
        <Disc3 size={38} />
      </div>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-2xl uppercase text-bone">{band.name}</h3>
          <span className="font-mono text-xs uppercase text-arcade">{band.genre}</span>
        </div>
        <p className="mt-2 leading-7 text-newsprint">{band.bio}</p>
        <p className="mt-3 flex items-center gap-2 font-mono text-xs uppercase text-radio">
          <MapPinned size={15} /> {band.hometown}
        </p>
      </div>
    </article>
  );
}
