import { CalendarDays, MapPin, Ticket, Users } from "lucide-react";

const formatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

export function ShowCard({ show }) {
  const date = new Date(show.starts_at);

  return (
    <article className="border-2 border-newsprint bg-ink p-5 transition hover:-translate-y-1 hover:border-radio">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase text-arcade">{show.venue}</p>
          <h3 className="mt-2 font-display text-3xl uppercase leading-none text-bone">{show.title}</h3>
          {show.band_name ? (
            <p className="mt-2 font-mono text-xs uppercase text-radio">{show.band_name} / {show.genre}</p>
          ) : null}
        </div>
        <span className="border border-bone px-2 py-1 font-mono text-xs uppercase text-bone">{show.city}</span>
      </div>
      {show.flyer_path ? (
        <img className="mt-4 aspect-[4/3] w-full border-2 border-newsprint object-cover" src={show.flyer_path} alt={`${show.title} flyer`} />
      ) : null}
      <p className="mt-4 leading-7 text-newsprint">{show.description}</p>
      <div className="mt-5 grid gap-2 font-mono text-sm text-newsprint">
        <span className="flex items-center gap-2"><CalendarDays size={16} /> {formatter.format(date)}</span>
        <span className="flex items-center gap-2"><MapPin size={16} /> {show.address || "Address TBA"}</span>
        <span className="flex items-center gap-2"><Users size={16} /> {show.age_restriction || "All ages"}</span>
        <span className="flex items-center gap-2"><Ticket size={16} /> {show.price || "Cover TBA"}</span>
      </div>
    </article>
  );
}
