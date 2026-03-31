// src/components/feed/FeedItem.tsx
import React, { useState, useEffect, useContext } from 'react';
import type { FeedRow } from '../../utils/feed';
import { BrandingContext } from '../../App';

type Props = { item: FeedRow };

const RED = '#C4161C';
const WHITE = '#FFFFFF';

const API = 'https://script.google.com/macros/s/AKfycbwm0nO0XRsJD2gqWTbfZvRHdKTN0ylbJrWkJt66TcCCiBkX8l7aaV2lF5saHEBwwqeUoA/exec';
const KUNDEN_ID = 'V002';

type SponsorData = { logoUrl?: string; bannerText?: string; bannerBildUrl?: string; linkUrl?: string };

let sponsorCache: SponsorData | null | undefined = undefined;

async function loadSponsor(): Promise<SponsorData | null> {
  if (sponsorCache !== undefined) return sponsorCache;
  try {
    const d = await fetch(`${API}?action=get_sponsors&kundenId=${KUNDEN_ID}`, { redirect: 'follow' }).then(r => r.json());
    const rows = d?.sponsors || [];
    const found = rows.findLast((r: any) => String(r?.Aktiv).toUpperCase() === 'TRUE');
    sponsorCache = found ? {
      logoUrl: found.Logo_URL || undefined,
      bannerText: found.Banner_Text || undefined,
      bannerBildUrl: found.Banner_Bild_URL || undefined,
      linkUrl: found.Banner_Link_URL || undefined,
    } : null;
  } catch {
    sponsorCache = null;
  }
  return sponsorCache;
}

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null;
}

// ─── Social Bar ───────────────────────────────────────────────
const SocialBar: React.FC = () => {
  const branding = useContext(BrandingContext);
  const web = branding?.webUrl || '';
  const fb = branding?.facebookUrl || '';
  const ig = branding?.instagramUrl || '';
  const yt = branding?.youtubeUrl || '';
  const tt = branding?.tiktokUrl || '';
  if (!web && !fb && !ig && !yt && !tt) return null;
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: 14, paddingTop: 12 }}>
      {web && (<a href={web} target="_blank" rel="noopener noreferrer" style={{ lineHeight: 0 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="white" opacity={0.9}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></a>)}
      {fb && (<a href={fb} target="_blank" rel="noopener noreferrer" style={{ lineHeight: 0 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>)}
      {ig && (<a href={ig} target="_blank" rel="noopener noreferrer" style={{ lineHeight: 0 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="#e1306c"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>)}
      {yt && (<a href={yt} target="_blank" rel="noopener noreferrer" style={{ lineHeight: 0 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg></a>)}
      {tt && (<a href={tt} target="_blank" rel="noopener noreferrer" style={{ lineHeight: 0 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="white" opacity={0.9}><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg></a>)}
    </div>
  );
};

// ─── Sponsor Banner ───────────────────────────────────────────
const SponsorBanner: React.FC = () => {
  const [sponsor, setSponsor] = useState<SponsorData | null | undefined>(undefined);

  useEffect(() => {
    loadSponsor().then(s => setSponsor(s));
  }, []);

  if (sponsor === undefined || sponsor === null) return null;

  const inhalt = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {sponsor.logoUrl && (
        <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
          <img src={sponsor.logoUrl} alt="Partner" style={{ width: '100%', height: '100%', objectFit: 'contain' }} referrerPolicy="no-referrer" />
        </div>
      )}
      <div style={{ flex: 1 }}>
        {sponsor.bannerText && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' as const, lineHeight: 1.4 }}>{sponsor.bannerText}</div>}
        {sponsor.linkUrl && <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Mehr erfahren →</div>}
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Partner</div>
      {sponsor.linkUrl
        ? <a href={sponsor.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '10px 14px', textDecoration: 'none' }}>{inhalt}</a>
        : <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '10px 14px' }}>{inhalt}</div>
      }
    </div>
  );
};

// ─── Feed Item ────────────────────────────────────────────────
const FeedItem: React.FC<Props> = ({ item }) => {
  const [imgBroken, setImgBroken] = useState(false);
  const imageUrl = imgBroken ? undefined : (item.image || item.imageUrl);
  const embedUrl = getYouTubeEmbedUrl(item.linkUrl || item.youtubeUrl);

  return (
    <div style={{ borderRadius: 22, overflow: 'hidden', boxShadow: '0 14px 34px rgba(0,0,0,0.25)', background: RED, border: '1px solid rgba(0,0,0,0.08)' }}>
      {imageUrl && (
        <img src={imageUrl} alt={item.title || ''} onError={() => setImgBroken(true)} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
      )}
      {embedUrl && (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={item.title || 'Video'} />
        </div>
      )}
      <div style={{ padding: 16 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', height: 26, padding: '0 12px', borderRadius: 999, fontSize: 12, fontWeight: 900, letterSpacing: '0.6px', textTransform: 'uppercase' as const, background: 'rgba(255,255,255,0.92)', color: RED }}>
          {item.kategorie || 'News'}
        </span>
        {item.title && <div style={{ marginTop: 12, fontSize: 20, fontWeight: 900, color: WHITE, lineHeight: 1.25 }}>{item.title}</div>}
        {item.text && <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: WHITE, whiteSpace: 'pre-wrap' as const }}>{item.text}</div>}
        {item.dateLabel && <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{item.dateLabel}</div>}
        {item.linkUrl && <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 14, padding: '12px 16px', background: WHITE, color: RED, borderRadius: 10, textAlign: 'center' as const, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>{item.linkLabel || 'Mehr erfahren →'}</a>}
        {/* NEU: Social Bar zwischen Inhalt und Sponsor */}
        <SocialBar />
        <SponsorBanner />
      </div>
    </div>
  );
};

export default FeedItem;
