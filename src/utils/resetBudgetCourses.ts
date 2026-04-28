import { auth, db } from "@/lib/firebase";
import { ref, get, set, remove } from "firebase/database";

export const resetBudgetCourses = async (month: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  const coursesRef = ref(db, `users/${user.uid}/budgetCourses`);
  const snap = await get(coursesRef);
  const raw = snap.val();

  // Archive current courses to monthly history before clearing
  if (raw && Object.keys(raw).length > 0) {
    await set(ref(db, `users/${user.uid}/monthly_history/${month}/courses`), raw);
  }

  // Reset for new cycle
  await remove(coursesRef);
};
