import { useSoldeV2 } from "@/hooks/useSoldeV2";
import { useIncomeListV2 } from "@/hooks/useIncomeListV2";

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default function DashboardV2() {
  const solde = useSoldeV2();
  const income = useIncomeListV2();

  const statusColor = {
    negative: "text-red-500",
    low: "text-orange-500",
    healthy: "text-green-500",
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Solde Card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <div className="text-xs text-muted-foreground font-semibold">Solde</div>
        <div className={`text-4xl font-bold ${statusColor[solde.status]}`}>
          {fmt(solde.solde)}
        </div>
        <div className="text-xs text-muted-foreground">
          {solde.status === "negative"
            ? "⚠️ Découvert"
            : solde.status === "low"
              ? "⚡ Faible"
              : "✅ Sain"}
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <div className="text-xs text-muted-foreground font-semibold mb-3">Calcul</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Solde initial</span>
            <span className="font-semibold">{fmt(solde.startingBalance)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>+ Revenus reçus</span>
            <span className="font-semibold">+{fmt(solde.totalIncomeReceived)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>- Charges réelles</span>
            <span className="font-semibold">-{fmt(solde.totalChargesReel)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>- Courses ce mois</span>
            <span className="font-semibold">-{fmt(solde.totalCoursesThisMonth)}</span>
          </div>
        </div>
      </div>

      {/* Income Summary */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="text-xs text-muted-foreground font-semibold">Revenus</div>
        <div className="space-y-2">
          {income.items.map((inc) => (
            <div key={inc.id} className="flex justify-between items-center py-2">
              <div>
                <div className="font-medium text-sm">{inc.name}</div>
                <div className="text-xs text-muted-foreground">
                  {inc.isReceived ? "✅ Reçu" : `J${inc.daysUntilExpected}`}
                </div>
              </div>
              <div className="font-semibold">{fmt(inc.amount ?? 0)}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-3 mt-3">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span>Total reçu</span>
            <span className="text-green-600">{fmt(income.totalReceived)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
