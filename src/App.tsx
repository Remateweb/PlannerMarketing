import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Inbox, X } from "lucide-react";
import * as XLSX from "xlsx";
import Button from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import Switch from "./ui/Switch";
import Slider from "./ui/Slider";
import { db, type EventItem } from "./db";
import { uid, toISODate, addOffset, formatDateBR, formatTimeBR } from "./utils";

/* =====================================================
   TIPAGEM AUXILIAR
   ===================================================== */
type EventWithGap = EventItem & { isGap?: boolean; nextDate?: string };

/* =====================================================
   FUNÇÕES DE NORMALIZAÇÃO E PARSE DE DATAS
   ===================================================== */
const normalize = (s?: string) =>
  (s ?? "").toString().trim().replace(/\s+/g, " ") || "Sem categoria";

function extractCatSub(etiquetas: string): { cat: string; sub?: string } {
  const raw = (etiquetas || "")
    .replace(/Categoria\s*:/i, "")
    .replace(/Subcategoria\s*:/i, "")
    .trim();
  const parts = raw
    .split(/[,:\-]+/)
    .map((s) => normalize(s))
    .filter(Boolean);
  return {
    cat: normalize(parts[0]),
    sub: parts[1] ? normalize(parts[1]) : undefined,
  };
}

function parseDateBRStrict(input: any): string | null {
  if (input == null) return null;

  if (typeof input === "number" && isFinite(input)) {
    const d = XLSX.SSF.parse_date_code(input);
    if (d) {
      const yyyy = d.y.toString().padStart(4, "0");
      const mm = d.m.toString().padStart(2, "0");
      const dd = d.d.toString().padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  const str = String(input).trim();
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let dd = parseInt(m[1], 10);
    let mm = parseInt(m[2], 10);
    let yyyy = parseInt(m[3], 10);
    if (yyyy < 100) yyyy += 2000;
    const d = new Date(yyyy, mm - 1, dd);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
    }
  }

  const d2 = new Date(str);
  if (!isNaN(d2.getTime())) {
    return `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d2.getDate()).padStart(2, "0")}`;
  }
  return null;
}

/* =====================================================
   COMPONENTE DE CONTAGEM REGRESSIVA
   ===================================================== */
const CountdownBadge: React.FC<{ toISO: string }> = ({ toISO }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(toISO).getTime() - now;
  const late = diff < 0;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / (24 * 3600 * 1000));
  const hours = Math.floor((abs % (24 * 3600 * 1000)) / (3600 * 1000));
  const minutes = Math.floor((abs % (3600 * 1000)) / (60 * 1000));

  return (
    <span
      className={`text-[10px] ${
        late
          ? "bg-red-600"
          : abs < 48 * 3600 * 1000
          ? "bg-amber-600"
          : "bg-emerald-700"
      } text-white rounded-full px-2 py-0.5`}
    >
      {late ? "" : "em"} {days}d {hours}h {minutes}m
    </span>
  );
};

/* =====================================================
   GERA INTERVALOS AUTOMÁTICOS (com nextDate)
   ===================================================== */
