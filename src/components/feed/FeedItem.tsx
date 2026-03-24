// src/components/feed/FeedItem.tsx
import React, { useState } from 'react';
import type { FeedRow } from '../../utils/feed';

type Props = { item: FeedRow };

const RED = '#C4161C';
const WHITE = '#FFFFFF';
const CARD_BG = 'linear-gradient(180deg, rgba(196,22,28,0.78), rgba(196,22,28,0.26))';

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null;
}

const FeedItem: React.FC<Props> = ({ item }) => {
  const [imgBroken, setImgBroken] = useState(false);
  const imageUrl = imgBroken ? undefined : (item.image || item.imageUrl);
  const embedUrl = getYouTubeEmbedUrl(item.linkUrl || item.youtubeUrl);

  return (
    <div style={{
      borderRadius: 22, overflow: 'hidden',
      boxShadow: '0 14px 34px rgba(0,0,0,0.25)',
      background: CARD_BG,
      border: '1px solid rgba(0,0,0,0.08)',
    }}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={item.title || ''}
          onError={() => setImgBroken(true)}
          style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
        />
      )}
      {embedUrl && (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={embedUrl}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={item.title || 'Video'}
          />
        </div>
      )}
      <div style={{ padding: 16 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          height: 26, padding: '0 12px', borderRadius: 999,
          fontSize: 12, fontWeight: 900, letterSpacing: '0.6px',
          textTransform: 'uppercase' as const,
          background: 'rgba(255,255,255,0.92)', color: RED,
        }}>
          {item.kategorie || 'News'}
        </span>
        {item.title && (
          <div style={{ marginTop: 12, fontSize: 20, fontWeight: 900, color: WHITE, lineHeight: 1.25 }}>
            {item.title}
          </div>
        )}
        {item.text && (
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: WHITE, whiteSpace: 'pre-wrap' as const }}>
            {item.text}
          </div>
        )}
        {item.dateLabel && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            {item.dateLabel}
          </div>
        )}
        {item.linkUrl && (
          
            href={item.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', marginTop: 14, padding: '12px 16px',
              background: WHITE, color: RED,
              borderRadius: 10, textAlign: 'center' as const,
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
            }}
          >
            {item.linkLabel || 'Mehr erfahren →'}
          </a>
        )}
      </div>
    </div>
  );
};

export default FeedItem;
