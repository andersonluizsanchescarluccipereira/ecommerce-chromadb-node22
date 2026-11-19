export class HttpError extends Error {
  constructor(status, message) { super(message); this.status=status; }
}
export function validId(input) {
  const v=Number(input);
  if (!Number.isSafeInteger(v) || v <= 0 || String(v)!==String(input)) throw new HttpError(400,'ID inválido');
  return v;
}
