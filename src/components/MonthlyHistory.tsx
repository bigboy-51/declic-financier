import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingDown, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Credit } from "@/types/finance";

interface MonthlyHistoryProps {
  monthlyHistory: Record<string, any>;
  currentMonth: string;
  allMonths: string[];
  getMonthComparison: (month1: string, month2: string) => any;
  calculateDebtFreeProjection: (credits: Credit[], monthlyPayment: number) => any;
  credits: Credit[];
}

export function MonthlyHistory({
  monthlyHistory,
  currentMonth,
  allMonths,
  getMonthComparison,
  calculateDebtFreeProjection,
  credits,
}: MonthlyHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  const chartData = allMonths.map((month) => {
    const snap = monthlyHistory[month];
    const shortMonth = month.split("-")[1]; // "01", "02", etc
    return {
      month: shortMonth,
      expenses: snap?.totals?.totalActualExpenses || 0,
    };
  });

  const trend = chartData.length >= 2
    ? chartData[chartData.length - 1].expenses - chartData[0].expenses
    : 0;
  const trendDirection = trend > 0 ? "up" : trend < 0 ? "down" : "stable";

  if (allMonths.length === 0) {
    return null;
  }

  return (
    <div className="card-finance mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-medium"
        data-testid="button-monthly-history-toggle"
      >
        <div className="flex items-center gap-2">
          <span>Historique mensuel ({allMonths.length} mois)</span>
          {trendDirection === "up" && <TrendingUp className="w-4 h-4 text-red-500" />}
          {trendDirection === "down" && <TrendingDown className="w-4 h-4 text-green-600" />}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="h-40">
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
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="var(--primary)"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
          {allMonths.map((month) => {
            const snap = monthlyHistory[month];
            if (!snap) return null;

            return (
              <div
                key={month}
                className="bg-muted rounded-lg p-3 text-sm"
                data-testid={`card-month-${month}`}
              >
                <p className="font-medium mb-1">{formatMonth(month)}</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Dettes restantes:</span>
                  <span className="text-right font-medium text-foreground">
                    {formatCurrency(snap.totals?.totalCredits || 0)}
                  </span>
                  <span>Charges prévues:</span>
                  <span className="text-right">
                    {formatCurrency(snap.totals?.totalExpenses || 0)}
                  </span>
                  <span>Charges réelles:</span>
                  <span className="text-right">
                    {formatCurrency(snap.totals?.totalActualExpenses || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
