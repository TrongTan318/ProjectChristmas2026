export const IMAGE_SIZES = [400, 800, 1600] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];

export function mediaUrl(key: string, size: ImageSize = 800): string {
  return `/media/${key}-${size}.webp`;
}

export function mediaSrcSet(key: string): string {
  return IMAGE_SIZES.map((s) => `${mediaUrl(key, s)} ${s}w`).join(', ');
}

export function fileUrl(key: string): string {
  return `/media/${key}`;
}

/** Lấy ID video từ mọi dạng link YouTube phổ biến. */
export function parseYoutubeId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return url.pathname.slice(1, 12) || null;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
      if (m?.[1]) return m[1];
    }
  } catch {
    return null;
  }
  return null;
}
