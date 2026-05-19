import { useState, useEffect, useRef } from "react";
import { ref, set, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { CHARGE_CATEGORIES } from "@/constants/chargeCategories";
import { useChargesData, FlatCharge } from "@/hooks/useChargesData";
import { useChargesSummary } from "@/hooks/useChargesSummary";
import { ChargesRecap } from "@/components/ChargesRecap";
import { migrateChargesToFirebase } from "@/utils/migrateCharges";
import { patchCharges, patchResetChargesReel } from "@/utils/patchCharges";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil, Lock, LockOpen, CalendarDays, X } from "lucide-react";

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}


const DATED_REEL_CHARGE_IDS = new Set(["pharmacie-fixe", "soin-medical", "travaux", "essence"]);

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatShortDate(dateISO: string): string {
  const [year, month, day] = dateISO.split("-");
  if (!year || !month || !day) return dateISO;
  return `${day}/${month}/${year}`;
}

// ── Add modal ────────────────────────────────────────────────────────────────

interface AddChargeModalProps {
  categoryId: string;
  categoryName: string;
  onSave: (categoryId: string, name: string, prevu: number) => void;
  onClose: () => void;
}

function AddChargeModal({ categoryId, categoryName, onSave, onClose }: AddChargeModalProps) {
  const [name, setName] = useState("");
  const [prevu, setPrevu] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(categoryId, name.trim(), parseFloat(prevu) || 0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <div>
          <h2 className="font-bold text-foreground text-base">Ajouter une charge</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{categoryName}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nom</label>
            <input
              autoFocus
              data-testid="input-add-charge-name"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Ex : Netflix, Spotify…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Montant prévu (€)</label>
            <input
              data-testid="input-add-charge-prevu"
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="0,00"
              value={prevu}
              onChange={(e) => setPrevu(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              data-testid="button-add-charge-cancel"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              data-testid="button-add-charge-save"
              className="flex-1 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit modal ───────────────────────────────────────────────────────────────

interface EditChargeModalProps {
  charge: FlatCharge;
  onSave: (charge: FlatCharge, name: string, prevu: number) => void;
  onClose: () => void;
}

function EditChargeModal({ charge, onSave, onClose }: EditChargeModalProps) {
  const [name,  setName]  = useState(charge.name);
  const [prevu, setPrevu] = useState(String(charge.prevu));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(charge, name.trim(), parseFloat(prevu) || 0);
    onClose();
  };

  const inputCls = "w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";
  const labelCls = "text-xs font-semibold text-muted-foreground mb-1 block";

  return (
    <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <h2 className="font-bold text-foreground text-base">Modifier la charge</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelCls}>Nom</label>
            <input
              autoFocus
              data-testid="input-edit-charge-name"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Prévu (€)</label>
            <input
              data-testid="input-edit-charge-prevu"
              type="number" min="0" step="0.01"
              className={inputCls}
              value={prevu}
              onChange={(e) => setPrevu(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" data-testid="button-edit-charge-cancel" onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
              Annuler
            </button>
            <button type="submit" data-testid="button-edit-charge-save"
              className="flex-1 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── ChargeRow ────────────────────────────────────────────────────────────────

interface ChargeRowProps {
  charge: FlatCharge;
  globalLock: boolean;
  onUpdateReel: (charge: FlatCharge, value: number) => void;
  onEdit: (charge: FlatCharge) => void;
  onDelete: (charge: FlatCharge) => void;
}

function ChargeRow({ charge, globalLock, onUpdateReel, onEdit, onDelete }: ChargeRowProps) {
  const [editing, setEditing]   = useState(false);
  const [editVal, setEditVal]   = useState(String(charge.reel));
  const inputRef                = useRef<HTMLInputElement>(null);
  const committedRef            = useRef(false);

  const startEdit = () => {
    if (globalLock) return;
    committedRef.current = false;
    setEditVal(String(charge.reel === 0 ? "" : charge.reel));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 20);
  };

  const commit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    setEditing(false);
    onUpdateReel(charge, parseFloat(editVal) || 0);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter")  { e.preventDefault(); commit(); }
    if (e.key === "Escape") { committedRef.current = true; setEditing(false); }
  };

  const restant = charge.prevu - charge.reel;
  const over    = charge.reel > charge.prevu && charge.prevu > 0;

  return (
    <li
      className="grid items-center gap-1 px-3 py-2 hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0"
      style={{ gridTemplateColumns: "1fr 72px 88px 72px 56px" }}
      data-testid={`row-charge-${charge.id}`}
    >
      <span className="text-sm text-foreground font-medium truncate pr-1">{charge.name}</span>

      <span className="text-xs text-right text-muted-foreground font-medium tabular-nums">
        {fmt(charge.prevu)}
      </span>

      {/* Réel — tap direct quand déverrouillé */}
      {editing ? (
        <input
          ref={inputRef}
          type="number" min="0" step="0.01"
          data-testid={`input-reel-${charge.id}`}
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          className="w-full text-right text-sm px-2 py-1 rounded-lg border border-primary bg-background text-foreground focus:outline-none tabular-nums"
        />
      ) : (
        <button
          data-testid={`button-reel-${charge.id}`}
          onClick={startEdit}
          disabled={globalLock}
          className={`text-right text-sm font-semibold tabular-nums rounded-lg px-2 py-1 w-full transition-colors ${
            globalLock ? "cursor-default" : "hover:bg-primary/10 cursor-text"
          } ${over ? "text-red-500" : "text-foreground"}`}
        >
          {fmt(charge.reel)}
        </button>
      )}

      <span
        data-testid={`text-restant-${charge.id}`}
        className={`text-xs text-right font-bold tabular-nums ${
          restant < 0 ? "text-red-500" : restant === 0 ? "text-muted-foreground" : "text-green-600 dark:text-green-400"
        }`}
      >
        {fmt(restant)}
      </span>

      <div className="flex items-center justify-end gap-0.5">
        {!globalLock && (
          <button
            data-testid={`button-edit-charge-${charge.id}`}
            onClick={() => onEdit(charge)}
            className="p-1 min-w-[26px] min-h-[26px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
        {!globalLock && !charge.locked && (
          <button
            data-testid={`button-delete-charge-${charge.id}`}
            onClick={() => onDelete(charge)}
            className="p-1 min-w-[26px] min-h-[26px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </li>
  );
}

// ── CategorySection ──────────────────────────────────────────────────────────

interface DatedChargeRowProps {
  charge: FlatCharge;
  globalLock: boolean;
  onAddEntry: (charge: FlatCharge, dateISO: string, amount: number) => void;
  onDeleteEntry: (charge: FlatCharge, entryId: string) => void;
  onEdit: (charge: FlatCharge) => void;
  onDelete: (charge: FlatCharge) => void;
}

function DatedChargeRow({ charge, globalLock, onAddEntry, onDeleteEntry, onEdit, onDelete }: DatedChargeRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [entryDate, setEntryDate] = useState(todayISO());
  const [entryAmount, setEntryAmount] = useState("");
  const entries = [...(charge.entries ?? [])].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const restant = charge.prevu - charge.reel;
  const over = charge.reel > charge.prevu && charge.prevu > 0;

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(entryAmount);
    if (!entryDate || !amount || amount <= 0) return;
    onAddEntry(charge, entryDate, amount);
    setEntryAmount("");
  };

  return (
    <li className="border-b border-border/40 last:border-0" data-testid={`row-charge-${charge.id}`}>
      <div
        className="grid items-center gap-1 px-3 py-2 hover:bg-muted/30 transition-colors"
        style={{ gridTemplateColumns: "1fr 72px 88px 72px 56px" }}
      >
        <span className="text-sm text-foreground font-medium truncate pr-1">{charge.name}</span>
        <span className="text-xs text-right text-muted-foreground font-medium tabular-nums">{fmt(charge.prevu)}</span>
        <button
          data-testid={`button-reel-${charge.id}`}
          onClick={() => !globalLock && setExpanded((value) => !value)}
          disabled={globalLock}
          className={`text-right text-sm font-semibold tabular-nums rounded-lg px-2 py-1 w-full transition-colors ${
            globalLock ? "cursor-default" : "hover:bg-primary/10 cursor-pointer"
          } ${over ? "text-red-500" : "text-foreground"}`}
        >
          {fmt(charge.reel)}
        </button>
        <span
          data-testid={`text-restant-${charge.id}`}
          className={`text-xs text-right font-bold tabular-nums ${
            restant < 0 ? "text-red-500" : restant === 0 ? "text-muted-foreground" : "text-green-600 dark:text-green-400"
          }`}
        >
          {fmt(restant)}
        </span>
        <div className="flex items-center justify-end gap-0.5">
          {!globalLock && (
            <button
              data-testid={`button-toggle-entries-${charge.id}`}
              onClick={() => setExpanded((value) => !value)}
              className="p-1 min-w-[26px] min-h-[26px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <CalendarDays className="w-3 h-3" />
            </button>
          )}
          {!globalLock && (
            <button
              data-testid={`button-edit-charge-${charge.id}`}
              onClick={() => onEdit(charge)}
              className="p-1 min-w-[26px] min-h-[26px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {!globalLock && !charge.locked && (
            <button
              data-testid={`button-delete-charge-${charge.id}`}
              onClick={() => onDelete(charge)}
              className="p-1 min-w-[26px] min-h-[26px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {expanded && !globalLock && (
        <div className="px-3 pb-3 pt-1 bg-muted/20">
          <form onSubmit={handleAddEntry} className="grid grid-cols-[1fr_90px_34px] gap-2 items-center">
            <input
              type="date"
              data-testid={`input-entry-date-${charge.id}`}
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="min-h-[34px] rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              data-testid={`input-entry-amount-${charge.id}`}
              value={entryAmount}
              onChange={(e) => setEntryAmount(e.target.value)}
              placeholder="0,00"
              className="min-h-[34px] rounded-lg border border-border bg-background px-2 text-right text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              data-testid={`button-add-entry-${charge.id}`}
              className="min-h-[34px] rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {entries.length > 0 && (
            <div className="mt-2 space-y-1">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-2 rounded-lg bg-background/80 px-2 py-1.5">
                  <span className="text-xs text-muted-foreground tabular-nums">{formatShortDate(entry.dateISO)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground tabular-nums">{fmt(entry.amount)}</span>
                    <button
                      data-testid={`button-delete-entry-${charge.id}-${entry.id}`}
                      onClick={() => onDeleteEntry(charge, entry.id)}
                      className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

interface CategorySectionProps {
  categoryId: string;
  name: string;
  icon: string;
  charges: FlatCharge[];
  globalLock: boolean;
  onUpdateReel: (charge: FlatCharge, value: number) => void;
  onAddEntry: (charge: FlatCharge, dateISO: string, amount: number) => void;
  onDeleteEntry: (charge: FlatCharge, entryId: string) => void;
  onAddCharge: (categoryId: string) => void;
  onEdit: (charge: FlatCharge) => void;
  onDelete: (charge: FlatCharge) => void;
}

function CategorySection({ categoryId, name, icon, charges, globalLock, onUpdateReel, onAddEntry, onDeleteEntry, onAddCharge, onEdit, onDelete }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const prevu   = charges.reduce((s, c) => s + c.prevu, 0);
  const reel    = charges.reduce((s, c) => s + c.reel,  0);
  const restant = prevu - reel;
  const over    = reel > prevu && prevu > 0;
  const sorted  = [...charges].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden" data-testid={`section-category-${categoryId}`}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
        data-testid={`button-toggle-${categoryId}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{icon}</span>
          <span className="font-bold text-foreground text-xs uppercase tracking-wide truncate">{name}</span>
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium shrink-0">
            {charges.length}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {charges.length > 0 && (
            <div className="text-right hidden sm:block">
              <span className="text-xs text-muted-foreground">
                {fmt(reel)}{" "}
                <span className="text-muted-foreground/60">/</span>{" "}
                {fmt(prevu)}
              </span>
              {" · "}
              <span className={`text-xs font-semibold ${over ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                {fmt(restant)}
              </span>
            </div>
          )}
          {collapsed
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronUp   className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      {!collapsed && (
        <>
          {/* Table header */}
          {sorted.length > 0 && (
            <div
              className="grid px-3 py-1.5 bg-muted/40 border-y border-border/40"
              style={{ gridTemplateColumns: "1fr 72px 88px 72px 56px" }}
            >
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Charge</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Prévu</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">
                {globalLock ? "Réel" : "Réel ✏️"}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Restant</span>
              <span />
            </div>
          )}

          {/* Rows */}
          <ul>
            {sorted.length === 0 ? (
              <li className="px-4 py-3 text-xs text-muted-foreground italic">
                Aucune charge — cliquez sur + pour en ajouter.
              </li>
            ) : (
              sorted.map((c) => (
                DATED_REEL_CHARGE_IDS.has(c.id) ? (
                  <DatedChargeRow
                    key={c.id}
                    charge={c}
                    globalLock={globalLock}
                    onAddEntry={onAddEntry}
                    onDeleteEntry={onDeleteEntry}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ) : (
                  <ChargeRow
                    key={c.id}
                    charge={c}
                    globalLock={globalLock}
                    onUpdateReel={onUpdateReel}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                )
              ))
            )}
          </ul>

          {/* Add row — hidden when locked */}
          {!globalLock && (
            <div className="px-4 py-2.5 border-t border-border/40">
              <button
                data-testid={`button-add-charge-${categoryId}`}
                onClick={() => onAddCharge(categoryId)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors min-h-[32px]"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une charge
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ChargesTab() {
  const { user }                    = useAuth();
  const { charges, loading }        = useChargesData();
  const { toast }                   = useToast();

  const [globalLock, setGlobalLock] = useState<boolean>(() => {
    return localStorage.getItem("charges-global-lock") !== "0";
  });
  const [addModal, setAddModal]     = useState<{ categoryId: string; categoryName: string } | null>(null);
  const [editCharge, setEditCharge] = useState<FlatCharge | null>(null);
  const [confirmDel, setConfirmDel] = useState<FlatCharge | null>(null);

  const toggleLock = () => {
    const next = !globalLock;
    setGlobalLock(next);
    localStorage.setItem("charges-global-lock", next ? "1" : "0");
  };

  useEffect(() => {
    migrateChargesToFirebase().catch(console.error);
    patchCharges().catch(console.error);
    patchResetChargesReel().catch(console.error);
  }, []);

  const summaryInput = charges.map((c) => ({
    id: c.id,
    name: c.name,
    montantPrevu: c.prevu,
    montantReel: c.reel,
    montantRestant: c.restant,
    custom: !c.locked,
  }));
  const { totalPrevu, totalReel, totalRestant } = useChargesSummary(summaryInput);

  const handleUpdateReel = async (charge: FlatCharge, newReel: number) => {
    if (!user) return;
    const reel    = parseFloat(newReel.toFixed(2));
    const restant = parseFloat((charge.prevu - reel).toFixed(2));
    try {
      await update(ref(db, `users/${user.uid}/charges/${charge.categoryId}/rubriques/${charge.id}`), {
        reel, restant, updatedAt: new Date().toISOString(),
      });
    } catch {
      toast({ description: "❌ Erreur lors de la sauvegarde", variant: "destructive" });
    }
  };

  const handleAddEntry = async (charge: FlatCharge, dateISO: string, amount: number) => {
    if (!user) return;
    const entryId = generateId();
    const roundedAmount = parseFloat(amount.toFixed(2));
    const reel = parseFloat([...(charge.entries ?? []), { id: entryId, dateISO, amount: roundedAmount }]
      .reduce((sum, entry) => sum + entry.amount, 0)
      .toFixed(2));
    const restant = parseFloat((charge.prevu - reel).toFixed(2));

    try {
      await update(ref(db, `users/${user.uid}/charges/${charge.categoryId}/rubriques/${charge.id}`), {
        [`entries/${entryId}`]: { dateISO, amount: roundedAmount },
        reel,
        restant,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast({ description: "Erreur lors de la sauvegarde", variant: "destructive" });
    }
  };

  const handleDeleteEntry = async (charge: FlatCharge, entryId: string) => {
    if (!user) return;
    const reel = parseFloat((charge.entries ?? [])
      .filter((entry) => entry.id !== entryId)
      .reduce((sum, entry) => sum + entry.amount, 0)
      .toFixed(2));
    const restant = parseFloat((charge.prevu - reel).toFixed(2));

    try {
      await update(ref(db, `users/${user.uid}/charges/${charge.categoryId}/rubriques/${charge.id}`), {
        [`entries/${entryId}`]: null,
        reel,
        restant,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast({ description: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const handleEditCharge = async (charge: FlatCharge, name: string, prevu: number) => {
    if (!user) return;
    const prevuR  = parseFloat(prevu.toFixed(2));
    const restant = parseFloat((prevuR - charge.reel).toFixed(2));
    try {
      await update(ref(db, `users/${user.uid}/charges/${charge.categoryId}/rubriques/${charge.id}`), {
        name, prevu: prevuR, restant, updatedAt: new Date().toISOString(),
      });
    } catch {
      toast({ description: "❌ Erreur lors de la sauvegarde", variant: "destructive" });
    }
  };

  const handleAddCharge = async (categoryId: string, name: string, prevu: number) => {
    if (!user) return;
    const id  = generateId();
    const now = new Date().toISOString();
    await set(ref(db, `users/${user.uid}/charges/${categoryId}/rubriques/${id}`), {
      name, prevu, reel: 0, restant: prevu, locked: false, createdAt: now, updatedAt: now,
    });
  };

  const handleDelete = async (charge: FlatCharge) => {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/charges/${charge.categoryId}/rubriques/${charge.id}`));
    setConfirmDel(null);
  };

  if (loading) {
    return (
      <div className="px-4 py-10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 max-w-lg mx-auto w-full">

      {/* ── En-tête + verrou ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Charges mensuelles</h2>
        <button
          onClick={toggleLock}
          data-testid="button-global-lock"
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
            globalLock
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20"
          }`}
        >
          {globalLock
            ? <><Lock className="w-3.5 h-3.5" /> Verrouillé</>
            : <><LockOpen className="w-3.5 h-3.5" /> Modification active</>
          }
        </button>
      </div>

      {/* ── Synthèse ── */}
      <div data-testid="charges-recap">
        <ChargesRecap totalPrevu={totalPrevu} totalReel={totalReel} totalRestant={totalRestant} />
      </div>

      {/* ── Category sections ── */}
      {CHARGE_CATEGORIES.map((cat) => {
        const catCharges = charges.filter((c) => c.categoryId === cat.id);
        return (
          <CategorySection
            key={cat.id}
            categoryId={cat.id}
            name={cat.name}
            icon={cat.icon}
            charges={catCharges}
            globalLock={globalLock}
            onUpdateReel={handleUpdateReel}
            onAddEntry={handleAddEntry}
            onDeleteEntry={handleDeleteEntry}
            onAddCharge={(catId) => setAddModal({ categoryId: catId, categoryName: `${cat.icon} ${cat.name}` })}
            onEdit={setEditCharge}
            onDelete={(charge) => setConfirmDel(charge)}
          />
        );
      })}

      {/* ── Add charge modal ── */}
      {addModal && (
        <AddChargeModal
          categoryId={addModal.categoryId}
          categoryName={addModal.categoryName}
          onSave={handleAddCharge}
          onClose={() => setAddModal(null)}
        />
      )}

      {/* ── Edit charge modal ── */}
      {editCharge && (
        <EditChargeModal
          charge={editCharge}
          onSave={handleEditCharge}
          onClose={() => setEditCharge(null)}
        />
      )}

      {/* ── Delete confirmation ── */}
      {confirmDel && (
        <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
            <p className="font-bold text-foreground text-base">Supprimer cette charge ?</p>
            <p className="text-sm text-muted-foreground">
              « <span className="font-semibold text-foreground">{confirmDel.name}</span> » sera supprimée définitivement.
            </p>
            <div className="flex gap-2">
              <button
                data-testid="button-delete-cancel"
                onClick={() => setConfirmDel(null)}
                className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button
                data-testid="button-delete-confirm"
                onClick={() => handleDelete(confirmDel)}
                className="flex-1 min-h-[44px] rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
