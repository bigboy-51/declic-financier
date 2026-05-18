import { useState, useEffect } from "react";
import { LogOut, LayoutDashboard, CreditCard, ShoppingCart, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { FirebaseDataProviderV2 } from "@/context/FirebaseDataContextV2";
import DashboardV2 from "@/components/DashboardV2";
import ChargesTabV2 from "@/components/ChargesTabV2";
import CoursesTabV2 from "@/components/CoursesTabV2";
import Login from "@/pages/Login";

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

type Tab = "dashboard" | "charges" | "courses";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Tableau", icon: LayoutDashboard },
  { id: "charges", label: "Charges", icon: CreditCard },
  { id: "courses", label: "Courses", icon: ShoppingCart },
];

function AppMainV2() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-bleu.png"
              alt="Déclic Financier"
              className="hidden dark:block w-auto"
              style={{ height: "60px" }}
            />
            <img
              src="/logo-blanc.png"
              alt="Déclic Financier"
              className="block dark:hidden w-auto"
              style={{ height: "60px" }}
            />
            <span className="text-sm text-muted-foreground">· V2</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Changer le thème"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[36px] px-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main
        className="flex-1 overflow-y-auto pb-20"
        style={{ backgroundColor: "hsl(var(--content-bg, var(--background)))" }}
      >
        {tab === "dashboard" && <DashboardV2 />}
        {tab === "charges" && <ChargesTabV2 />}
        {tab === "courses" && <CoursesTabV2 />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-lg mx-auto flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-colors ${
                tab === id ? "text-sky-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${tab === id ? "stroke-[2.5]" : ""}`} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function IndexV2() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">⚙️</div>
          <p className="text-muted-foreground text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <FirebaseDataProviderV2 userId={user.uid}>
      <AppMainV2 />
    </FirebaseDataProviderV2>
  );
}
