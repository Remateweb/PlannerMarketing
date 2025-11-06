export const uid = () => Math.random().toString(36).slice(2, 10);
export const toISODate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
export const parseBrazilianDate = (val: string): string | null => {
  const s = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m as any;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (isNaN(d.getTime())) return null;
  return toISODate(d);
};
export const addOffset = (
  input: string | Date,
  offsetDays: number = 0,
  offsetHours: number = 0
): string => {
  // aceita tanto string ("2025-11-06") quanto Date
  const base =
    typeof input === "string"
      ? new Date(input.includes("T") ? input : `${input}T00:00:00`)
      : input;

  // aplica deslocamentos
  base.setDate(base.getDate() + offsetDays);
  base.setHours(base.getHours() + offsetHours);

  // retorna string ISO (ex: "2025-11-07T00:00:00.000Z")
  return base.toISOString();
};

export const formatDateBR = (date: Date) =>
  date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
export const formatTimeBR = (date: Date) =>
  date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
