import { useCoursesByMonthV2 } from "@/hooks/useCoursesByMonthV2";

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

const paymentIcons: Record<string, string> = {
  cb: "💳",
  especes: "💵",
  virement: "🏧",
  autre: "✓",
};

export default function CoursesTabV2() {
  const courses = useCoursesByMonthV2();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Current Month Summary */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <div className="text-xs text-muted-foreground font-semibold">
          {courses.currentMonth.monthLabel}
        </div>
        <div className="text-4xl font-bold text-sky-400">{fmt(courses.currentMonth.total)}</div>
        <div className="text-xs text-muted-foreground">
          {courses.currentMonth.courses.length} transaction{
            courses.currentMonth.courses.length > 1 ? "s" : ""
          }
        </div>
      </div>

      {/* Current Month Courses */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="text-xs text-muted-foreground font-semibold">Détail</div>
        {courses.currentMonth.courses.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Aucune transaction ce mois
          </div>
        ) : (
          <div className="space-y-2">
            {courses.currentMonth.courses.map((course) => (
              <div key={course.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {paymentIcons[course.paymentMethod] || "✓"}{" "}
                      {course.customType || course.type}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{course.date}</div>
                </div>
                <div className="font-semibold text-sm text-orange-500">{fmt(course.amount ?? 0)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Other Months */}
      {courses.months
        .filter((m) => m.month !== courses.currentMonth.month)
        .slice(0, 5)
        .map((month) => (
          <div key={month.month} className="bg-card border border-border rounded-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs text-muted-foreground font-semibold">
                {month.monthLabel}
              </div>
              <div className="font-semibold text-sm">{fmt(month.total)}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {month.courses.length} transaction{month.courses.length > 1 ? "s" : ""}
            </div>
          </div>
        ))}
    </div>
  );
}
