import React from "react";

interface ChargesRecapProps {
  totalPrevu: number;
  totalReel: number;
  totalRestant: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export const ChargesRecap: React.FC<ChargesRecapProps> = ({
  totalPrevu,
  totalReel,
  totalRestant,
}) => {
  const pct = totalPrevu > 0 ? Math.min(100, (totalReel / totalPrevu) * 100) : 0;
  const over = totalReel > totalPrevu && totalPrevu > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Prévu</p>
          <p className="text-base font-bold text-foreground tabular-nums">{fmt(totalPrevu)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Réel</p>
          <p className={`text-base font-bold tabular-nums ${over ? "text-red-500" : "text-foreground"}`}>
            {fmt(totalReel)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Restant</p>
          <p className={`text-base font-bold tabular-nums ${totalRestant < 0 ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
            {fmt(totalRestant)}
          </p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="space-y-1">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {pct.toFixed(0)}% utilisé
          {over && <span className="text-red-500 font-semibold"> · dépassé de {fmt(Math.abs(totalRestant))}</span>}
        </p>
      </div>
    </div>
  );
};
