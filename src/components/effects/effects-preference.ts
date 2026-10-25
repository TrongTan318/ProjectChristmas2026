export const EFFECTS_EVENT = 'effects-preference-change';
const KEY = 'effects-enabled';

export function readEffectsPreference(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'false';
  } catch {
    return true;
  }
}

export function writeEffectsPreference(on: boolean) {
  try {
    localStorage.setItem(KEY, String(on));
  } catch {
    // trình duyệt chặn lưu trữ: chỉ áp dụng cho phiên hiện tại
  }
  window.dispatchEvent(new Event(EFFECTS_EVENT));
}
