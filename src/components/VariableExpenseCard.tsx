import { useMemo, useState } from "react";

type SpendEntry = { id: string; dateISO: string; amount: number };

function normalizeEuro(n: number) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// Retourne le lundi de la semaine de la date donnée (YYYY-MM-DD)
function weekStart(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const day = d.getDay(); // 0=dim, 1=lun...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function weekLabel(mondayISO: string): string {
  const mon = new Date(mondayISO + "T12:00:00");
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmtD = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${fmtD(mon)} – ${fmtD(sun)}`;
}

export function VariableExpenseCard({
  label,
  budgetPrevu,
  entries,
  onAdd,
  onDelete,
}: {
  label: string;
  budgetPrevu: number;
  entries: SpendEntry[];
  onAdd: (dateISO: string, amount: number) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().split("T")[0]);
  const [amountInput, setAmountInput] = useState("");

  const depense = useMemo(
    () => normalizeEuro(entries.reduce((a, e) => a + (Number(e.amount) || 0), 0)),
    [entries],
  );

  const restant = useMemo(
    () => normalizeEuro((Number(budgetPrevu) || 0) - depense),
    [budgetPrevu, depense],
  );

  // Entrées triées par date décroissante
  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [entries],
  );

  // Groupées par semaine (lundi ISO)
  const byWeek = useMemo(() => {
    const map = new Map<string, SpendEntry[]>();
    for (const e of sorted) {
      const w = weekStart(e.dateISO);
      if (!map.has(w)) map.set(w, []);
      map.get(w)!.push(e);
    }
    // Tri décroissant par lundi
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [sorted]);

  const handleAdd = () => {
    const amt = normalizeEuro(Number(amountInput));
    if (!amt || amt <= 0) return;
    onAdd(dateInput, amt);
    setAmountInput("");
    setDateInput(new Date().toISOString().split("T")[0]);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* En-tête */}
      <button
        className="w-full flex justify-between items-center px-4 py-3 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-bold text-sm text-foreground">{label}</span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{fmt(depense)}</span>
            {" / "}{fmt(budgetPrevu)}
          </span>
          <span className={`text-xs font-bold ${restant < 0 ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
            {fmt(restant)}
          </span>
          <span className="text-muted-foreground text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border/40">
          {restant < 0 && (
            <div className="mx-4 mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
              Budget dépassé de {fmt(Math.abs(restant))}
            </div>
          )}

          {/* Formulaire ajout */}
          <div className="flex gap-2 items-center px-4 py-3">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              type="number"
              placeholder="Montant €"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              onKeyDown={handleKey}
              className="w-28 min-h-[40px] px-3 py-1.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              inputMode="decimal"
              autoFocus
            />
            <button
              onClick={handleAdd}
              className="min-h-[40px] px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition"
            >
              + Ajouter
            </button>
          </div>

          {/* Liste par semaine */}
          <div className="pb-3">
            {byWeek.length === 0 ? (
              <p className="px-4 text-xs text-muted-foreground italic">Aucune dépense enregistrée.</p>
            ) : (
              byWeek.map(([monday, weekEntries]) => {
                const weekTotal = normalizeEuro(weekEntries.reduce((s, e) => s + e.amount, 0));
                return (
                  <div key={monday}>
                    {/* Header semaine */}
                    <div className="flex items-center justify-between px-4 py-1.5 bg-muted/40 border-y border-border/40">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Semaine du {weekLabel(monday)}
                      </span>
                      <span className="text-xs font-bold text-foreground tabular-nums">{fmt(weekTotal)}</span>
                    </div>
                    {/* Entrées */}
                    {weekEntries.map((e) => (
                      <div key={e.id} className="flex items-center justify-between px-4 py-2 border-b border-border/30 last:border-0">
                        <span className="text-sm text-muted-foreground">{formatDate(e.dateISO)}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold tabular-nums">{fmt(e.amount)}</span>
                          <button
                            onClick={() => onDelete(e.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>

          {/* Récap bas */}
          {entries.length > 0 && (
            <div className="flex justify-between px-4 py-2 border-t border-border/40 text-xs text-muted-foreground">
              <span>Total : <strong className="text-foreground">{fmt(depense)}</strong></span>
              <span>Restant : <strong className={restant < 0 ? "text-red-500" : "text-green-600 dark:text-green-400"}>{fmt(restant)}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
