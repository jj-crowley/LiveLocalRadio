import { NextResponse } from "next/server";
import { createProfileSubmission } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";

const maxBioLength = 1200;
const streamPermissionText = "By checking this box, I confirm this is original music and no covers are included. I give Route666.live permission to stream the music I submit. The music will not be offered as a download. This is a community endeavor and nobody is making money from this site.";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const trap = clean(formData.get("website"));

    if (trap) {
      return NextResponse.redirect(new URL("/submit?sent=1", request.url), { status: 303 });
    }

    const bandName = clean(formData.get("bandName"));
    const contactName = clean(formData.get("contactName"));
    const contactEmail = clean(formData.get("contactEmail"));
    const genre = clean(formData.get("genre"));
    const hometown = clean(formData.get("hometown"));
    const bio = clean(formData.get("bio"));
    const streamPermission = clean(formData.get("streamPermission")) === "yes";
    const links = parseLinks(clean(formData.get("links")));
    const photos = formData.getAll("photos").filter(isRealFile).slice(0, 3);
    const songs = [1, 2, 3]
      .map((number) => ({
        file: formData.get(`mp3${number}`),
        title: clean(formData.get(`songTitle${number}`))
      }))
      .filter((song) => isRealFile(song.file));

    if (!bandName || !contactEmail || !bio) {
      return NextResponse.redirect(new URL("/submit?error=missing", request.url), { status: 303 });
    }

    if (bio.length > maxBioLength) {
      return NextResponse.redirect(new URL("/submit?error=bio", request.url), { status: 303 });
    }

    if (!photos.length) {
      return NextResponse.redirect(new URL("/submit?error=photo", request.url), { status: 303 });
    }

    if (!streamPermission) {
      return NextResponse.redirect(new URL("/submit?error=permission", request.url), { status: 303 });
    }

    const photoUploads = [];
    const audioUploads = [];

    for (const photo of photos) {
      if (!photo.type.startsWith("image/")) {
        return NextResponse.redirect(new URL("/submit?error=file", request.url), { status: 303 });
      }

      photoUploads.push(await saveUpload(photo));
    }

    for (const song of songs) {
      if (!song.title) {
        return NextResponse.redirect(new URL("/submit?error=songTitle", request.url), { status: 303 });
      }

      if (!["audio/mpeg", "audio/mp3"].includes(song.file.type)) {
        return NextResponse.redirect(new URL("/submit?error=file", request.url), { status: 303 });
      }

      const upload = await saveUpload(song.file, {
        metadata: {
          artist: bandName,
          title: song.title
        }
      });
      audioUploads.push({
        path: upload.path,
        title: song.title
      });
    }

    createProfileSubmission({
      bandName,
      contactName,
      contactEmail,
      genre,
      hometown,
      bio,
      links,
      photoPaths: photoUploads.map((upload) => upload.path),
      audioPaths: audioUploads,
      streamPermission,
      streamPermissionText
    });

    return NextResponse.redirect(new URL("/submit?sent=1", request.url), { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/submit?error=upload", request.url), { status: 303 });
  }
}

function clean(value) {
  return String(value || "").trim();
}

function parseLinks(value) {
  return value
    .split(/\r?\n/)
    .map((link) => link.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function isRealFile(file) {
  return file && typeof file === "object" && file.size > 0;
}
