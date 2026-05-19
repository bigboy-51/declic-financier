import { auth, db } from "@/lib/firebase";
import { ref, get, set, update } from "firebase/database";

const NEW_CHARGES = [
  { id: "soin-medical", name: "Soin médical", categoryId: "sante",     prevu: 0, hasDatedEntries: true },
  { id: "sncf",         name: "SNCF",          categoryId: "transport", prevu: 0 },
  { id: "darty-serv",   name: "Darty Serv.",   categoryId: "divers",    prevu: 0 },
  { id: "darty",        name: "Darty",         categoryId: "divers",    prevu: 0 },
  { id: "travaux",      name: "Travaux",        categoryId: "logement",  prevu: 0, hasDatedEntries: true },
];

const AMOUNT_FIXES: Array<{ id: string; categoryId: string; prevu: number; hasDatedEntries?: boolean }> = [
  { id: "pharmacie-fixe",    categoryId: "sante",     prevu: 50, hasDatedEntries: true },
  { id: "entretien-voiture", categoryId: "transport", prevu: 50 },
];

export const patchCharges = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = ref(db, `users/${user.uid}`);
  const userSnap = await get(userRef);
  if (userSnap.val()?.chargesPatchV2Done) return;

  const now = new Date().toISOString();
  const writes: Promise<void>[] = [];

  for (const charge of NEW_CHARGES) {
    const chargeRef = ref(db, `users/${user.uid}/charges/${charge.categoryId}/rubriques/${charge.id}`);
    const snap = await get(chargeRef);
    if (!snap.exists()) {
      writes.push(set(chargeRef, {
        name: charge.name, prevu: charge.prevu, reel: 0,
        restant: charge.prevu, locked: false, hasDatedEntries: charge.hasDatedEntries ?? false, createdAt: now, updatedAt: now,
      }));
    }
  }

  for (const fix of AMOUNT_FIXES) {
    const chargeRef = ref(db, `users/${user.uid}/charges/${fix.categoryId}/rubriques/${fix.id}`);
    const snap = await get(chargeRef);
    if (snap.exists()) {
      const current = snap.val();
      const restant = parseFloat((fix.prevu - (current.reel ?? 0)).toFixed(2));
      const updateData: any = { prevu: fix.prevu, restant, updatedAt: now };
      if (fix.hasDatedEntries !== undefined) {
        updateData.hasDatedEntries = fix.hasDatedEntries;
      }
      writes.push(update(chargeRef, updateData));
    } else if (fix.hasDatedEntries !== undefined) {
      writes.push(set(chargeRef, {
        name: fix.id.replace(/-/g, ' '), prevu: fix.prevu, reel: 0,
        restant: fix.prevu, locked: false, hasDatedEntries: fix.hasDatedEntries, createdAt: now, updatedAt: now,
      }));
    }
  }

  await Promise.all(writes);
  await update(userRef, { chargesPatchV1Done: true, chargesPatchV2Done: true });
};

// Marquer les charges avec entrées datées
const DATED_CHARGE_IDS = ["pharmacie-fixe", "travaux", "essence", "soin-medical"];

export const patchDatedCharges = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = ref(db, `users/${user.uid}`);
  const userSnap = await get(userRef);
  if (userSnap.val()?.chargesDatedPatchDone) return;

  const chargesSnap = await get(ref(db, `users/${user.uid}/charges`));
  const raw = chargesSnap.val();
  if (!raw) return;

  const writes: Promise<void>[] = [];
  const now = new Date().toISOString();

  for (const [catId, catVal] of Object.entries(raw) as [string, any][]) {
    const rubriques = catVal?.rubriques ?? {};
    for (const [rubId, rub] of Object.entries(rubriques) as [string, any][]) {
      if (DATED_CHARGE_IDS.includes(rubId) && !rub.hasDatedEntries) {
        writes.push(update(
          ref(db, `users/${user.uid}/charges/${catId}/rubriques/${rubId}`),
          { hasDatedEntries: true, updatedAt: now }
        ));
      }
    }
  }

  await Promise.all(writes);
  await update(userRef, { chargesDatedPatchDone: true });
};

// Remet tous les réels à 0 une seule fois (correctif post-clôture avril)
export const patchResetChargesReel = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = ref(db, `users/${user.uid}`);
  const userSnap = await get(userRef);
  if (userSnap.val()?.chargesReelResetMai2026Done) return;

  const chargesSnap = await get(ref(db, `users/${user.uid}/charges`));
  const raw = chargesSnap.val();
  if (!raw) return;

  const writes: Promise<void>[] = [];
  const now = new Date().toISOString();

  for (const [catId, catVal] of Object.entries(raw) as [string, any][]) {
    const rubriques = catVal?.rubriques ?? {};
    for (const [rubId, rub] of Object.entries(rubriques) as [string, any][]) {
      const prevu = Number(rub.prevu ?? 0);
      if (Number(rub.reel ?? 0) !== 0) {
        writes.push(update(
          ref(db, `users/${user.uid}/charges/${catId}/rubriques/${rubId}`),
          { reel: 0, restant: prevu, updatedAt: now }
        ));
      }
    }
  }

  await Promise.all(writes);
  await update(userRef, { chargesReelResetMai2026Done: true });
};

