import { createContactMessage } from "@/lib/db";
import { redirectTo } from "@/lib/redirect";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = clean(formData.get("name"));
    const email = clean(formData.get("email"));
    const message = clean(formData.get("message"));

    if (!name || !email || !message) {
      return redirectTo(request, "/contact?error=1");
    }

    createContactMessage({ name, email, message });
    return redirectTo(request, "/contact?sent=1");
  } catch {
    return redirectTo(request, "/contact?error=1");
  }
}

function clean(value) {
  return String(value || "").trim();
}
