"use client";

import { useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";

export function AdminShowsManager({ shows }) {
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const selectedShow = useMemo(
    () => shows.find((show) => String(show.id) === String(selectedId)),
    [selectedId, shows]
  );

  function selectShow(show) {
    const nextSelectedId = selectedId === show.id ? null : show.id;
    setSelectedId(nextSelectedId);
    setStatus({ state: "idle", message: "" });

    if (!nextSelectedId) {
      setForm(null);
      return;
    }

    setForm({
      title: show.title || "",
      venue: show.venue || "",
      address: show.address || "",
      city: show.city || "",
      startsAt: toDateTimeLocal(show.starts_at),
      bandName: show.band_name || "",
      genre: show.genre || "",
      ageRestriction: show.age_restriction || "all ages",
      price: show.price || "",
      description: show.description || ""
    });
  }

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function saveShow(event) {
    event.preventDefault();

    if (!selectedShow || !form) {
      return;
    }

    setStatus({ state: "loading", message: "Updating show..." });

    const response = await fetch(`/api/admin/shows/${selectedShow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      setStatus({ state: "error", message: "Could not update that show." });
      return;
    }

    setStatus({ state: "success", message: "Show updated. Reloading calendar..." });
    window.location.reload();
  }

  async function deleteSelectedShow() {
    if (!selectedShow) {
      return;
    }

    setStatus({ state: "loading", message: "Deleting show..." });

    const response = await fetch(`/api/admin/shows/${selectedShow.id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setStatus({ state: "error", message: "Could not delete that show." });
      return;
    }

    setStatus({ state: "success", message: "Show deleted. Reloading calendar..." });
    window.location.reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
      <section className="border-2 border-newsprint bg-ink p-4">
        <h2 className="font-display text-3xl uppercase text-bone">Calendar Shows</h2>
        <div className="mt-5 grid gap-3">
          {shows.length === 0 ? (
            <p className="text-newsprint">No shows in the calendar.</p>
          ) : shows.map((show) => (
            <label className="grid cursor-pointer grid-cols-[24px_1fr] gap-3 border border-newsprint/40 bg-tar p-3 hover:border-radio" key={show.id}>
              <input
                checked={selectedId === show.id}
                className="mt-1 h-4 w-4 accent-radio"
                onChange={() => selectShow(show)}
                type="checkbox"
              />
              <span>
                <span className="block font-display text-2xl uppercase leading-none text-bone">{show.title}</span>
                <span className="mt-2 block font-mono text-xs uppercase text-arcade">{formatShowDate(show.starts_at)}</span>
                <span className="mt-1 block font-mono text-xs uppercase text-newsprint">{show.venue} / {show.city}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="border-2 border-newsprint bg-ink p-5">
        <h2 className="font-display text-3xl uppercase text-bone">Update / Delete</h2>
        {!selectedShow || !form ? (
          <p className="mt-5 leading-7 text-newsprint">Select one show with the checkbox to edit or delete it.</p>
        ) : (
          <form className="mt-5 grid gap-4" onSubmit={saveShow}>
            <TextField label="Title" name="title" onChange={updateField} required value={form.title} />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Venue" name="venue" onChange={updateField} required value={form.venue} />
              <TextField label="City" name="city" onChange={updateField} required value={form.city} />
            </div>
            <TextField label="Address" name="address" onChange={updateField} value={form.address} />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Date and Time" name="startsAt" onChange={updateField} required type="datetime-local" value={form.startsAt} />
              <TextField label="Band Name" name="bandName" onChange={updateField} value={form.bandName} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="Genre" name="genre" onChange={updateField} value={form.genre} />
              <TextField label="Cover" name="price" onChange={updateField} placeholder="$10 / donation / free" value={form.price} />
              <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
                All Ages or 21+
                <select className="border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name="ageRestriction" onChange={updateField} value={form.ageRestriction}>
                  <option value="all ages">All ages</option>
                  <option value="21+">21+</option>
                </select>
              </label>
            </div>
            <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
              Description
              <textarea className="min-h-28 border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name="description" onChange={updateField} required value={form.description} />
            </label>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer hover:bg-arcade" type="submit">
                <Save size={16} />
                Update Show
              </button>
              <button className="inline-flex items-center gap-2 border-2 border-rust px-4 py-3 font-mono text-sm uppercase text-rust hover:bg-rust hover:text-bone" onClick={deleteSelectedShow} type="button">
                <Trash2 size={16} />
                Delete Show
              </button>
            </div>
            {status.message ? (
              <p className={`font-mono text-sm ${status.state === "error" ? "text-rust" : "text-arcade"}`}>{status.message}</p>
            ) : null}
          </form>
        )}
      </section>
    </div>
  );
}

function TextField({ label, name, type = "text", value, onChange, placeholder = "", required = false }) {
  return (
    <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
      {label}
      <input
        className="border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

function formatShowDate(value) {
  const date = new Date(value);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}, ${displayHour}:${minutes} ${period}`;
}
