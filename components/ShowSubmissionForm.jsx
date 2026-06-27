"use client";

import { useState } from "react";
import { ImagePlus, Send, Sparkles } from "lucide-react";

function getInitialState() {
  return {
    venue: "",
    address: "",
    city: "",
    showDate: formatDateInput(new Date()),
    showTime: getDefaultTime(),
    bandName: "",
    genre: "",
    cover: "",
    ageRestriction: "all ages"
  };
}

export function ShowSubmissionForm() {
  const [fields, setFields] = useState(getInitialState);
  const [flyer, setFlyer] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  function updateField(event) {
    setFields((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function submitShow(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const startsAt = normalizeDateTime(fields.showDate, fields.showTime);

    if (!startsAt) {
      setStatus({ state: "error", message: "Use a valid date and time. Examples: 8pm, 8:30pm, 20:30." });
      return;
    }

    setStatus({ state: "loading", message: "Sending the signal..." });

    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (key !== "showDate" && key !== "showTime") {
        formData.append(key, value);
      }
    });
    formData.append("startsAt", startsAt);

    if (flyer) {
      formData.append("flyer", flyer);
    }

    const response = await fetch("/api/show-submissions", {
      method: "POST",
      body: formData
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus({ state: "error", message: payload.error || "The transmission broke up. Try again." });
      return;
    }

    setFields(getInitialState());
    setFlyer(null);
    form.reset();
    setStatus({ state: "success", message: "Show submitted. It is waiting for review before it hits the listings." });
  }

  return (
    <form className="border-2 border-newsprint bg-ink p-5 shadow-glow" onSubmit={submitShow}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Venue" name="venue" value={fields.venue} onChange={updateField} required />
          <TextField label="City" name="city" value={fields.city} onChange={updateField} required />
        </div>

        <TextField label="Address" name="address" value={fields.address} onChange={updateField} required />

        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Date" name="showDate" type="date" value={fields.showDate} onChange={updateField} required />
          <TextField label="Time" name="showTime" value={fields.showTime} onChange={updateField} placeholder="8pm / 8:30pm / 20:30" required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Band Name" name="bandName" value={fields.bandName} onChange={updateField} required />
          <TextField label="Genre" name="genre" value={fields.genre} onChange={updateField} required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Cover" name="cover" value={fields.cover} onChange={updateField} placeholder="$10 / donation / free" />
          <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
            All Ages or 21+
            <select
              className="border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio"
              name="ageRestriction"
              onChange={updateField}
              value={fields.ageRestriction}
            >
              <option value="all ages">All ages</option>
              <option value="21+">21+</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
          Flyer
          <span className="flex min-h-28 items-center justify-center border-2 border-dashed border-newsprint bg-tar px-4 py-6 text-center text-sm normal-case text-newsprint">
            <span className="grid gap-2 justify-items-center">
              <ImagePlus className="text-radio" size={28} />
              <span>{flyer ? flyer.name : "JPEG, PNG, WEBP, or GIF"}</span>
            </span>
          </span>
          <input
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            name="flyer"
            onChange={(event) => setFlyer(event.target.files?.[0] || null)}
            required
            type="file"
          />
        </label>

        <button
          className="inline-flex w-fit items-center gap-2 border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer transition hover:bg-arcade disabled:cursor-wait disabled:opacity-70"
          disabled={status.state === "loading"}
          type="submit"
        >
          {status.state === "loading" ? <Sparkles size={16} /> : <Send size={16} />}
          Submit Show
        </button>

        {status.message ? (
          <p className={`font-mono text-sm ${status.state === "error" ? "text-rust" : "text-arcade"}`}>
            {status.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function normalizeDateTime(dateValue, timeValue) {
  const date = parseDate(dateValue);
  const time = parseTime(timeValue);

  if (!date || !time) {
    return null;
  }

  return `${date}T${time}`;
}

function parseDate(value) {
  const trimmed = String(value || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slashDate = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashDate) {
    const month = Number(slashDate[1]);
    const day = Number(slashDate[2]);
    const year = Number(slashDate[3]);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return null;
}

function parseTime(value) {
  const trimmed = String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const match = trimmed.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm)?$/);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = match[2] === undefined ? 0 : Number(match[2]);
  const period = match[3];

  if (period === "pm" && hour < 12) {
    hour += 12;
  }

  if (period === "am" && hour === 12) {
    hour = 0;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultTime() {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return `${String(date.getHours()).padStart(2, "0")}:00`;
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
