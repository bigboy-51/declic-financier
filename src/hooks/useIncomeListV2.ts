import { useMemo } from "react";
import { useFirebaseDataV2 } from "@/context/FirebaseDataContextV2";
import type { Income } from "@/types/finance";

export interface EnrichedIncome extends Income {
  isReceived: boolean;
  daysUntilExpected: number;
}

export function useIncomeListV2() {
  const { financeData } = useFirebaseDataV2();

  return useMemo(() => {
    if (!financeData?.incomes) {
      return {
        items: [],
        totalExpected: 0,
        totalReceived: 0,
        toggleReceived: () => {},
      };
    }

    const now = new Date();
    const currentDay = now.getDate();

    const items: EnrichedIncome[] = financeData.incomes.map((inc) => ({
      ...inc,
      isReceived: !!inc.receivedDate,
      daysUntilExpected: (inc.receiptDate ?? 1) - currentDay,
    }));

    const totalExpected = items.reduce((sum, inc) => sum + (inc.amount ?? 0), 0);
    const totalReceived = items
      .filter((inc) => inc.isReceived)
      .reduce((sum, inc) => sum + (inc.amount ?? 0), 0);

    return {
      items: items.sort((a, b) => (a.receiptDate ?? 1) - (b.receiptDate ?? 1)),
      totalExpected,
      totalReceived,
      toggleReceived: (incomeId: string) => {
        const income = items.find((i) => i.id === incomeId);
        if (income) {
          income.isReceived = !income.isReceived;
          income.receivedDate = income.isReceived
            ? new Date().toISOString().split("T")[0]
            : null;
        }
      },
    };
  }, [financeData]);
}
