import 'server-only';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { cached } from './cache';

export interface MusicTrack {
  src: string;
  title: string;
}

const MUSIC_DIR = path.join(process.cwd(), 'public', 'music');
const AUDIO_EXT = new Set(['.mp3', '.m4a', '.aac', '.ogg', '.opus', '.webm']);

/**
 * Danh sách nhạc nền: mọi file âm thanh trong public/music. Tên bài lấy từ tên
 * file (bỏ đuôi, "_" và "-" thành dấu cách). Thêm/bớt file rồi khởi động lại app.
 */
export function getMusicTracks(): Promise<MusicTrack[]> {
  return cached('music', 60_000, async () => {
    const files = await readdir(MUSIC_DIR).catch(() => [] as string[]);
    return files
      .filter((f) => AUDIO_EXT.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map((f) => ({
        src: `/music/${encodeURIComponent(f)}`,
        title: path.basename(f, path.extname(f)).replace(/[_-]+/g, ' ').trim(),
      }));
  });
}