function buildEventGaps(events: EventItem[]) {
  const byCatSub: Record<string, EventItem[]> = {};

  for (const ev of events) {
    const key = `${normalize(ev.tags?.[0])}|${normalize(ev.tags?.[1] || "")}`;
    (byCatSub[key] ||= []).push(ev);
  }

  const result: (EventItem & { isGap?: boolean })[] = [];

  const makeLocalDate = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  for (const key of Object.keys(byCatSub)) {
    const list = byCatSub[key].sort(
      (a, b) =>
        makeLocalDate(a.date).getTime() - makeLocalDate(b.date).getTime()
    );

    if (list.length > 0) {
      const first = list[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const firstDate = makeLocalDate(first.date);

      const diffDays = Math.floor(
        (firstDate.getTime() - today.getTime()) / 86400000
      );

      if (diffDays > 0) {
        for (let d = diffDays; d > 0; d--) {
          const gapDay = new Date(today);
          gapDay.setDate(today.getDate() + (diffDays - d));
          result.push({
            id: uid(),
            name: `Intervalo: ${d} dia${d > 1 ? "s" : ""} até o evento`,
            date: toISODate(gapDay),
            time: first.time,
            tags: first.tags,
            isGap: true,
          });
        }
      }
    }

    for (let i = 0; i < list.length; i++) {
      const curr = list[i];
      result.push(curr);

      const next = list[i + 1];
      if (next) {
        const start = makeLocalDate(curr.date);
        const end = makeLocalDate(next.date);

        const diffDays = Math.round(
          (end.getTime() - start.getTime()) / 86400000
        );

        if (diffDays > 1) {
          for (let d = 1; d < diffDays; d++) {
            const gapDay = new Date(start);
            gapDay.setDate(start.getDate() + d);
            const restantes = diffDays - d;
            result.push({
              id: uid(),
              name: `Intervalo: ${restantes} dia${
                restantes > 1 ? "s" : ""
              } até o próximo evento`,
              date: toISODate(gapDay),
              time: curr.time,
              tags: curr.tags,
              isGap: true,
            });
          }
        }
      }
    }
  }

  return result;
}

/* =====================================================
   COMPONENTE PRINCIPAL
   ===================================================== */

export default function App() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [daysWindow, setDaysWindow] = useState(45);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);

  // 🔹 Parser CSV robusto
  function detectDelimiter(text: string) {
    const firstLine = text.split(/\r?\n/)[0] || "";
    const commas = (firstLine.match(/,/g) || []).length;
    const semis = (firstLine.match(/;/g) || []).length;
    return semis > commas ? ";" : ",";
  }

  function parseCSV(text: string): string[][] {
    const delim = detectDelimiter(text);
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delim && !inQuotes) {
        row.push(cell);
        cell = "";
      } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
    row.push(cell);
    rows.push(row);
    while (rows.length && rows[rows.length - 1].every((c) => c.trim() === "")) {
      rows.pop();
    }
    return rows;
  }

  useEffect(() => {
    const sheetUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRz2biu00IlItJudG7s6Xk-O7ItGJI_P4hVlrVyfCD2cYne7oxjN_ZSnShmbJdw8g/pub?gid=1113557791&single=true&output=csv";

    async function fetchSheet() {
      try {
        const res = await fetch(sheetUrl);
        const csvText = await res.text();

        const rows = parseCSV(csvText);
        if (rows.length < 2) {
          console.warn("Planilha vazia ou sem linhas suficientes.");
          setEvents([]);
          return;
        }

        const headers = rows[0].map((h) => h.trim());
        const dataObjs = rows.slice(1).map((cols) => {
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => (obj[h] = (cols[i] ?? "").trim()));
          return obj;
        });

        const imported = dataObjs
          .map((r) => {
            const nome =
              r["Leilão/Evento"] || r["Evento"] || r["Nome do Evento"] || "";
            const dataEvento = r["Data"] || "";
            const horario = r["Hora"] || r["Horário"] || "";
            const categoria = r["Categoria (Raça)"] || "Sem categoria";
            const sub = r["Subcategoria (Sexo)"] || "Sem subcategoria";

            if (!nome || !dataEvento) return null;

            const iso = parseDateBRStrict(dataEvento);
            if (!iso) return null;

            return {
              id: uid(),
              name: String(nome),
              date: iso,
              time: horario ? String(horario) : undefined,
              tags: [categoria, sub],
            } as EventItem;
          })
          .filter(Boolean) as EventItem[];

        imported.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setEvents(imported);
        await db.events.clear();
        await db.events.bulkPut(imported);
      } catch (err) {
        console.error("❌ Erro ao carregar planilha:", err);
        setEvents([]);
      }
    }

    fetchSheet();
  }, []);

  // 🔹 Range total com base na planilha
  useEffect(() => {
    if (events.length === 0) return;

    const dates = events.map((e) => new Date(e.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);

    setStartDate(minDate);
    const diffDays = Math.floor(
      (maxDate.getTime() - minDate.getTime()) / 86400000
    );
    setDaysWindow(diffDays + 2);
  }, [events]);

  const allEvents = useMemo<EventWithGap[]>(
    () => buildEventGaps(events),
    [events]
  );

  const daysArray = useMemo(
    () =>
      Array.from({ length: daysWindow }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return d;
      }),
    [startDate, daysWindow]
  );

  const eventsMap = useMemo(() => {
    const map: Record<
      string,
      Record<string, Record<string, EventWithGap[]>>
    > = {};
    for (const e of allEvents) {
      const cat = normalize(e.tags?.[0]);
      const sub = normalize(e.tags?.[1] || "Sem subcategoria");

      const [y, m, d] = e.date.split("-").map(Number);
      const dt = new Date(y, m - 1, d, 0, 0, 0);
      const iso = toISODate(dt);

      (((map[cat] ||= {})[sub] ||= {})[iso] ||= []).push(e);
    }
    return map;
  }, [allEvents]);

  const categories = useMemo(() => Object.keys(eventsMap), [eventsMap]);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 overflow-hidden">
      <div className="w-full px-6 py-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">Planner de Eventos</h1>
            <p className="text-neutral-400">
              Dados carregados automaticamente do Google Sheets.
            </p>
          </div>
        </header>

        {/* === CALENDÁRIO === */}
        <div className="border border-neutral-800 rounded-2xl">
          {/* Cabeçalho sticky (datas) */}
          <div
            ref={headerRef}
            className="overflow-x-hidden border-b border-neutral-800 sticky top-0 z-20 bg-neutral-950"
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `270px repeat(${daysArray.length}, minmax(180px,1fr))`,
                width: `calc(270px + ${daysArray.length * 180}px)`,
              }}
            >
              <div className="sticky left-0 bg-neutral-900 p-2 font-semibold z-30">
                Categorias
              </div>
              {daysArray.map((d, i) => (
                <div
                  key={i}
                  className={`text-center text-xs p-2 ${
                    i % 2 === 0 ? "bg-neutral-900" : "bg-neutral-925"
                  }`}
                >
                  {formatDateBR(d)}
                </div>
              ))}
            </div>
          </div>

          {/* Corpo com scroll horizontal + sync do header */}
          <div
            ref={scrollRef}
            onScroll={(e) => {
              if (headerRef.current)
                headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
            }}
            className="overflow-x-auto h-[calc(100vh-200px)]"
          >
            {/* Wrapper apenas para largura total */}
            <div style={{ width: `calc(270px + ${daysArray.length * 180}px)` }}>
              {categories.length === 0 ? (
                <div className="p-8 text-neutral-400 flex items-center gap-2">
                  <Inbox size={18} /> Sem eventos.
                </div>
              ) : (
                categories.map((cat) =>
                  Object.keys(eventsMap[cat]).map((sub) => (
                    <div
                      key={`${cat}__${sub}`}
                      className="grid"
                      style={{
                        gridTemplateColumns: `270px repeat(${daysArray.length}, minmax(180px,1fr))`,
                      }}
                    >
                      {/* Coluna fixa da linha (cat/sub) */}
                      <div className="sticky left-0 bg-neutral-950 border-b border-neutral-900 p-2 z-10">
                        <div className="font-semibold">{cat}</div>
                        <div className="text-xs text-neutral-400">{sub}</div>
                      </div>

                      {/* Células por dia */}
                      {daysArray.map((day, i) => {
                        const iso = toISODate(day);
                        const list = eventsMap[cat]?.[sub]?.[iso] || [];
                        return (
                          <div
                            key={i}
                            className={`border-b border-neutral-900 ${
                              i % 2 === 0 ? "bg-neutral-925" : "bg-neutral-900"
                            } overflow-hidden`}
                          >
                            <div className="p-1 flex flex-col gap-1  overflow-y-auto">
                              {list.map((ev) => {
                                const isGap = ev.isGap;
                                const evDate = new Date(
                                  ev.date +
                                    (ev.time ? `T${ev.time}:00` : "T00:00:00")
                                );
                                return (
                                  <motion.div
                                    key={ev.id}
                                    layout
                                    onClick={
                                      !isGap
                                        ? () => setSelectedEvent(ev)
                                        : undefined
                                    }
                                    className={`rounded-lg border px-2 py-1 text-[12px] ${
                                      isGap
                                        ? "cursor-default bg-amber-700/30 border-amber-500 text-amber-100 italic"
                                        : "cursor-pointer bg-neutral-800/80 border-neutral-700 hover:bg-neutral-700/70"
                                    }`}
                                  >
                                    <div
                                      className="font-medium leading-tight"
                                      style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                      }}
                                    >
                                      {ev.name}
                                    </div>

                                    <div className="text-[10px] text-neutral-300 flex items-center gap-2 mt-0.5">
                                      {!isGap && (
                                        <>
                                          <span className="inline-flex items-center gap-1">
                                            {formatTimeBR(evDate) ===
                                            "Invalid Date" ? (
                                              <></>
                                            ) : (
                                              <>
                                                <Clock size={12} />{" "}
                                                {formatTimeBR(evDate)}
                                              </>
                                            )}
                                            <CountdownBadge toISO={ev.date} />
                                          </span>
                                        </>
                                      )}
                                      {isGap && (
                                        <span className="text-amber-400 ml-auto">
                                          ⏳ intervalo ativo
                                        </span>
                                      )}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-[min(920px,95vw)] max-h-[85vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold">{selectedEvent.name}</h2>
              <Button
                variant="secondary"
                onClick={() => setSelectedEvent(null)}
              >
                <X size={16} /> Fechar
              </Button>
            </div>
            <div className="text-neutral-400 text-sm mb-4">
              Categoria: <b>{normalize(selectedEvent.tags?.[0])}</b> •
              Subcategoria:{" "}
              <b>{normalize(selectedEvent.tags?.[1] || "Sem subcategoria")}</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
