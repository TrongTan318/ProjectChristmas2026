'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Track {
  src: string;
  title: string;
}

const KEY = 'music-enabled';
// Sự kiện được trình duyệt tính là "người dùng tương tác" → cho phép phát âm thanh.
const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'keydown'] as const;

function readPreference(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'false';
  } catch {
    return true;
  }
}

function writePreference(on: boolean) {
  try {
    localStorage.setItem(KEY, String(on));
  } catch {
    // trình duyệt chặn lưu trữ: chỉ áp dụng cho phiên hiện tại
  }
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Nhạc nền phát ngẫu nhiên, nối bài liên tục. Nằm ở root layout nên không bị
 * ngắt khi chuyển trang. Trình duyệt chặn tự phát → nếu bị chặn thì phát ở lần
 * chạm/bấm/gõ phím đầu tiên. Ẩn và dừng ở trang quản trị.
 *
 * iOS chỉ cho phát khi play() được gọi ngay trong sự kiện của người dùng, nên
 * mọi chỗ đổi bài đều gán src + play() trực tiếp, không qua state/effect.
 */
export function MusicPlayer({ tracks }: { tracks: Track[] }) {
  const pathname = usePathname();
  const hidden = pathname.startsWith('/admin');
  const audioRef = useRef<HTMLAudioElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<Track[]>([]);
  const errorsRef = useRef(0);
  const [title, setTitle] = useState('');
  const [playing, setPlaying] = useState(false);

  /** Nạp bài ngẫu nhiên kế tiếp; hết vòng thì xáo lại (tránh lặp ngay bài vừa phát). */
  const loadNext = useCallback(
    (autoplay: boolean) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (queueRef.current.length === 0) {
        let q = shuffle(tracks);
        if (q.length > 1 && q[0].src === audio.dataset.src) q = [...q.slice(1), q[0]];
        queueRef.current = q;
      }
      const t = queueRef.current.shift()!;
      audio.dataset.src = t.src;
      audio.src = t.src;
      setTitle(t.title);
      if (autoplay) void audio.play().catch(() => {});
    },
    [tracks],
  );

  // Khởi động: thử phát ngay; bị chặn thì chờ tương tác đầu tiên.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;
    loadNext(false);
    if (!readPreference()) return;

    const cleanup = () => {
      for (const e of UNLOCK_EVENTS) window.removeEventListener(e, unlock, true);
    };
    const unlock = (e?: Event) => {
      // Chạm vào nút nhạc: để nút tự xử lý.
      if (e?.target instanceof Node && controlsRef.current?.contains(e.target)) return;
      if (!readPreference() || location.pathname.startsWith('/admin')) return cleanup();
      audio.play().then(cleanup, () => {});
    };
    for (const e of UNLOCK_EVENTS) window.addEventListener(e, unlock, true);
    unlock();
    return cleanup;
  }, [tracks, loadNext]);

  // Vào trang quản trị (điều hướng phía client) thì dừng.
  useEffect(() => {
    if (hidden) audioRef.current?.pause();
  }, [hidden]);

  if (tracks.length === 0) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      writePreference(false);
      audio.pause();
    } else {
      writePreference(true);
      void audio.play().catch(() => {});
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPlaying={() => (errorsRef.current = 0)}
        onPause={() => setPlaying(false)}
        onEnded={() => loadNext(true)}
        onError={() => {
          // File hỏng/thiếu: bỏ qua sang bài khác; cả danh sách đều lỗi thì dừng.
          errorsRef.current += 1;
          if (errorsRef.current < tracks.length && readPreference()) loadNext(true);
        }}
      />
      {!hidden && (
        <div
          ref={controlsRef}
          className="fixed bottom-4 left-4 z-50 flex items-center gap-1 rounded-full border border-gold/40 bg-ink/80 p-1 text-ivory shadow-lg backdrop-blur"
        >
          <button
            type="button"
            onClick={toggle}
            aria-pressed={playing}
            aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}
            title={title}
            className="grid size-12 place-items-center rounded-full text-gold hover:bg-ivory/10"
          >
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4zM14 3.2v2.1a7 7 0 010 13.4v2.1a9 9 0 000-17.6z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M16.5 12A4.5 4.5 0 0014 8v2.2l2.5 2.5V12zM19 12a7 7 0 01-.6 2.8l1.5 1.5A9 9 0 0014 3.2v2.1a7 7 0 015 6.7zM4.3 3L3 4.3 7.7 9H3v6h4l5 5v-6.7l4.3 4.3a7 7 0 01-2.3 1.2v2.1a9 9 0 003.7-1.8l2 2 1.3-1.3L4.3 3zM12 4L9.9 6.1 12 8.2V4z" />
              </svg>
            )}
          </button>
          {tracks.length > 1 && (
            <button
              type="button"
              onClick={() => {
                writePreference(true);
                loadNext(true);
              }}
              aria-label="Chuyển bài tiếp"
              className="grid size-12 place-items-center rounded-full text-gold hover:bg-ivory/10"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
