/** datetime-local uses the browser's timezone; API timestamps always carry an offset. */
export function toApiDateTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Fecha y hora no válidas.');
  return date.toISOString();
}

export function toLocalDateTime(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) return null;
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
