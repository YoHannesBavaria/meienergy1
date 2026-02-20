export type LegacyMenuItem = {
  label: string;
  href: string;
};

export type LegacyPage = {
  id: string;
  url: string;
  path: string;
  title: string;
  excerpt: string;
  text: string;
  html: string;
  heroImage: string;
  contentImages?: string[];
  updatedAt: string;
  category: string;
};

export type LegacySiteStructure = {
  generatedAt: string;
  source: string;
  hostAllowList: string[];
  pageCount: number;
  primaryMenu: LegacyMenuItem[];
  routePaths: string[];
  pages: LegacyPage[];
};

export type InternalMenuItem = {
  label: string;
  href: string;
  path: string | null;
  external: boolean;
};

export type SiteContent = {
  generatedAt: string;
  source: string;
  sourceLabel: string;
  hostAllowList: string[];
  menu: LegacyMenuItem[];
  menuItems: InternalMenuItem[];
  pages: LegacyPage[];
  routes: string[];
};
