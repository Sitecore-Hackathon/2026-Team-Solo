"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Settings, Sparkles } from "lucide-react";

const navItems = [
  { href: "/personalize-connect", label: "Experience Connector", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/docs", label: "Docs", icon: BookOpen },
] as const;

export function FooterNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-10 border-t border-border bg-background px-4 py-2">
      <div className="flex items-center gap-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={label}
            className={
              pathname === href || pathname.startsWith(href + "/")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            <Icon className="h-5 w-5" aria-hidden />
          </Link>
        ))}
      </div>
    </nav>
  );
}
