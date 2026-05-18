import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { ref, onValue, set, off } from "firebase/database";
import { db } from "@/lib/firebase";
import type { FinanceData } from "@/types/finance";

type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface FirebaseDataContextV2Type {
  financeData: FinanceData | null;
  loading: boolean;
  syncStatus: SyncStatus;
  saveFinanceData: (data: FinanceData) => void;
}

const FirebaseDataContextV2 = createContext<FirebaseDataContextV2Type | null>(null);

const DEBOUNCE_MS = 800;

interface Props {
  userId: string;
  children: ReactNode;
}

export function FirebaseDataProviderV2({ userId, children }: Props) {
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  const lastWriteTime = useRef<number>(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(
    (path: string, data: any) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSyncStatus("syncing");
      lastWriteTime.current = Date.now();
      saveTimer.current = setTimeout(async () => {
        try {
          await set(ref(db, path), data ?? null);
          setSyncStatus("synced");
        } catch (err) {
          console.error("Firebase save error:", err);
          setSyncStatus("error");
        }
      }, DEBOUNCE_MS);
    },
    [],
  );

  useEffect(() => {
    if (!userId) return;

    const financePath = `users/${userId}/debt_snowball_data`;
    setLoading(true);

    const grace = 4000;
    const guard = () => Date.now() - lastWriteTime.current < grace;

    const unsubscribe = onValue(ref(db, financePath), (snap) => {
      if (guard()) {
        setLoading(false);
        return;
      }
      setFinanceData(snap.exists() ? snap.val() : null);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [userId]);

  const saveFinanceData = useCallback(
    (data: FinanceData) => {
      setFinanceData(data);
      debouncedSave(`users/${userId}/debt_snowball_data`, data);
    },
    [userId, debouncedSave],
  );

  return (
    <FirebaseDataContextV2.Provider
      value={{
        financeData,
        loading,
        syncStatus,
        saveFinanceData,
      }}
    >
      {children}
    </FirebaseDataContextV2.Provider>
  );
}

export function useFirebaseDataV2() {
  const ctx = useContext(FirebaseDataContextV2);
  if (!ctx) throw new Error("useFirebaseDataV2 must be used within FirebaseDataProviderV2");
  return ctx;
}
