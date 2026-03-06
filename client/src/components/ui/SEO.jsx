/**
 * ===========================================
 * SEO Component (react-helmet-async)
 * ===========================================
 *
 * Reusable component that injects <head> meta tags
 * for SEO and social sharing (Open Graph + Twitter Cards).
 *
 * Usage:
 *   <SEO
 *     title="Browse Films"
 *     description="Discover and invest in upcoming film projects."
 *   />
 *
 *   <SEO
 *     title={film.title}
 *     description={film.description}
 *     image={film.poster}
 *     type="article"
 *   />
 *
 * How it works:
 *   - Uses react-helmet-async's <Helmet> to inject tags into <head>
 *   - <HelmetProvider> in main.jsx provides the context
 *   - The LAST rendered <Helmet> wins for duplicate tags,
 *     so page-level SEO overrides the defaults in index.html
 */

import { Helmet } from 'react-helmet-async';

// Default values — used when a page doesn't provide them
const DEFAULTS = {
  siteName: 'CineVest',
  title: 'CineVest — Invest in Films',
  description:
    'CineVest is a film investment platform where you can browse upcoming projects, invest via card or crypto, and track your ROI in real-time.',
  image: '/og-image.png', // Place a 1200×630 image here for social previews
  url: 'https://cinevest.com',
  type: 'website',
};

function SEO({
  title,
  description = DEFAULTS.description,
  image = DEFAULTS.image,
  url,
  type = DEFAULTS.type,
  noIndex = false,
}) {
  // Format the page title: "Films | CineVest" or just "CineVest — Invest in Films"
  const fullTitle = title
    ? `${title} | ${DEFAULTS.siteName}`
    : DEFAULTS.title;

  // Build absolute URL for og:image (relative paths don't work on social platforms)
  const absoluteImage = image?.startsWith('http')
    ? image
    : `${DEFAULTS.url}${image}`;

  return (
    <Helmet>
      {/* ─── Basic HTML Meta ─────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Prevent indexing if requested (e.g. admin pages, verify page) */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* ─── Open Graph (Facebook, LinkedIn, Discord) ─── */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={DEFAULTS.siteName} />
      {url && <meta property="og:url" content={url} />}

      {/* ─── Twitter / X Card ────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
    </Helmet>
  );
}

export default SEO;
