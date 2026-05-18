import { useChargesByCategoryV2 } from "@/hooks/useChargesByCategoryV2";

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default function ChargesTabV2() {
  const charges = useChargesByCategoryV2();

  const categoryIcons: Record<string, string> = {
    logement: "🏠",
    transport: "🚗",
    sante: "👨‍⚕️",
    finances: "💰",
    loisirs: "🎉",
    remboursements: "🔄",
    divers: "🔀",
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Summary */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <div className="text-xs text-muted-foreground font-semibold">Résumé des charges</div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prévu</span>
            <span className="font-semibold">{fmt(charges.totalPrevu)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Réel</span>
            <span className="font-semibold text-orange-600">{fmt(charges.totalReel)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-sky-500">
            <span>Différence</span>
            <span>{fmt(charges.totalPrevu - charges.totalReel)}</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      {charges.categories.map((cat) => (
        <div key={cat.category} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{categoryIcons[cat.category]}</span>
              <div>
                <div className="font-semibold capitalize">{cat.category}</div>
                <div className="text-xs text-muted-foreground">
                  {cat.charges.length} charge{cat.charges.length > 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm">{fmt(cat.totalReel)}</div>
              <div className="text-xs text-muted-foreground">/{fmt(cat.totalPrevu)}</div>
            </div>
          </div>

          {/* Charges in category */}
          <div className="space-y-2 border-t border-border pt-3">
            {cat.charges.map((charge) => (
              <div key={charge.id} className="flex justify-between items-center py-1.5">
                <div className="flex-1">
                  <div className="text-sm font-medium">{charge.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmt(charge.amount ?? 0)} → {fmt(charge.actualAmount ?? 0)}
                  </div>
                </div>
                <div
                  className={`text-xs font-semibold ${
                    (charge.actualAmount ?? 0) > (charge.amount ?? 0)
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {fmt((charge.actualAmount ?? 0) - (charge.amount ?? 0))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
