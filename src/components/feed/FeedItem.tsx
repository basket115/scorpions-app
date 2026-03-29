// src/components/feed/FeedItem.tsx
import React, { useState, useEffect } from 'react';
import type { FeedRow } from '../../utils/feed';

type Props = { item: FeedRow };

const RED = '#C4161C';
const WHITE = '#FFFFFF';

const API = 'https://script.google.com/macros/s/AKfycbwm0nO0XRsJD2gqWTbfZvRHdKTN0ylbJrWkJt66TcCCiBkX8l7aaV2lF5saHEBwwqeUoA/exec';
const KUNDEN_ID = 'V046'; // ← nur das ändern!

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
        <SponsorBanner />
      </div>
    </div>
  );
};

export default FeedItem;
