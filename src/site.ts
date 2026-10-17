export interface NavItem {
  label: string;
  href: string;
}

export const SITE = {
  // Feeds canonical URLs, RSS and sitemap. DNS + hosting: see SETUP.md.
  url: 'https://timwhite.ninja',
  title: 'Case Files',
  tagline: 'Investigative notes on AI agents, with the evidence attached.',
  author: 'Tim White',
  lang: 'en',
  nav: [
    { label: 'Posts', href: '/posts/' },
    { label: 'Evidence', href: '/evidence/' },
    { label: 'Tags', href: '/tags/' },
    { label: 'About', href: '/about/' },
    { label: 'RSS', href: '/rss.xml' },
  ] satisfies NavItem[],
};
