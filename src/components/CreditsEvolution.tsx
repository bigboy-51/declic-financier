import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Credit } from "@/types/finance";

interface CreditsEvolutionProps {
  monthlyHistory: Record<string, any>;
  credits: Credit[];
  allMonths: string[];
}

const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export function CreditsEvolution({
  monthlyHistory,
  credits,
  allMonths,
}: CreditsEvolutionProps) {
  const [expanded, setExpanded] = useState(false);

  const activeCredits = credits.filter((c) => !c.settled && c.remainingAmount > 0);

  if (activeCredits.length === 0 || allMonths.length === 0) {
    return null;
  }

  const chartData = allMonths.map((month) => {
    const snap = monthlyHistory[month];
    const shortMonth = month.split("-")[1];
    const point: Record<string, any> = { month: shortMonth };

    if (snap?.state?.credits) {
      snap.state.credits.forEach((credit: Credit) => {
        if (!credit.settled && credit.remainingAmount > 0) {
          point[credit.id] = credit.remainingAmount;
        }
      });
    }

    return point;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  return (
    <div className="card-finance mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-medium"
        data-testid="button-credits-evolution-toggle"
      >
        <div className="flex items-center gap-2">
          <span>Évolution des crédits ({activeCredits.length} actif{activeCredits.length > 1 ? "s" : ""})</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  style={{ color: 'var(--muted-foreground)' }}
                  width={40}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px'
                  }}
                  cursor={false}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(creditId) => {
                    const credit = activeCredits.find((c) => c.id === creditId);
                    return credit?.name || creditId;
                  }}
                />
                {activeCredits.map((credit, index) => (
                  <Line
                    key={credit.id}
                    type="monotone"
                    dataKey={credit.id}
                    stroke={COLORS[index % COLORS.length]}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Légende</p>
            <div className="grid grid-cols-1 gap-2">
              {activeCredits.map((credit, index) => (
                <div key={credit.id} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="flex-1">{credit.name}</span>
                  <span className="font-medium">{formatCurrency(credit.remainingAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
