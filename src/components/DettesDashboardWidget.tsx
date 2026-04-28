import { useState } from "react";
import { TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

interface Props {
  totalDebt: number;
  monthlyPayment: number;
  credits: Array<{
    id: string;
    name: string;
    monthlyPayment: number;
    remainingAmount: number;
    initialAmount: number;
    settled?: boolean;
  }>;
  projection: Array<{ month: number; debt: number; treasury: number }>;
}

export function DettesDashboardWidget({ totalDebt, monthlyPayment, credits, projection }: Props) {
  const [showChart, setShowChart] = useState(false);

  const monthsLeft = monthlyPayment > 0 && totalDebt > 0 ? Math.ceil(totalDebt / monthlyPayment) : 0;
  const debtFreeDate = new Date();
  if (monthsLeft > 0) debtFreeDate.setMonth(debtFreeDate.getMonth() + monthsLeft);
  const debtFreeDateStr = totalDebt <= 0
    ? "🎉 DEBT-FREE !"
    : debtFreeDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="card-finance">
      <button
        onClick={() => setShowChart(!showChart)}
        className="w-full flex items-center justify-between min-h-[44px]"
        data-testid="button-toggle-debt-chart"
      >
        <div className="flex items-start gap-3 text-left">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">📊 Dettes totales</p>
            <p className="text-2xl font-black text-foreground mt-0.5">{fmt(totalDebt)}</p>
            {monthlyPayment > 0 && (
              <p className="text-xs text-green-500 dark:text-green-300 font-semibold">↘ -{fmt(monthlyPayment)} ce mois</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0 ml-2">
          <span className="text-xs">{showChart ? "Masquer" : "Détails"}</span>
          {showChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {showChart && projection.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold text-muted-foreground">Trajectoire 24 mois (Snowball)</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projection}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => `M${v}`} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => [fmt(value), name === "debt" ? "Dettes" : "Trésorerie"]}
                  labelFormatter={(label) => `Mois ${label}`}
                />
                <Line type="monotone" dataKey="debt" stroke="#f87171" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="treasury" stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-background/60 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Restant</p>
              <p className="text-base font-black text-foreground">{fmt(totalDebt)}</p>
              {monthlyPayment > 0 && (
                <p className="text-xs text-green-500 dark:text-green-300">↘ -{fmt(monthlyPayment)}/mois</p>
              )}
            </div>
            <div className="bg-background/60 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Debt-free prévu</p>
              <p className="text-sm font-black text-primary">{debtFreeDateStr}</p>
              {monthsLeft > 0 && <p className="text-xs text-muted-foreground">{monthsLeft} mois</p>}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {credits.filter(c => !c.settled && c.remainingAmount > 0).slice(0, 3).map(c => (
              <div key={c.id} className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground truncate">{c.name}</p>
                <p className="text-sm font-bold text-foreground">{fmt(c.remainingAmount)}</p>
                <p className="text-xs text-primary">-{fmt(c.monthlyPayment)}/m</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
