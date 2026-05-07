import { useState } from "react";
import {
  Wallet,
  CalendarCheck,
  CalendarClock,
  Pencil,
} from "lucide-react";
import type { UserType } from "@/context/AuthContext";
import type { ProfileType } from "@/lib/profiles";

interface DashboardHeroProps {
  totalIncome: number;
  totalCredits: number;
  totalExpenses: number;
  groceryBudget: number;
  surplus: number;
  startingBalance: number;
  incomes: Array<{
    id: string;
    name: string;
    amount: number;
    receiptDate?: number;
    receivedDate?: string | null;
  }>;
  credits: Array<{
    id: string;
    name: string;
    monthlyPayment: number;
    remainingAmount: number;
    initialAmount: number;
    settled?: boolean;
  }>;
  projection: Array<{ month: number; debt: number; treasury: number }>;
  onUpdateIncome: (
    id: string,
    updates: { amount?: number; receiptDate?: number; receivedDate?: string | null },
  ) => void;
  onUpdateStartingBalance: (amount: number) => void;
  onCloseMonth?: () => void;
  currentMonth?: string;
  monthlyRewards?: number;
  expenses: Array<{ id: string; name: string; amount: number; actualAmount: number }>;
  totalDebt: number;
  monthlyPayment: number;
  onAttributeToCredits?: (amount: number) => void;
  groceryExpenses?: Array<{ id: string; name: string; amount: number; date?: string }>;
  appliedCreditsAmount?: number;
  lastPaymentMonth?: string;
  onNavigateToExpenses?: () => void;
  userType?: UserType | null;
  profileType?: ProfileType | null;
  dynamicBalance?: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export const DashboardHero = ({
  totalIncome,
  startingBalance,
  incomes,
  onUpdateIncome,
  onUpdateStartingBalance,
  dynamicBalance: dynamicBalanceProp,
}: DashboardHeroProps): JSX.Element => {
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceValue, setBalanceValue] = useState(startingBalance);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [incomeAmountValue, setIncomeAmountValue] = useState(0);
  const [incomeDateValue, setIncomeDateValue] = useState(1);
  const [savingIncomeId, setSavingIncomeId] = useState<string | null>(null);

  const receivedSalaries = incomes.reduce((sum, i) => sum + (i.receivedDate ? i.amount : 0), 0);
  const dynamicBalance = dynamicBalanceProp ?? startingBalance + receivedSalaries;

  const startEditingIncome = (income: { id: string; amount: number; receiptDate?: number }) => {
    setEditingIncomeId(income.id);
    setIncomeAmountValue(income.amount);
    setIncomeDateValue(income.receiptDate ?? 1);
  };

  const handleMarkReceived = (id: string) => {
    const d = new Date();
    setSavingIncomeId(id);
    onUpdateIncome(id, {
      receivedDate: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
    });
    setTimeout(() => setSavingIncomeId(null), 500);
  };

  const handleMarkPending = (id: string) => {
    setSavingIncomeId(id);
    onUpdateIncome(id, { receivedDate: null });
    setTimeout(() => setSavingIncomeId(null), 500);
  };

  const handleIncomeSave = (id: string) => {
    setSavingIncomeId(id);
    onUpdateIncome(id, { amount: incomeAmountValue, receiptDate: incomeDateValue });
    setTimeout(() => { setEditingIncomeId(null); setSavingIncomeId(null); }, 500);
  };

