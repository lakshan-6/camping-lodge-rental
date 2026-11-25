'use client';

import { useEffect, useState } from 'react';

type AdventureGalleryProps = { images?: string[] };

const TILE_COUNT = 6;

/** Displays independently rotating photos (one collage tile changes at a time). */
export function AdventureGallery({ images = [] }: AdventureGalleryProps) {
  const photos = images.filter((src): src is string => typeof src === 'string' && src.trim().length > 0);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion || photos.length <= 1) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setTick(old => old + 1);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="adventure-gallery-empty">
        <span className="eyebrow">FIELD JOURNAL / CAMPING LODGE</span>
        <h3>Our adventures, through the lens.</h3>
        <p>Adventure photos will appear here when uploaded from the Admin Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="adventure-gallery" aria-label="Camping Lodge adventure photo collage">
      <div className="adventure-collage">
        {Array.from({ length: TILE_COUNT }, (_, tile) => {
          // Changes exactly one cell each interval, preserving the collage layout.
          const rotations = Math.floor((tick + TILE_COUNT - 1 - tile) / TILE_COUNT);
          const src = photos[(tile + rotations) % photos.length];
          return (
            <div className={`adventure-tile adventure-tile-${tile + 1}`} key={tile}>
              <img
                key={src}
                className="adventure-tile-image"
                src={src}
                alt={`Camping Lodge adventure gallery photo ${((tile + rotations) % photos.length) + 1}`}
                loading={tile < 2 ? 'eager' : 'lazy'}
              />
              <span className="adventure-tile-overlay" aria-hidden="true" />
            </div>
          );
        })}
        <span className="adventure-gallery-stamp">EXPLORE · CAMP · REPEAT</span>
      </div>
      {photos.length > 1 && (
        <div className="adventure-gallery-controls">
          <span>{photos.length} adventure photos</span>
          <div className="row">
            <button type="button" className="adventure-gallery-btn" onClick={() => setTick(t => t + 1)} aria-label="Show next adventure photo">Next photo →</button>
            {!reduceMotion && (
              <button type="button" className="adventure-gallery-btn" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Play gallery slideshow' : 'Pause gallery slideshow'}>
                {paused ? 'Play' : 'Pause'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
