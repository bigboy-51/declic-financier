import { useMemo } from "react";
import { useFirebaseDataV2 } from "@/context/FirebaseDataContextV2";
import type { Expense, ExpenseCategory } from "@/types/finance";

export interface ChargesByCategory {
  category: ExpenseCategory;
  charges: Expense[];
  totalPrevu: number;
  totalReel: number;
  percentage: number;
}

export function useChargesByCategoryV2() {
  const { financeData } = useFirebaseDataV2();

  return useMemo(() => {
    if (!financeData?.expenses) {
      return {
        categories: [],
        totalPrevu: 0,
        totalReel: 0,
      };
    }

    const allExpenses = Object.values(financeData.expenses ?? {});

    const categories = new Map<ExpenseCategory, Expense[]>();
    const categoryTotals = new Map<ExpenseCategory, { prevu: number; reel: number }>();

    allExpenses.forEach((exp) => {
      const cat = exp.category ?? "divers";
      if (!categories.has(cat)) {
        categories.set(cat, []);
        categoryTotals.set(cat, { prevu: 0, reel: 0 });
      }
      categories.get(cat)!.push(exp);

      const totals = categoryTotals.get(cat)!;
      totals.prevu += exp.amount ?? 0;
      totals.reel += exp.actualAmount ?? 0;
    });

    const totalPrevu = Array.from(categoryTotals.values()).reduce(
      (sum, t) => sum + t.prevu,
      0,
    );
    const totalReel = Array.from(categoryTotals.values()).reduce(
      (sum, t) => sum + t.reel,
      0,
    );

    const result: ChargesByCategory[] = [];
    categories.forEach((charges, category) => {
      const totals = categoryTotals.get(category)!;
      result.push({
        category,
        charges: charges.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
        totalPrevu: totals.prevu,
        totalReel: totals.reel,
        percentage: totalPrevu > 0 ? (totals.prevu / totalPrevu) * 100 : 0,
      });
    });

    return {
      categories: result.sort((a, b) => a.category.localeCompare(b.category)),
      totalPrevu,
      totalReel,
    };
  }, [financeData]);
}