  const handleIncomeKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") handleIncomeSave(id);
    if (e.key === "Escape") setEditingIncomeId(null);
  };

  const handleBalanceSave = () => {
    onUpdateStartingBalance(balanceValue);
    setEditingBalance(false);
  };

  return (
    <div className="space-y-3 pb-2">

      {/* Solde du compte joint */}
      <div className="card-finance bg-gradient-to-br from-secondary/10 to-primary/5 border-l-4 border-secondary">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Solde du compte joint</p>
            {editingBalance ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  value={balanceValue}
                  onChange={(e) => setBalanceValue(Number(e.target.value))}
                  className="w-32 min-h-[44px] px-3 py-2 rounded bg-muted text-lg font-bold"
                  autoFocus
                  data-testid="input-balance"
                />
                <button onClick={handleBalanceSave} className="text-primary text-sm font-bold min-w-[44px] min-h-[44px] flex items-center justify-center" data-testid="button-save-balance">✓</button>
                <button onClick={() => setEditingBalance(false)} className="text-muted-foreground text-sm min-w-[44px] min-h-[44px] flex items-center justify-center">✗</button>
              </div>
            ) : (
              <p
                onClick={() => { setBalanceValue(startingBalance); setEditingBalance(true); }}
                className={`text-2xl font-bold cursor-pointer mt-1 transition ${dynamicBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
              >
                {fmt(dynamicBalance)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Solde initial : {fmt(startingBalance)} (cliquer pour modifier)</p>
          </div>
          <Wallet className="w-6 h-6 text-secondary opacity-50 flex-shrink-0" />
        </div>
      </div>

      {/* Revenus mensuels */}
      <div className="card-finance space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Revenus mensuels</p>
        <div className="space-y-2">
          {incomes.map((income) => {
            const rd = income.receiptDate;
            const hasDate = rd !== undefined && rd >= 1 && rd <= 31;
            const isReceived = !!income.receivedDate;
            const receivedDay = isReceived ? new Date(income.receivedDate!).getDate() : null;
            const isEditing = editingIncomeId === income.id;
            const isSaving = savingIncomeId === income.id;

            if (isEditing) {
              return (
                <div key={income.id} className={`space-y-2 p-2 rounded-lg bg-muted/50 ${isSaving ? "opacity-60 pointer-events-none" : ""}`} data-testid={`income-row-${income.id}`}>
                  {isSaving && <p className="text-xs text-primary font-medium animate-pulse">Enregistrement...</p>}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">Montant</span>
                    <input type="number" value={incomeAmountValue} onChange={(e) => setIncomeAmountValue(Number(e.target.value))} onKeyDown={(e) => handleIncomeKeyDown(e, income.id)} onFocus={(e) => e.target.select()} autoFocus disabled={isSaving} className="flex-1 min-h-[44px] px-3 py-2 rounded bg-muted text-base font-bold disabled:opacity-50" data-testid={`input-income-amount-${income.id}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">Jour</span>
                    <input type="number" min={1} max={31} value={incomeDateValue} onChange={(e) => setIncomeDateValue(Math.min(31, Math.max(1, Number(e.target.value))))} onKeyDown={(e) => handleIncomeKeyDown(e, income.id)} disabled={isSaving} className="w-20 min-h-[44px] px-3 py-2 rounded bg-muted text-base font-bold disabled:opacity-50" data-testid={`input-income-date-${income.id}`} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleIncomeSave(income.id)} disabled={isSaving} className="flex-1 min-h-[44px] bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50" data-testid={`button-save-income-${income.id}`}>{isSaving ? "Enregistrement..." : "Enregistrer"}</button>
                    <button onClick={() => setEditingIncomeId(null)} disabled={isSaving} className="flex-1 min-h-[44px] bg-muted rounded-lg font-medium text-sm disabled:opacity-50" data-testid={`button-cancel-income-${income.id}`}>Annuler</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={income.id} className="space-y-1" data-testid={`income-row-${income.id}`}>
                <div
                  className={`flex justify-between items-center text-sm min-h-[44px] px-2 rounded-lg cursor-pointer hover:bg-muted/50 transition ${isSaving ? "opacity-50" : ""}`}
                  onClick={() => startEditingIncome(income)}
                >
                  <div className="flex items-center gap-2">
                    {isReceived ? <CalendarCheck className="w-4 h-4 text-green-500" /> : <CalendarClock className="w-4 h-4 text-muted-foreground" />}
                    <span className={isReceived ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}>{income.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isReceived ? "text-green-600 dark:text-green-400" : "text-primary"}`}>{fmt(income.amount)}</span>
                    {isReceived ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">reçu le {receivedDay}</span>
                    ) : hasDate ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">prévu le {rd}</span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">date non définie</span>
                    )}
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!isReceived) handleMarkReceived(income.id); }}
                    disabled={isSaving || isReceived}
                    className={`flex-1 min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                      isReceived
                        ? "bg-green-500/15 text-green-600 dark:text-green-400 cursor-default"
                        : "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                    } disabled:opacity-80`}
                    data-testid={`button-mark-received-${income.id}`}
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    {isReceived ? `Salaire reçu le ${receivedDay}` : "Salaire reçu"}
                  </button>
                  {isReceived && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkPending(income.id); }}
                      disabled={isSaving}
                      className="min-h-[40px] px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition disabled:opacity-50"
                      data-testid={`button-mark-pending-${income.id}`}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div className="border-t pt-1 mt-1 flex justify-between font-bold text-sm">
            <span>Total</span>
            <span className="text-green-600 dark:text-green-400">{fmt(totalIncome)}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
