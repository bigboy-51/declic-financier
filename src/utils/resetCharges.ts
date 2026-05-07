import { auth, db } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";

export const resetChargesReel = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  const chargesRef = ref(db, `users/${user.uid}/charges`);
  const snap = await get(chargesRef);
  const raw = snap.val();
  if (!raw) return;

  const writes: Promise<void>[] = [];

  for (const [catId, catVal] of Object.entries(raw) as [string, any][]) {
    const rubriques = catVal?.rubriques ?? {};
    for (const [rubId, rub] of Object.entries(rubriques) as [string, any][]) {
      const prevu = Number(rub.prevu ?? 0);
      writes.push(
        update(ref(db, `users/${user.uid}/charges/${catId}/rubriques/${rubId}`), {
          reel: 0,
          restant: prevu,
          updatedAt: new Date().toISOString(),
        })
      );
    }
  }

  await Promise.all(writes);
};
