import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { todayDO } from "@/lib/metrics";
import {
  INSIGHTS_SELECT,
  type InsightSprintRow,
  type SprintOutcome,
  addDays,
  computeOutcomes,
} from "@/lib/insights";

const WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function monthLabel(ym: string): string {
  const label = new Intl.DateTimeFormat("es-DO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${ym}-01T00:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, "0")}`;
}

function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// Lunes = 0
function weekdayOfFirst(ym: string): number {
  return (new Date(`${ym}-01T00:00:00Z`).getUTCDay() + 6) % 7;
}

interface DayRecord {
  color: string;
  isStart: boolean;
  isEnd: boolean;
}

function recordForDay(
  outcome: SprintOutcome,
  day: string,
  today: string,
): DayRecord | null {
  // Barra superpuesta: hasta donde llego el sprint realmente.
  // verde = cerraste todo (llega al dia del cierre)
  // azul  = sprint en curso (llega a hoy)
  // rojo  = termino sin cierre total (llega al final)
  let end: string;
  let color: string;
  if (outcome.fullyClosed && outcome.closureDate) {
    end = outcome.closureDate;
    color = "bg-success";
  } else if (!outcome.finished) {
    end = today < outcome.end_date ? today : outcome.end_date;
    color = "bg-info";
  } else {
    end = outcome.end_date;
    color = "bg-danger";
  }
  if (day < outcome.start_date || day > end) return null;
  return {
    color,
    isStart: day === outcome.start_date,
    isEnd: day === end,
  };
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sprints")
    .select(INSIGHTS_SELECT)
    .order("start_date");
  const rows = (data ?? []) as unknown as InsightSprintRow[];
  const today = todayDO();
  const outcomes = computeOutcomes(rows, today);
  const byId = new Map(outcomes.map((o) => [o.id, o]));

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-2xl pt-20 text-center">
        <h1 className="text-2xl font-bold text-accent">Calendario</h1>
        <p className="mt-2 text-text-secondary">
          Sin sprints registrados todavia.
        </p>
        <Link
          href="/sprints/new"
          className="mt-6 inline-block rounded bg-primary px-5 py-2.5 text-sm font-medium text-surface hover:opacity-90"
        >
          Crear sprint
        </Link>
      </div>
    );
  }

  const firstMonth = rows[0].start_date.slice(0, 7);
  const lastMonth = rows
    .map((s) => s.end_date)
    .sort()
    .at(-1)!
    .slice(0, 7);
  const months: string[] = [];
  for (let ym = firstMonth; ym <= lastMonth; ym = nextMonth(ym)) {
    months.push(ym);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex items-end justify-between">
        <h1 className="text-2xl font-bold text-accent">Calendario</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-6 rounded bg-primary-soft/60" />
            duracion del sprint
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-6 rounded bg-success" />
            cerraste todo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-6 rounded bg-info" />
            en curso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-6 rounded bg-danger" />
            sin cierre total
          </span>
        </div>
      </header>

      {months.map((ym) => {
        const total = daysInMonth(ym);
        const offset = weekdayOfFirst(ym);
        const cells: (string | null)[] = [
          ...Array.from({ length: offset }, () => null),
          ...Array.from(
            { length: total },
            (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`,
          ),
        ];
        while (cells.length % 7 !== 0) cells.push(null);

        return (
          <section key={ym}>
            <h2 className="mb-2 text-lg font-semibold text-accent">
              {monthLabel(ym)}
            </h2>
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border/60">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="bg-primary px-2 py-1.5 text-center text-xs font-medium text-surface"
                >
                  {d}
                </div>
              ))}
              {cells.map((day, idx) => {
                if (!day) {
                  return <div key={idx} className="h-24 bg-surface/60" />;
                }
                const sprint = rows.find(
                  (s) => s.start_date <= day && day <= s.end_date,
                );
                const outcome = sprint ? byId.get(sprint.id) : undefined;
                const record =
                  outcome && recordForDay(outcome, day, today);
                const isToday = day === today;
                const dayNum = Number(day.slice(8));

                const content = (
                  <>
                    <span
                      className={`absolute right-1.5 top-1 text-xs ${
                        isToday
                          ? "rounded-full bg-accent px-1.5 py-0.5 font-bold text-surface"
                          : "text-text-secondary"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {sprint && day === sprint.start_date && (
                      <span className="absolute left-1 top-1 z-10 max-w-[90%] truncate text-[10px] font-semibold text-primary">
                        {sprint.name}
                      </span>
                    )}
                    {record && (
                      <span
                        className={`absolute bottom-[26px] h-1.5 ${record.color} ${
                          record.isStart ? "left-1 rounded-l" : "left-0"
                        } ${record.isEnd ? "right-1 rounded-r" : "right-0"}`}
                      />
                    )}
                    {sprint && (
                      <span
                        className={`absolute bottom-1.5 h-4 bg-primary-soft/60 ${
                          day === sprint.start_date
                            ? "left-1 rounded-l"
                            : "left-0"
                        } ${
                          day === sprint.end_date
                            ? "right-1 rounded-r"
                            : "right-0"
                        }`}
                      />
                    )}
                  </>
                );

                return sprint ? (
                  <Link
                    key={idx}
                    href={`/sprints/${sprint.id}`}
                    className="relative h-24 bg-white/60 transition-colors hover:bg-primary-soft/25"
                    title={`${sprint.name} (clic para abrir)`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={idx} className="relative h-24 bg-white/40">
                    {content}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
