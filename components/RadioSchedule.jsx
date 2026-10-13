import { Clock3, Disc3, Radio } from "lucide-react";

export function RadioSchedule({ currentArtist, schedule }) {
  const entries = schedule.entries || [];
  const currentEntry = entries.find((entry) => entry.isCurrent);

  return (
    <section className="border-2 border-newsprint bg-ink p-4 shadow-glow sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-radio">Today on AM 666</p>
          <h2 className="mt-2 font-display text-3xl uppercase leading-none text-bone">Now Playing</h2>
        </div>
        <div className="flex w-fit items-center gap-2 border border-newsprint/40 px-3 py-2 font-mono text-xs uppercase text-newsprint">
          <Clock3 size={15} />
          {schedule.day || "Station day"}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <CurrentArtistCard artist={currentArtist} currentEntry={currentEntry} />

      <div className="border border-newsprint/35 bg-tar p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl uppercase leading-none text-bone">Midnight to Midnight</h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-newsprint">{entries.length} plays</span>
        </div>
        <div className="max-h-[430px] overflow-y-auto border-y border-newsprint/40">
        {entries.length ? (
          entries.map((entry) => (
            <div
              className={`grid grid-cols-[66px_1fr] gap-2 border-b border-newsprint/20 px-2 py-2 ${
                entry.isCurrent ? "bg-bone text-ink" : "text-newsprint"
              }`}
              key={entry.id}
            >
              <span className={`font-mono text-[10px] uppercase ${entry.isCurrent ? "text-rust" : "text-arcade"}`}>
                {entry.startLabel}
              </span>
              <div className="min-w-0">
                <p className={`truncate font-display text-lg uppercase leading-none ${entry.isCurrent ? "text-ink" : "text-bone"}`}>
                  {entry.track.band}
                </p>
                <p className="mt-1 truncate font-mono text-[10px] uppercase">
                  {entry.track.song}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="grid min-h-40 place-items-center p-6 text-center text-newsprint">
            <div>
              <Radio className="mx-auto text-arcade" size={26} />
              <p className="mt-3 font-mono text-sm uppercase">Drop MP3s into storage/radio to build today&apos;s schedule.</p>
            </div>
          </div>
        )}
        </div>
      </div>
      </div>
    </section>
  );
}

function CurrentArtistCard({ artist, currentEntry }) {
  if (!currentEntry) {
    return (
      <div className="mt-4 border-2 border-newsprint bg-tar p-4 text-newsprint">
        <p className="font-mono text-sm uppercase">No track is currently scheduled.</p>
      </div>
    );
  }

  return (
    <article className="grid gap-5 border-4 border-bone bg-bone p-4 text-ink shadow-flyer md:grid-cols-[minmax(220px,.85fr)_1fr]">
      {artist?.image_path ? (
        <div className="grid min-h-[260px] place-items-center border-2 border-ink bg-newsprint p-2 md:min-h-[360px]">
          <img className="max-h-[420px] w-full object-contain" src={artist.image_path} alt={artist.name} />
        </div>
      ) : (
        <div className="grid min-h-[260px] place-items-center border-2 border-ink bg-newsprint text-rust md:min-h-[360px]">
          <Disc3 size={72} />
        </div>
      )}
      <div className="min-w-0 self-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-rust">On air</p>
        <h3 className="mt-3 font-display text-5xl uppercase leading-[0.85] sm:text-6xl">{currentEntry.track.band}</h3>
        <p className="mt-4 inline-block border-2 border-ink bg-radio px-3 py-2 font-mono text-xs uppercase text-ink">
          {currentEntry.track.song}
        </p>
        <p className="mt-5 whitespace-pre-wrap text-base leading-8 sm:text-lg">
          {artist?.bio || "No artist bio has been matched yet. Add a band profile using the same artist name as the MP3 filename before the dash."}
        </p>
      </div>
    </article>
  );
}
