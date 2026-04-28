import { auth, db } from "@/lib/firebase";
import { ref, get, set, update } from "firebase/database";

export const migrateGroceryToBudgetCourses = async (): Promise<{ success: boolean; migrated: number }> => {
  const user = auth.currentUser;
  if (!user) return { success: false, migrated: 0 };

  try {
    const userRef       = ref(db, `users/${user.uid}`);
    const userSnap      = await get(userRef);
    const migrationDone = userSnap.val()?.groceryMigrationDone ?? false;

    if (migrationDone) return { success: false, migrated: 0 };

    const snap       = await get(ref(db, `users/${user.uid}/debt_snowball_data`));
    const rawGrocery = snap.val()?.groceryExpenses;

    if (!rawGrocery) {
      await update(userRef, { groceryMigrationDone: true });
      return { success: true, migrated: 0 };
    }

    const allGrocery: Array<{ id: string; amount: number; label?: string; date?: string; dateISO?: string; paymentMethod?: string }> =
      Array.isArray(rawGrocery)
        ? rawGrocery.filter(Boolean).map((v: any, i: number) => ({ id: String(v.id ?? i), ...v }))
        : Object.entries(rawGrocery).map(([k, v]) => ({ id: k, ...(v as object) }));

    const existingSnap = await get(ref(db, `users/${user.uid}/budgetCourses`));
    const existing     = existingSnap.val() ?? {};
    const migratedIds  = new Set(
      Object.values(existing).map((e: any) => e.originalGroceryId).filter(Boolean)
    );

    const toMigrate = allGrocery.filter(
      (item) => !migratedIds.has(item.id) && !!(item.dateISO ?? item.date)
    );

    if (toMigrate.length === 0) {
      await update(userRef, { groceryMigrationDone: true });
      return { success: true, migrated: 0 };
    }

    const now    = new Date().toISOString();
    const writes = toMigrate.map((item) => {
      const dateRaw = item.dateISO ?? item.date ?? "";
      const dateStr = dateRaw.length >= 10 ? dateRaw.slice(0, 10) : dateRaw;
      const pm      = normalizePaymentMethod(item.paymentMethod ?? "");
      const entryId = `migrated-${item.id}-${Math.random().toString(36).slice(2, 6)}`;
      return set(ref(db, `users/${user.uid}/budgetCourses/${entryId}`), {
        date:              dateStr,
        montant:           Number(item.amount ?? 0),
        moyenPaiement:     pm,
        label:             (item as any).label ?? (item as any).name ?? "",
        createdAt:         now,
        updatedAt:         now,
        source:            "migrated",
        originalGroceryId: item.id,
      });
    });

    await Promise.all(writes);
    await update(userRef, { groceryMigrationDone: true });
    return { success: true, migrated: toMigrate.length };
  } catch (error) {
    console.error("❌ Erreur migration Grocery:", error);
    return { success: false, migrated: 0 };
  }
};

function normalizePaymentMethod(raw: string): string {
  switch (raw?.toLowerCase()) {
    case "cb":      return "CB";
    case "cash":    return "Cash";
    case "retrait": return "Retrait";
    case "cheque":
    case "chèque":  return "Chèque";
    default:        return "CB";
  }
}

export const fixPaymentMethods = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userRef  = ref(db, `users/${user.uid}`);
    const userSnap = await get(userRef);
    if (userSnap.val()?.paymentMethodFixDone) return;

    const [grocerySnap, coursesSnap] = await Promise.all([
      get(ref(db, `users/${user.uid}/debt_snowball_data`)),
      get(ref(db, `users/${user.uid}/budgetCourses`)),
    ]);

    const rawGrocery = grocerySnap.val()?.groceryExpenses;
    const courses    = coursesSnap.val() ?? {};

    if (!rawGrocery) {
      await update(userRef, { paymentMethodFixDone: true });
      return;
    }

    const groceryArr: any[] = Array.isArray(rawGrocery)
      ? rawGrocery.filter(Boolean)
      : Object.values(rawGrocery);

    const fixes: Promise<void>[] = [];
    for (const [key, entry] of Object.entries(courses) as [string, any][]) {
      if (!entry.source?.startsWith("migrated")) continue;
      const idx     = parseInt(entry.originalGroceryId ?? "", 10);
      const orig    = isNaN(idx) ? null : groceryArr[idx];
      const rawPm   = orig?.paymentMethod ?? orig?.moyenPaiement ?? "";
      const correct = normalizePaymentMethod(rawPm);
      if (correct !== entry.moyenPaiement) {
        fixes.push(update(ref(db, `users/${user.uid}/budgetCourses/${key}`), { moyenPaiement: correct }));
      }
    }

    await Promise.all(fixes);
    await update(userRef, { paymentMethodFixDone: true });
  } catch (error) {
    console.error("❌ Erreur fixPaymentMethods:", error);
  }
};
