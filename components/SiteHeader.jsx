import Link from "next/link";
import { RadioTower } from "lucide-react";

const navItems = [
  { href: "/artists", label: "Artists" },
  { href: "/submit", label: "Submit Profile" },
  { href: "/local-noise", label: "Local Noise" },
  { href: "/ok-gramps", label: "OK Gramps" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  return (
    <header className="border-b-2 border-newsprint/25 bg-tar/92">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="grid h-11 w-11 place-items-center border-2 border-radio bg-ink text-radio shadow-glow">
            <RadioTower size={23} />
          </span>
          <span>
            <span className="block font-display text-2xl uppercase leading-none text-bone">Route666.live</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-arcade">Desert noise bulletin</span>
          </span>
        </Link>
        <nav className="flex flex-wrap gap-2 font-mono text-xs uppercase text-newsprint">
          {navItems.map((item) => (
            <Link className="border border-newsprint/35 px-3 py-2 hover:border-radio hover:text-radio" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
