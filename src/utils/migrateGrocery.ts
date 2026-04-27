import { auth, db } from "@/lib/firebase";
import { ref, get, set, update } from "firebase/database";

export const migrateGroceryToBudgetCourses = async (): Promise<{ success: boolean; migrated: number }> => {
  const user = auth.currentUser;
  if (!user) {
    console.log("❌ No user logged in");
    return { success: false, migrated: 0 };
  }

  try {
    const userRef     = ref(db, `users/${user.uid}`);
    const userSnap    = await get(userRef);
    const migrationDone = userSnap.val()?.groceryMigrationDone ?? false;

    if (migrationDone) {
      console.log("✅ Migration Grocery déjà effectuée, skip");
      return { success: false, migrated: 0 };
    }

    // Lire les groceryExpenses depuis /finances
    const grocerySnap = await get(ref(db, `users/${user.uid}/finances/groceryExpenses`));
    const rawGrocery  = grocerySnap.val();

    if (!rawGrocery) {
      console.log("ℹ️ Aucune grocery trouvée dans /finances");
      await update(userRef, { groceryMigrationDone: true });
      return { success: true, migrated: 0 };
    }

    // Normaliser en tableau (RTDB peut stocker array ou object map)
    const allGrocery: Array<{ id: string; amount: number; label?: string; dateISO?: string }> =
      Array.isArray(rawGrocery)
        ? rawGrocery.filter(Boolean)
        : Object.entries(rawGrocery).map(([k, v]) => ({ id: k, ...(v as object) }));

    // Migrer toutes les entrées valides (pas de filtre de date)
    const toMigrate = allGrocery.filter((item) => item.dateISO);

    console.log(`📊 Migration en cours...`);
    console.log(`Grocery trouvées : ${toMigrate.length}`);

    if (toMigrate.length === 0) {
      console.log("ℹ️ Aucune grocery à migrer");
      await update(userRef, { groceryMigrationDone: true });
      return { success: true, migrated: 0 };
    }

    // Lire les entrées déjà migrées pour éviter les doublons
    const existingSnap = await get(ref(db, `users/${user.uid}/budgetCourses`));
    const existing = existingSnap.val() ?? {};
    const alreadyMigratedIds = new Set(
      Object.values(existing)
        .map((e: any) => e.originalGroceryId)
        .filter(Boolean)
    );

    const newEntries = toMigrate.filter((item) => !alreadyMigratedIds.has(item.id));
    console.log(`➕ Nouvelles entrées à migrer : ${newEntries.length}`);

    if (newEntries.length === 0) {
      await update(userRef, { groceryMigrationDone: true });
      return { success: true, migrated: 0 };
    }

    const now = new Date().toISOString();
    const writes: Promise<void>[] = [];

    for (const item of newEntries) {
      const id = `migrated-${item.id ?? Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      writes.push(
        set(ref(db, `users/${user.uid}/budgetCourses/${id}`), {
          date:              item.dateISO!,
          montant:           item.amount ?? 0,
          moyenPaiement:     "Cash",
          label:             item.label ?? "",
          createdAt:         now,
          updatedAt:         now,
          source:            "migrated",
          originalGroceryId: item.id ?? null,
        })
      );
    }

    await Promise.all(writes);
    await update(userRef, { groceryMigrationDone: true });

    console.log(`✅ Migration réussie : ${newEntries.length} dépenses migrées`);
    return { success: true, migrated: newEntries.length };
  } catch (error) {
    console.error("❌ Erreur migration Grocery:", error);
    return { success: false, migrated: 0 };
  }
};

// Migre les entrées restantes non couvertes par la première migration (13 avril - aujourd'hui)
export const migrateRemainingGroceries = async (): Promise<{ success: boolean; migrated: number }> => {
  const user = auth.currentUser;
  if (!user) return { success: false, migrated: 0 };

  try {
    const userRef  = ref(db, `users/${user.uid}`);
    const userSnap = await get(userRef);
    if (userSnap.val()?.groceryMigrationV2Done) {
      console.log("✅ Migration V2 déjà effectuée, skip");
      return { success: false, migrated: 0 };
    }

    const grocerySnap = await get(ref(db, `users/${user.uid}/finances/groceryExpenses`));
    const rawGrocery  = grocerySnap.val();
    if (!rawGrocery) {
      await update(userRef, { groceryMigrationV2Done: true });
      return { success: true, migrated: 0 };
    }

    const allGrocery: Array<{ id: string; amount: number; label?: string; dateISO?: string; moyenPaiement?: string }> =
      Array.isArray(rawGrocery)
        ? rawGrocery.filter(Boolean)
        : Object.entries(rawGrocery).map(([k, v]) => ({ id: k, ...(v as object) }));

    // Lire les originalGroceryId déjà présents dans budgetCourses
    const existingSnap = await get(ref(db, `users/${user.uid}/budgetCourses`));
    const existing = existingSnap.val() ?? {};
    const alreadyMigratedIds = new Set(
      Object.values(existing)
        .map((e: any) => e.originalGroceryId)
        .filter(Boolean)
    );

    const toMigrate = allGrocery.filter(
      (item) => item.dateISO && !alreadyMigratedIds.has(item.id)
    );

    console.log(`📊 Migration V2 : ${toMigrate.length} entrées restantes`);

    if (toMigrate.length === 0) {
      await update(userRef, { groceryMigrationV2Done: true });
      return { success: true, migrated: 0 };
    }

    const now = new Date().toISOString();
    const writes = toMigrate.map((item) => {
      const id = `migrated-v2-${item.id ?? Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      return set(ref(db, `users/${user.uid}/budgetCourses/${id}`), {
        date:              item.dateISO!,
        montant:           item.amount ?? 0,
        moyenPaiement:     (item.moyenPaiement as any) ?? "Cash",
        label:             item.label ?? "",
        createdAt:         now,
        updatedAt:         now,
        source:            "migrated-v2",
        originalGroceryId: item.id ?? null,
      });
    });

    await Promise.all(writes);
    await update(userRef, { groceryMigrationV2Done: true });

    console.log(`✅ Migration V2 réussie : ${toMigrate.length} dépenses récupérées`);
    return { success: true, migrated: toMigrate.length };
  } catch (error) {
    console.error("❌ Erreur migration V2:", error);
    return { success: false, migrated: 0 };
  }
};
