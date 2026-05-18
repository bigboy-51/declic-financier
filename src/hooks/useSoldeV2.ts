import { useMemo } from "react";
import { useFirebaseDataV2 } from "@/context/FirebaseDataContextV2";
import type { FinanceData } from "@/types/finance";

export interface SoldeBreakdown {
  startingBalance: number;
  totalIncomeReceived: number;
  totalChargesReel: number;
  totalCoursesThisMonth: number;
  solde: number;
  status: "negative" | "low" | "healthy";
}

export function useSoldeV2(): SoldeBreakdown {
  const { financeData } = useFirebaseDataV2();

  return useMemo(() => {
    if (!financeData) {
      return {
        startingBalance: 0,
        totalIncomeReceived: 0,
        totalChargesReel: 0,
        totalCoursesThisMonth: 0,
        solde: 0,
        status: "healthy",
      };
    }

    const startingBalance = financeData.starting_balance ?? 0;

    const totalIncomeReceived = (financeData.incomes ?? [])
      .filter((inc) => inc.receivedDate)
      .reduce((sum, inc) => sum + (inc.amount ?? 0), 0);

    const totalChargesReel = Object.values(financeData.expenses ?? {})
      .reduce((sum, exp) => sum + (exp.actualAmount ?? 0), 0);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const totalCoursesThisMonth = (financeData.grocery_expenses ?? [])
      .filter((course) => course.date?.startsWith(currentMonth))
      .reduce((sum, course) => sum + (course.amount ?? 0), 0);

    const solde = startingBalance + totalIncomeReceived - totalChargesReel - totalCoursesThisMonth;

    let status: "negative" | "low" | "healthy" = "healthy";
    if (solde < 0) status = "negative";
    else if (solde < 500) status = "low";

    return {
      startingBalance,
      totalIncomeReceived,
      totalChargesReel,
      totalCoursesThisMonth,
      solde,
      status,
    };
  }, [financeData]);
}
