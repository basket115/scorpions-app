import React from 'react';
import { zerlegeText, TextStueck } from '../utils/textformat';

// Zeigt den Text eines Beitrags im Textformat des ONLANG Studios: Absätze,
// fett, kursiv, Links und Videos (siehe utils/textformat.ts). Der Text wird
// nie als HTML eingesetzt – React setzt jedes Stück als reinen Text.

const stueck = (s: TextStueck, key: number): React.ReactNode => {
  let inhalt: React.ReactNode = s.text;
  if (s.kursiv) inhalt = <em>{inhalt}</em>;
  if (s.fett) inhalt = <strong>{inhalt}</strong>;
  if (s.adresse) {
    return (
      <a key={key} href={s.adresse} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', overflowWrap: 'anywhere' as const }}>
        {inhalt}
      </a>
    );
  }
  return <React.Fragment key={key}>{inhalt}</React.Fragment>;
};

const BeitragsText: React.FC<{ text: string; titel?: string }> = ({ text, titel }) => {
  const bloecke = zerlegeText(text);
  if (!bloecke.length) return null;
  return (
    <div style={{ color: '#555', fontSize: 16, lineHeight: 1.7 }}>
      {bloecke.map((block, i) => {
        const letzter = i === bloecke.length - 1;
        if (block.art === 'video') {
          return (
            <div key={i} style={{ position: 'relative', paddingBottom: '56.25%', height: 0, margin: letzter ? 0 : '0 0 12px 0', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
              {block.typ === 'youtube' ? (
                <iframe src={`https://www.youtube-nocookie.com/embed/${block.youtubeId}?rel=0`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={titel || 'Video'} />
              ) : (
                <video src={block.adresse} controls preload="metadata" playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
              )}
            </div>
          );
        }
        return (
          <p key={i} style={{ margin: letzter ? 0 : '0 0 1.7em 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' as const }}>
            {block.zeilen.map((zeile, z) => (
              <React.Fragment key={z}>
                {z > 0 && <br />}
                {zeile.map(stueck)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

export default BeitragsText;
