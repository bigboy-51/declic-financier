import { X } from "lucide-react";
import type { Credit } from "@/types/finance";

interface SurplusModalProps {
  isOpen: boolean;
  surplus: number;
  credits: Credit[];
  onApply: (creditId: string) => void;
  onCancel: () => void;
}

export function SurplusModal({
  isOpen,
  surplus,
  credits,
  onApply,
  onCancel,
}: SurplusModalProps) {
  if (!isOpen) return null;

  const activeCredits = credits.filter((c) => !c.settled && c.remainingAmount > 0);
  const defaultCredit = activeCredits.sort((a, b) => a.remainingAmount - b.remainingAmount)[0];

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Surplus: {fmt(surplus)}</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">Affecter à quel crédit ?</p>

        <select
          defaultValue={defaultCredit?.id || ""}
          onChange={(e) => onApply(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-muted text-foreground border border-border focus:border-primary outline-none text-sm"
        >
          {activeCredits.map((credit) => (
            <option key={credit.id} value={credit.id}>
              {credit.name} ({fmt(credit.remainingAmount)})
            </option>
          ))}
        </select>

        <button
          onClick={onCancel}
          className="w-full px-4 py-2 rounded-lg bg-muted text-foreground font-medium text-sm hover:bg-muted/80"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
