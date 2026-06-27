"use client";

import { useMemo, useState } from "react";
import { ShowCard } from "@/components/ShowCard";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ShowDayFilter({ shows }) {
  const days = useMemo(() => buildNextSevenDays(), []);
  const [selectedDate, setSelectedDate] = useState(days[0].key);

  const filteredShows = shows.filter((show) => toDateKey(new Date(show.starts_at)) === selectedDate);
  const selectedDay = days.find((day) => day.key === selectedDate);

  return (
    <section id="upcoming-shows">
      <div className="mb-4 border-2 border-newsprint bg-ink p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-radio">Upcoming Shows</p>
          <h2 className="mt-1 font-display text-3xl uppercase text-bone">Pick a Day</h2>
          <p className="mt-1 font-mono text-xs uppercase text-newsprint">Pick a day, catch the signal</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <button
              className={`border px-3 py-2 text-left font-mono text-xs uppercase transition ${
                selectedDate === day.key
                  ? "border-radio bg-radio text-ink"
                  : "border-newsprint/45 text-newsprint hover:border-bone hover:text-bone"
              }`}
              key={day.key}
              onClick={() => setSelectedDate(day.key)}
              type="button"
            >
              <span className="block">{day.weekday}</span>
              <span className="block">{day.label}</span>
            </button>
          ))}
          <a className="border border-newsprint/45 px-3 py-2 font-mono text-xs uppercase text-radio hover:border-arcade hover:text-arcade" href="/shows">
            All Shows
          </a>
        </div>
        </div>
      </div>

      {filteredShows.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {filteredShows.map((show) => <ShowCard key={show.id} show={show} />)}
        </div>
      ) : (
        <div className="border-2 border-newsprint bg-ink p-5 text-newsprint">
          No shows listed for {selectedDay?.weekday} {selectedDay?.label}. Check another day.
        </div>
      )}
    </section>
  );
}

function buildNextSevenDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_item, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      key: toDateKey(date),
      weekday: index === 0 ? "Today" : dayNames[date.getDay()],
      label: `${monthNames[date.getMonth()]} ${date.getDate()}`
    };
  });
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
