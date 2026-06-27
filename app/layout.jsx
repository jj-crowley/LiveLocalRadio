import "./globals.css";
import { RadioPlayer } from "@/components/RadioPlayer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Route666.live",
  description: "Underground desert bands, radio, flyers, videos, and OK Gramps dispatches."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <RadioPlayer />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
