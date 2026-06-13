import {
  Activity,
  Fingerprint,
  LayoutGrid,
  Shield,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
      { href: "/users", label: "Users", icon: Users },
    ],
  },
  {
    title: "Operate",
    items: [
      { href: "/config", label: "Config", icon: SlidersHorizontal },
      { href: "/runtime", label: "Runtime", icon: Activity },
      { href: "/security", label: "Security", icon: Shield },
      { href: "/fingerprints", label: "Fingerprints", icon: Fingerprint },
    ],
  },
];

/** Section title + page label for the topbar breadcrumb, keyed by pathname. */
export const PAGE_TITLES: Record<string, [section: string, label: string]> = Object.fromEntries(
  NAV.flatMap((section) => section.items.map((item) => [item.href, [section.title, item.label]])),
);
