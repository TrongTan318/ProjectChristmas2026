export type ActionState = { ok: boolean; message: string; at?: number } | null;

export function success(message: string): ActionState {
  return { ok: true, message, at: Date.now() };
}

export function failure(message: string): ActionState {
  return { ok: false, message, at: Date.now() };
}
