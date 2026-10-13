import { createProfileSubmission } from "@/lib/db";
import { redirectTo } from "@/lib/redirect";
import { saveUpload } from "@/lib/uploads";

const maxBioLength = 1200;
const streamPermissionText = "By checking this box, I confirm this is original music and no covers are included. I give Route666.live permission to stream the music I submit. The music will not be offered as a download. This is a community endeavor and nobody is making money from this site.";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const trap = clean(formData.get("website"));

    if (trap) {
      return redirectTo(request, "/submit?sent=1");
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
      return redirectTo(request, "/submit?error=missing");
    }

    if (bio.length > maxBioLength) {
      return redirectTo(request, "/submit?error=bio");
    }

    if (!photos.length) {
      return redirectTo(request, "/submit?error=photo");
    }

    if (!streamPermission) {
      return redirectTo(request, "/submit?error=permission");
    }

    const photoUploads = [];
    const audioUploads = [];

    for (const photo of photos) {
      if (!photo.type.startsWith("image/")) {
        return redirectTo(request, "/submit?error=file");
      }

      photoUploads.push(await saveUpload(photo));
    }

    for (const song of songs) {
      if (!song.title) {
        return redirectTo(request, "/submit?error=songTitle");
      }

      if (!["audio/mpeg", "audio/mp3"].includes(song.file.type)) {
        return redirectTo(request, "/submit?error=file");
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

    return redirectTo(request, "/submit?sent=1");
  } catch {
    return redirectTo(request, "/submit?error=upload");
  }
}

function clean(value) {
  return String(value || "").trim();
}

function parseLinks(value) {
  return value
    .split(/\r?\n/)
    .map((link) => normalizeHttpUrl(link.trim()))
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function isRealFile(file) {
  return file && typeof file === "object" && file.size > 0;
}
