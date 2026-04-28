import { auth, db } from "@/lib/firebase";
import { ref, get, set, update } from "firebase/database";

export const debugGroceryData = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) { console.log("❌ debug: pas d'utilisateur"); return; }
  const snap = await get(ref(db, `users/${user.uid}/debt_snowball_data`));
  const raw = snap.val();
  const groceries = raw?.groceryExpenses;
  console.log("🔍 groceryExpenses (debt_snowball_data):", groceries ? `${Array.isArray(groceries) ? groceries.length : Object.keys(groceries).length} entrées` : "null");
  if (groceries) {
    const first = Array.isArray(groceries) ? groceries[0] : Object.values(groceries)[0];
    console.log("🔍 Exemple (1ère entrée):", JSON.stringify(first, null, 2));
  }
  const coursesSnap = await get(ref(db, `users/${user.uid}/budgetCourses`));
  const courses = coursesSnap.val();
  console.log("🔍 budgetCourses:", courses ? `${Object.keys(courses).length} entrées` : "null");
};

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

    const snap       = await get(ref(db, `users/${user.uid}/debt_snowball_data`));
    const rawGrocery = snap.val()?.groceryExpenses;
    if (!rawGrocery) {
      await update(userRef, { groceryMigrationV2Done: true });
      return { success: true, migrated: 0 };
    }

    const allGrocery: Array<{ id: string; amount: number; label?: string; dateISO?: string; moyenPaiement?: string }> =
      Array.isArray(rawGrocery)
        ? rawGrocery.filter(Boolean).map((v: any, i: number) => ({ id: String(i), ...v }))
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

// Migration V3 : force re-migration en gérant tous les formats de date possibles
export const migrateGroceryV3 = async (): Promise<{ success: boolean; migrated: number }> => {
  const user = auth.currentUser;
  if (!user) return { success: false, migrated: 0 };

  try {
    const userRef  = ref(db, `users/${user.uid}`);
    const userSnap = await get(userRef);
    if (userSnap.val()?.groceryMigrationV3Done) return { success: false, migrated: 0 };

    const snap       = await get(ref(db, `users/${user.uid}/debt_snowball_data`));
    const rawGrocery = snap.val()?.groceryExpenses;

    if (!rawGrocery) {
      await update(userRef, { groceryMigrationV3Done: true });
      return { success: true, migrated: 0 };
    }

    const allEntries: Array<Record<string, unknown>> = Array.isArray(rawGrocery)
      ? rawGrocery.filter(Boolean).map((v: any, i: number) => ({ _key: String(i), ...v }))
      : Object.entries(rawGrocery).map(([k, v]) => ({ _key: k, ...(v as object) }));

    // Log la structure des 3 premières entrées pour debug
    console.log("🔍 Structure groceryExpenses (3 premières):", JSON.stringify(allEntries.slice(0, 3), null, 2));

    const existingSnap = await get(ref(db, `users/${user.uid}/budgetCourses`));
    const existing = existingSnap.val() ?? {};
    const alreadyMigratedIds = new Set(
      Object.values(existing).map((e: any) => e.originalGroceryId).filter(Boolean)
    );

    const toMigrate = allEntries.filter((item) => {
      const id = String(item._key ?? item.id ?? "");
      if (alreadyMigratedIds.has(id)) return false;
      // Accepte n'importe quel champ de date non vide
      const dateVal = item.dateISO ?? item.date ?? item.createdAt ?? item.timestamp;
      return !!dateVal;
    });

    console.log(`📊 Migration V3 : ${toMigrate.length} entrées à migrer`);

    if (toMigrate.length === 0) {
      await update(userRef, { groceryMigrationV3Done: true });
      return { success: true, migrated: 0 };
    }

    const now = new Date().toISOString();
    const writes = toMigrate.map((item) => {
      const id       = String(item._key ?? item.id ?? Date.now());
      const dateVal  = String(item.dateISO ?? item.date ?? item.createdAt ?? item.timestamp ?? "");
      // Normalise en YYYY-MM-DD
      const dateStr  = dateVal.length >= 10 ? dateVal.slice(0, 10) : dateVal;
      const entryId  = `migrated-v3-${id}-${Math.random().toString(36).slice(2, 6)}`;
      return set(ref(db, `users/${user.uid}/budgetCourses/${entryId}`), {
        date:              dateStr,
        montant:           Number(item.amount ?? item.montant ?? 0),
        moyenPaiement:     String(item.moyenPaiement ?? "Cash"),
        label:             String(item.label ?? item.name ?? ""),
        createdAt:         now,
        updatedAt:         now,
        source:            "migrated-v3",
        originalGroceryId: id,
      });
    });

    await Promise.all(writes);
    await update(userRef, { groceryMigrationV3Done: true });

    console.log(`✅ Migration V3 réussie : ${toMigrate.length} courses récupérées`);
    return { success: true, migrated: toMigrate.length };
  } catch (error) {
    console.error("❌ Erreur migration V3:", error);
    return { success: false, migrated: 0 };
  }
};

