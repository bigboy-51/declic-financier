import { useMemo } from "react";
import { useFirebaseDataV2 } from "@/context/FirebaseDataContextV2";
import type { GroceryExpense } from "@/types/finance";

export interface CoursesByMonth {
  month: string;
  monthLabel: string;
  courses: GroceryExpense[];
  total: number;
}

export function useCoursesByMonthV2() {
  const { financeData } = useFirebaseDataV2();

  return useMemo(() => {
    if (!financeData?.grocery_expenses) {
      return {
        months: [],
        currentMonth: {
          month: "",
          monthLabel: "",
          courses: [],
          total: 0,
        },
      };
    }

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const groupedByMonth = new Map<string, GroceryExpense[]>();

    (financeData.grocery_expenses ?? []).forEach((course) => {
      const month = course.date?.substring(0, 7) ?? currentMonthStr;
      if (!groupedByMonth.has(month)) {
        groupedByMonth.set(month, []);
      }
      groupedByMonth.get(month)!.push(course);
    });

    const monthLabels = new Map<string, string>();
    const monthNames = [
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
    ];

    groupedByMonth.forEach((_, month) => {
      const [year, monthNum] = month.split("-");
      const idx = parseInt(monthNum) - 1;
      monthLabels.set(month, `${monthNames[idx]} ${year}`);
    });

    const months: CoursesByMonth[] = [];
    groupedByMonth.forEach((courses, month) => {
      const total = courses.reduce((sum, c) => sum + (c.amount ?? 0), 0);
      months.push({
        month,
        monthLabel: monthLabels.get(month) ?? month,
        courses: courses.sort(
          (a, b) => new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime(),
        ),
        total,
      });
    });

    const currentMonthCourses = groupedByMonth.get(currentMonthStr) ?? [];
    const currentMonthTotal = currentMonthCourses.reduce((sum, c) => sum + (c.amount ?? 0), 0);

    return {
      months: months.sort((a, b) => b.month.localeCompare(a.month)),
      currentMonth: {
        month: currentMonthStr,
        monthLabel: monthLabels.get(currentMonthStr) ?? currentMonthStr,
        courses: currentMonthCourses.sort(
          (a, b) => new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime(),
        ),
        total: currentMonthTotal,
      },
    };
  }, [financeData]);
}
