import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Login from "@/pages/Login";

interface DiagData {
  flags: Record<string, boolean | string | number>;
  startingBalance: number | null;
  incomes: Array<{ name: string; amount: number; received: boolean }>;
  chargesTotal: { prevu: number; reel: number };
  coursesCount: number;
  coursesTotal: number;
  creditsTotal: number;
  chargesCategories: Record<string, { prevu: number; reel: number; count: number }>;
  inconsistencies: string[];
  rawUserKeys: string[];
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`flex justify-between py-1 border-b border-gray-100 text-sm ${warn ? "text-red-600 font-semibold" : ""}`}>
      <span className="text-gray-500 mr-4">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{title}</h2>
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 space-y-0.5">
        {children}
      </div>
    </div>
  );
}

export default function Diag() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DiagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ts] = useState(() => new Date().toLocaleString("fr-FR"));

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const userSnap = await get(ref(db, `users/${user!.uid}`));
        const raw = userSnap.val() ?? {};

        // Flags Firebase
        const FLAG_KEYS = [
          "chargesPatchV1Done",
          "chargesPatchV2Done",
          "chargesReelResetMai2026Done",
          "setupWizardDone",
          "profileType",
          "financialProfile",
        ];
        const flags: Record<string, boolean | string | number> = {};
        for (const k of FLAG_KEYS) {
          if (raw[k] !== undefined) flags[k] = raw[k];
        }

        const rawUserKeys = Object.keys(raw);

        // Solde initial (legacy financeData)
        const startingBalance = raw.financeData?.startingBalance ?? null;

        // Revenus (legacy)
        const incomes = (raw.financeData?.incomes ?? []).map((i: any) => ({
          name: i.name,
          amount: i.amount,
          received: !!i.receivedDate,
        }));

        // Charges (nouveau système Firebase)
        const chargesCategories: Record<string, { prevu: number; reel: number; count: number }> = {};
        let totalChargesPrevu = 0;
        let totalChargesReel = 0;

        const chargesRaw = raw.charges ?? {};
        for (const [catId, catVal] of Object.entries(chargesRaw) as [string, any][]) {
          const rubriques = catVal?.rubriques ?? {};
          let catPrevu = 0, catReel = 0, catCount = 0;
          for (const [, rub] of Object.entries(rubriques) as [string, any][]) {
            catPrevu += Number(rub.prevu ?? 0);
            catReel  += Number(rub.reel  ?? 0);
            catCount++;
          }
          chargesCategories[catId] = { prevu: catPrevu, reel: catReel, count: catCount };
          totalChargesPrevu += catPrevu;
          totalChargesReel  += catReel;
        }

        // Courses (budgetCourses)
        const coursesRaw = raw.budgetCourses ?? {};
        const coursesList = Object.values(coursesRaw) as any[];
        const coursesTotal = coursesList.reduce((s, c) => s + Number(c.montant ?? 0), 0);
        const coursesCount = coursesList.length;

        // Crédits (legacy financeData)
        const creditsTotal = (raw.financeData?.credits ?? [])
          .filter((c: any) => !c.settled)
          .reduce((s: number, c: any) => s + Number(c.monthlyPayment ?? 0), 0);

        // Incohérences
        const inconsistencies: string[] = [];

        for (const [catId, cat] of Object.entries(chargesCategories)) {
          for (const [rubId, rub] of Object.entries((chargesRaw[catId]?.rubriques ?? {})) as [string, any][]) {
            const computed = parseFloat((Number(rub.prevu ?? 0) - Number(rub.reel ?? 0)).toFixed(2));
            const stored   = parseFloat(Number(rub.restant ?? 0).toFixed(2));
            if (Math.abs(computed - stored) > 0.01) {
              inconsistencies.push(
                `restant incohérent [${catId}/${rubId}]: stocké=${stored} calculé=${computed}`
              );
            }
          }
        }

        if (startingBalance === null && rawUserKeys.includes("financeData") === false) {
          inconsistencies.push("financeData absent — solde initial inconnu");
        }

        setData({
          flags,
          startingBalance,
          incomes,
          chargesTotal: {
            prevu: parseFloat(totalChargesPrevu.toFixed(2)),
            reel:  parseFloat(totalChargesReel.toFixed(2)),
          },
          coursesCount,
          coursesTotal: parseFloat(coursesTotal.toFixed(2)),
          creditsTotal: parseFloat(creditsTotal.toFixed(2)),
          chargesCategories,
          inconsistencies,
          rawUserKeys,
        });
      } catch (e: any) {
        setError(e?.message ?? "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  if (authLoading) return <div className="p-8 text-sm text-gray-400">Chargement auth…</div>;
  if (!user) return <Login />;
  if (loading) return <div className="p-8 text-sm text-gray-400">Chargement diagnostic…</div>;
  if (error) return <div className="p-8 text-sm text-red-500">Erreur : {error}</div>;
  if (!data) return null;

  const receivedTotal = data.incomes.filter((i) => i.received).reduce((s, i) => s + i.amount, 0);
  const soldeStep1 = (data.startingBalance ?? 0);
  const soldeStep2 = soldeStep1 + receivedTotal;
  const soldeStep3 = soldeStep2 - data.chargesTotal.reel;
  const soldeStep4 = soldeStep3 - data.coursesTotal;
  const soldeFinal = soldeStep4 - data.creditsTotal;

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-mono text-sm max-w-lg mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-bold">Diagnostic</h1>
        <span className="text-xs text-gray-400">{ts}</span>
      </div>
      <div className="text-xs text-gray-400 mb-4 break-all">uid: {user.uid}</div>

      {/* Flags Firebase */}
      <Section title="Flags Firebase">
        {Object.entries(data.flags).map(([k, v]) => (
          <Row key={k} label={k} value={String(v)} />
        ))}
        {Object.keys(data.flags).length === 0 && (
          <Row label="(aucun flag trouvé)" value="—" />
        )}
      </Section>

      {/* Clés Firebase présentes */}
      <Section title="Clés présentes dans /users/uid">
        <Row label="clés" value={data.rawUserKeys.join(", ")} />
      </Section>

      {/* Revenus */}
      <Section title="Revenus (legacy financeData)">
        {data.incomes.map((i, idx) => (
          <Row
            key={idx}
            label={i.name}
            value={`${fmt(i.amount)} ${i.received ? "✓ reçu" : "en attente"}`}
          />
        ))}
        <Row label="TOTAL reçu" value={fmt(receivedTotal)} />
      </Section>

      {/* Charges par catégorie */}
      <Section title="Charges fixes (nouveau système)">
        {Object.entries(data.chargesCategories).map(([cat, v]) => (
          <Row
            key={cat}
            label={`${cat} (${v.count})`}
            value={`prévu ${fmt(v.prevu)} | réel ${fmt(v.reel)}`}
          />
        ))}
        <Row label="TOTAL prévu" value={fmt(data.chargesTotal.prevu)} />
        <Row label="TOTAL réel" value={fmt(data.chargesTotal.reel)} />
      </Section>

      {/* Courses */}
      <Section title="Budget courses">
        <Row label="Entrées" value={String(data.coursesCount)} />
        <Row label="Total dépensé" value={fmt(data.coursesTotal)} />
      </Section>

      {/* Crédits */}
      <Section title="Crédits mensuels (legacy)">
        <Row label="Total mensualités actives" value={fmt(data.creditsTotal)} />
      </Section>

      {/* Calcul solde étape par étape */}
      <Section title="Solde — étape par étape">
        <Row label="1. Solde initial"           value={fmt(soldeStep1)} />
        <Row label="2. + salaires reçus"         value={fmt(soldeStep2)} />
        <Row label="3. − charges.reel"           value={fmt(soldeStep3)} />
        <Row label="4. − courses dépensées"      value={fmt(soldeStep4)} />
        <Row label="5. − crédits mensuels"       value={fmt(soldeFinal)} warn={soldeFinal < 0} />
      </Section>

      {/* Incohérences */}
      <Section title={`Incohérences détectées (${data.inconsistencies.length})`}>
        {data.inconsistencies.length === 0 ? (
          <Row label="Aucune" value="✓" />
        ) : (
          data.inconsistencies.map((msg, i) => (
            <Row key={i} label={`#${i + 1}`} value={msg} warn />
          ))
        )}
      </Section>
    </div>
  );
}
