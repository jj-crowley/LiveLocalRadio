import { redirect } from "next/navigation";

export default function AdminShowsRedirectPage() {
  redirect("/admin/messages");
}
