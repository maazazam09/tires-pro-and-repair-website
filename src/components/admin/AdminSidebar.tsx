"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Image, Package, Wrench, Star, Ticket, Settings, Search, MessageSquare, LogOut, Layers,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/hero", label: "Hero Banner", icon: Image },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/gallery", label: "Gallery", icon: Image },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
  { href: "/admin/seo", label: "SEO", icon: Search },
  { href: "/admin/submissions", label: "Submissions", icon: MessageSquare },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card p-4">
      <Link href="/" className="font-display text-lg font-bold uppercase text-white">
        Tire Pro Admin
      </Link>
      <nav className="mt-8 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
              pathname === href ? "bg-accent text-white" : "text-metallic hover:bg-black/5 hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="mt-8 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-metallic hover:bg-black/5 hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </aside>
  );
}
