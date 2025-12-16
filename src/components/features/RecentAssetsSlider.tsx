import React, { useEffect, useMemo, useState } from 'react';
import { Asset } from '@/types';

interface RecentAssetsSliderProps {
  assets: Asset[];
  maxItems?: number;
  intervalMs?: number;
}

function pickShortDesc(a: Asset): string {
  const candidates = [
    a.keterangan,
    a.merkModel,
    a.alamat,
    a.kondisi,
    a.statusTanah,
    a.statusHakTanah,
  ].filter(Boolean) as string[];
  const text = candidates[0] || '';
  const trimmed = text.trim();
  if (trimmed.length <= 120) return trimmed;
  return trimmed.slice(0, 117).trimEnd() + '…';
}

function deriveImageUrl(a: Asset): string | undefined {
  const src = a.photos?.[0];
  if (!src) return undefined;
  
  // If it's a data URL, use it directly
  if (src.startsWith('data:')) {
    return src;
  }
  
  // If it's an http/https URL
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // Try to extract Google Drive id to use thumbnail endpoint (lighter and embeddable)
    try {
      const u = new URL(src);
      let fileId = u.searchParams.get('id') || '';
      if (!fileId) {
        const m = u.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (m) fileId = m[1];
      }
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
      }
    } catch {}
    // If not a Google Drive URL or extraction failed, use original URL
    return src;
  }
  
  // For any other format, try to use it as-is
  return src || undefined;
}

const RecentAssetsSlider: React.FC<RecentAssetsSliderProps> = ({ assets, maxItems = 10, intervalMs = 4000 }) => {
  const items = useMemo(() => {
    if (!assets || assets.length === 0) return [] as { title: string; desc: string; bg?: string }[];
    const sorted = [...assets].sort((a, b) => {
      const ta = Date.parse(a.tanggalInput || '');
      const tb = Date.parse(b.tanggalInput || '');
      const va = isNaN(ta) ? 0 : ta;
      const vb = isNaN(tb) ? 0 : tb;
      return vb - va; // newest first
    });
    const result = sorted.slice(0, maxItems).map(a => {
      const imageUrl = deriveImageUrl(a);
      return {
        title: a.namaBarang || '-',
        desc: pickShortDesc(a),
        bg: imageUrl,
      };
    });
    return result;
  }, [assets, maxItems]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [items.length, intervalMs]);

  useEffect(() => {
    // Reset index when items change
    setIndex(0);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
        Belum ada aset baru.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Slides with background image */}
      <div className="absolute inset-0">
        {items.map((it, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: it.bg ? `url(${it.bg})` : undefined,
              backgroundColor: it.bg ? undefined : '#e5e7eb',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Gradient overlay for readability at bottom */}
            <div className={`absolute inset-0 ${it.bg ? 'bg-gradient-to-t from-black/70 via-black/20 to-transparent' : 'bg-gradient-to-t from-gray-800/80 via-gray-800/40 to-transparent'}`} />
            
            {/* Placeholder icon if no image */}
            {!it.bg && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            {/* Text at bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-4 sm:px-6 sm:py-5">
              <div className={`text-base sm:text-lg font-bold truncate ${it.bg ? 'text-white drop-shadow-lg' : 'text-white drop-shadow-lg'}`}>
                {it.title}
              </div>
              {it.desc && (
                <div className={`text-xs sm:text-sm mt-1 line-clamp-2 ${it.bg ? 'text-white/95 drop-shadow' : 'text-white/90 drop-shadow'}`}>
                  {it.desc}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {items.map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white w-3' : 'bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentAssetsSlider;
