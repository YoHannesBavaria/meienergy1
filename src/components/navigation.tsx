"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { InternalMenuItem } from "@/types/content";

type Props = {
  menuItems: InternalMenuItem[];
};

type MenuLink = {
  key: string;
  label: string;
  href: string;
  external: boolean;
};

export function Navigation({ menuItems }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const links = useMemo(() => {
    const list: MenuLink[] = [];
    for (const item of menuItems) {
      const href = item.path || item.href;
      if (list.find((entry) => entry.href === href)) continue;
      list.push({
        key: `${item.label}-${href}`,
        label: item.label,
        href,
        external: item.external,
      });
    }

    if (!list.find((item) => item.href === "/library")) {
      list.push({
        key: "library",
        label: "Inhaltsindex",
        href: "/library",
        external: false,
      });
    }

    return list.slice(0, 12);
  }, [menuItems]);

  return (
    <header className="topbar">
      <div className="container topbar-row">
        <Link href="/" className="brand-lockup" onClick={() => setIsOpen(false)}>
          <span className="brand-logo-wrap">
            <Image
              src="/legacy-assets/meienergy.de/wp-content/uploads/2021/09/NEU-Mei_Energy_Logo.png"
              alt="Mei Energy"
              width={168}
              height={54}
              className="brand-logo"
              priority
            />
          </span>
          <span className="brand-sub">relaunch award edition</span>
        </Link>

        <button
          type="button"
          className={`menu-toggle ${isOpen ? "is-open" : ""}`}
          aria-label={isOpen ? "Navigation schliessen" : "Navigation oeffnen"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`menu-list ${isOpen ? "is-open" : ""}`} aria-label="Hauptnavigation">
          {links.map((item) =>
            item.external ? (
              <a key={item.key} href={item.href} target="_blank" rel="noreferrer" onClick={() => setIsOpen(false)}>
                {item.label}
              </a>
            ) : (
              <Link key={item.key} href={item.href} onClick={() => setIsOpen(false)}>
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