// Migration V4 — chemin correct debt_snowball_data/groceryExpenses
export const migrateGroceryV4 = async (): Promise<{ success: boolean; migrated: number }> => {
  const user = auth.currentUser;
  if (!user) return { success: false, migrated: 0 };

  try {
    const userRef  = ref(db, `users/${user.uid}`);
    const userSnap = await get(userRef);
    if (userSnap.val()?.groceryMigrationV4Done) return { success: false, migrated: 0 };

    const snap       = await get(ref(db, `users/${user.uid}/debt_snowball_data`));
    const rawGrocery = snap.val()?.groceryExpenses;

    if (!rawGrocery) {
      console.log("ℹ️ V4: aucune groceryExpenses dans debt_snowball_data");
      await update(userRef, { groceryMigrationV4Done: true });
      return { success: true, migrated: 0 };
    }

    const allEntries: Array<{ id: string; amount: number; date?: string; dateISO?: string; label?: string; name?: string; moyenPaiement?: string }> =
      Array.isArray(rawGrocery)
        ? rawGrocery.filter(Boolean).map((v: any, i: number) => ({ id: String(v.id ?? i), ...v }))
        : Object.entries(rawGrocery).map(([k, v]) => ({ id: k, ...(v as any) }));

    console.log(`🔍 V4: ${allEntries.length} groceries, exemple:`, JSON.stringify(allEntries[0]));

    const existingSnap = await get(ref(db, `users/${user.uid}/budgetCourses`));
    const existing = existingSnap.val() ?? {};
    const alreadyMigratedIds = new Set(
      Object.values(existing).map((e: any) => e.originalGroceryId).filter(Boolean)
    );

    const toMigrate = allEntries.filter((item) => {
      if (alreadyMigratedIds.has(item.id)) return false;
      return !!(item.dateISO ?? item.date);
    });

    console.log(`📊 V4: ${toMigrate.length} entrées à migrer`);

    if (toMigrate.length === 0) {
      await update(userRef, { groceryMigrationV4Done: true });
      return { success: true, migrated: 0 };
    }

    const now = new Date().toISOString();
    const writes = toMigrate.map((item) => {
      const dateRaw = item.dateISO ?? item.date ?? "";
      const dateStr = dateRaw.length >= 10 ? dateRaw.slice(0, 10) : dateRaw;
      const entryId = `migrated-v4-${item.id}-${Math.random().toString(36).slice(2, 6)}`;
      return set(ref(db, `users/${user.uid}/budgetCourses/${entryId}`), {
        date:              dateStr,
        montant:           Number(item.amount ?? 0),
        moyenPaiement:     item.moyenPaiement ?? "Cash",
        label:             item.label ?? item.name ?? "",
        createdAt:         now,
        updatedAt:         now,
        source:            "migrated-v4",
        originalGroceryId: item.id,
      });
    });

    await Promise.all(writes);
    await update(userRef, { groceryMigrationV4Done: true });

    console.log(`✅ Migration V4 réussie : ${toMigrate.length} courses récupérées`);
    return { success: true, migrated: toMigrate.length };
  } catch (error) {
    console.error("❌ Erreur migration V4:", error);
    return { success: false, migrated: 0 };
  }
};
