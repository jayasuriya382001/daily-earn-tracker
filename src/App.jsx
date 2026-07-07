import { useState, useEffect } from "react";

/* ── Storage Keys ─────────────────────────────────────────── */
const SK = "det-loans-v2", IK = "det-income-v1", EK = "det-expenses-v1";
const CIK = "det-custom-income-cats", CEK = "det-custom-expense-cats";
const ELK = "det-earn-log-v1", THEME_KEY = "det-theme", PROFILE_KEY = "det-profile";

/* ── Constants ────────────────────────────────────────────── */
const LOAN_CATS = [
    { value: "emi", label: "EMI / Loan", icon: "🏦" },
    { value: "debt", label: "Debt", icon: "💳" },
    { value: "goal", label: "Goal", icon: "🎯" },
];
const BASE_INCOME_TYPES = [
    { value: "salary", label: "Salary", icon: "💼" },
    { value: "interest", label: "Bank Interest", icon: "🏛️" },
    { value: "freelance", label: "Freelance", icon: "💻" },
    { value: "rent", label: "Rent", icon: "🏠" },
    { value: "dividend", label: "Dividend", icon: "📈" },
    { value: "business", label: "Business", icon: "🏪" },
    { value: "cash", label: "Cash", icon: "💵" },
    { value: "other", label: "Other", icon: "💰" },
];
const BASE_EXPENSE_CATS = [
    { value: "food", label: "Food", icon: "🍽️", color: "#f97316" },
    { value: "transport", label: "Transport", icon: "🚗", color: "#3b82f6" },
    { value: "shopping", label: "Shopping", icon: "🛍️", color: "#a855f7" },
    { value: "bills", label: "Bills", icon: "📱", color: "#eab308" },
    { value: "health", label: "Health", icon: "💊", color: "#ef4444" },
    { value: "entertain", label: "Fun", icon: "🎮", color: "#ec4899" },
    { value: "education", label: "Education", icon: "📚", color: "#06b6d4" },
    { value: "groceries", label: "Groceries", icon: "🛒", color: "#84cc16" },
    { value: "other", label: "Other", icon: "💸", color: "#64748b" },
];
const FREQ_OPTIONS = [
    { value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" },
    { value: "variable", label: "Variable" },
];
const CUSTOM_COLORS = ["#6366f1", "#f97316", "#00e676", "#ffca28", "#ef4444", "#ec4899", "#06b6d4", "#a855f7", "#84cc16", "#14b8a6", "#f43f5e", "#8b5cf6"];
const EMOJI_PICKS = ["⭐", "🌟", "🔥", "💡", "🎵", "🏋️", "✈️", "🌿", "🎨", "🍕", "☕", "🐾", "🎯", "🏆", "💎", "🎁", "🔑", "🌙", "🌊", "🌸"];

const ELF = { name: "", category: "emi", emiAmount: "", type: "monthly", dayOfMonth: "5", dueDate: "", principalAmount: "", interestRate: "", tenureMonths: "", duePaid: "0", loanStartDate: "" };
const EIF = { name: "", incomeType: "salary", amount: "", frequency: "monthly", creditDay: "1", notes: "" };
const EEF = { description: "", amount: "", category: "food", note: "" };

/* ── Theme Tokens ─────────────────────────────────────────── */
const DARK = {
    bg: "#080d1a", bg2: "#0f172a", bg3: "#0d1526", bg4: "#1e293b",
    border: "#1e293b", border2: "#334155",
    text: "#e2e8f0", text2: "#94a3b8", text3: "#475569", text4: "#334155",
    header: "linear-gradient(135deg,#0f172a 0%,#1a1545 100%)",
    tabBg: "#0a0f1e", accent: "#6366f1", accentText: "#818cf8",
    ring: "#1e293b",
};
const LIGHT = {
    bg: "#f1f5f9", bg2: "#ffffff", bg3: "#f8fafc", bg4: "#e2e8f0",
    border: "#e2e8f0", border2: "#cbd5e1",
    text: "#0f172a", text2: "#475569", text3: "#64748b", text4: "#94a3b8",
    header: "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)",
    tabBg: "#ffffff", accent: "#6366f1", accentText: "#4f46e5",
    ring: "#e2e8f0",
};

/* ── Helpers ──────────────────────────────────────────────── */
const getDL = d => { const t = new Date(); t.setHours(0, 0, 0, 0); const x = new Date(d); x.setHours(0, 0, 0, 0); return Math.ceil((x - t) / 86400000); };
const getND = day => { const t = new Date(); const m = new Date(t.getFullYear(), t.getMonth(), day); if (m <= t) return new Date(t.getFullYear(), t.getMonth() + 1, day).toISOString().split("T")[0]; return m.toISOString().split("T")[0]; };
const calcEMI = (p, r, n) => { if (!p || !r || !n) return 0; const mr = r / 12 / 100; if (mr === 0) return p / n; return p * mr * Math.pow(1 + mr, n) / (Math.pow(1 + mr, n) - 1); };
const toDaily = (a, f) => { const v = parseFloat(a) || 0; return f === "daily" ? v : f === "weekly" ? v / 7 : f === "monthly" ? v / 30 : f === "yearly" ? v / 365 : 0; };
const tk = () => new Date().toISOString().split("T")[0];
const fmt = n => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtD = n => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 1 });
const slug = s => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
const ls = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const lss = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };

/* ── ProgressRing ─────────────────────────────────────────── */
function ProgressRing({ percent, size = 72, stroke = 6, color, bg = "#1e293b" }) {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (Math.min(percent, 100) / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
    );
}

/* ── StatBox ──────────────────────────────────────────────── */
function StatBox({ label, value, color, sub, T }) {
    return (
        <div style={{ flex: 1, background: T.bg3, borderRadius: 10, padding: "10px 8px", textAlign: "center", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: color || T.text }}>{value}</div>
            {sub && <div style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>{sub}</div>}
            <div style={{ fontSize: 9, color: T.text3, marginTop: 2, lineHeight: 1.3 }}>{label}</div>
        </div>
    );
}

/* ── Section ──────────────────────────────────────────────── */
function Sec({ title, subtitle, children, T }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{title}</div>
                {subtitle && <div style={{ fontSize: 10, color: T.text4, marginTop: 1 }}>{subtitle}</div>}
            </div>
            {children}
        </div>
    );
}

/* ── CustomCatModal ───────────────────────────────────────── */
function CustomCatModal({ mode, existing, onSave, onDelete, onClose, T }) {
    const [f, sf] = useState(existing || { label: "", icon: "⭐", color: "#6366f1" });
    const isE = mode === "expense", ac = isE ? "#f97316" : "#059669";
    const lbl = { display: "block", fontSize: 10, color: ac, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 };
    const inp = { width: "100%", background: T.bg4, border: `1px solid ${T.border2}`, borderRadius: 10, padding: "10px 13px", color: T.text, fontSize: 14, outline: "none", marginBottom: 13, boxSizing: "border-box" };
    return (
        <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 18, padding: "22px 18px 24px", width: "100%", maxWidth: 360 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 16 }}>{existing ? "Edit" : "Add"} Custom {isE ? "Expense" : "Income"} Category</div>
                <label style={lbl}>Category Name</label>
                <input placeholder="e.g. Pet Care, Crypto..." value={f.label} onChange={e => sf(p => ({ ...p, label: e.target.value }))} style={inp} />
                <label style={lbl}>Pick an Emoji</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {EMOJI_PICKS.map(em => (<button key={em} onClick={() => sf(p => ({ ...p, icon: em }))} style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${f.icon === em ? ac : T.border}`, background: f.icon === em ? ac + "22" : T.bg4, fontSize: 16, cursor: "pointer" }}>{em}</button>))}
                </div>
                {isE && (<><label style={lbl}>Pick a Colour</label><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>{CUSTOM_COLORS.map(c => (<button key={c} onClick={() => sf(p => ({ ...p, color: c }))} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `3px solid ${f.color === c ? "#fff" : "transparent"}`, cursor: "pointer" }} />))}</div></>)}
                <div style={{ background: T.bg4, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: (isE ? f.color : "#059669") + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{f.icon || "⭐"}</div>
                    <span style={{ fontWeight: 700, color: isE ? f.color : "#34d399", fontSize: 13 }}>{f.label || "Preview"}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {existing && <button onClick={() => { onDelete(existing.value); onClose(); }} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ff3b5c22", background: "#ff3b5c11", color: "#ff3b5c", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Delete</button>}
                    <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg4, color: T.text3, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => { if (!f.label) return; onSave({ ...f, value: existing?.value || slug(f.label) }); onClose(); }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: `linear-gradient(135deg,${ac},${ac}bb)`, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{existing ? "Save Changes" : "Add Category"}</button>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════════ */
export default function App() {
    const [isDark, setIsDark] = useState(() => ls(THEME_KEY, true));
    const T = isDark ? DARK : LIGHT;
    const toggleTheme = () => { setIsDark(p => { lss(THEME_KEY, !p); return !p; }); };

    const [tab, setTab] = useState("overview");
    const [loans, setLoans] = useState(() => ls(SK, []));
    const [incomes, setIncomes] = useState(() => ls(IK, []));
    const [expenses, setExpenses] = useState(() => ls(EK, []));
    const [cic, setCic] = useState(() => ls(CIK, []));
    const [cec, setCec] = useState(() => ls(CEK, []));
    const [earnLog, setEarnLog] = useState(() => ls(ELK, []));

    const INCOME_TYPES = [...BASE_INCOME_TYPES, ...cic];
    const EXPENSE_CATS = [...BASE_EXPENSE_CATS, ...cec];

    // forms
    const [showLoanForm, setShowLoanForm] = useState(false);
    const [showIncomeForm, setShowIncomeForm] = useState(false);
    const [showExpForm, setShowExpForm] = useState(false);
    const [loanForm, setLoanForm] = useState({ ...ELF });
    const [incomeForm, setIncomeForm] = useState({ ...EIF });
    const [expForm, setExpForm] = useState({ ...EEF });
    const [editLoanId, setEditLoanId] = useState(null);
    const [editIncomeId, setEditIncomeId] = useState(null);
    const [editExpId, setEditExpId] = useState(null);
    const [expandLoanId, setExpandLoanId] = useState(null);
    const [expandIncomeId, setExpandIncomeId] = useState(null);
    const [expView, setExpView] = useState("today");
    const [expFilter, setExpFilter] = useState("all");
    const [showCustomCat, setShowCustomCat] = useState(null);
    const [editingCustomCat, setEditingCustomCat] = useState(null);

    // earn log
    const [earnAmt, setEarnAmt] = useState("");
    const [earnCat, setEarnCat] = useState("salary");
    const [earnNote, setEarnNote] = useState("");
    const [showEarnEntries, setShowEarnEntries] = useState(false);

    // quick expense
    const [qExpDesc, setQExpDesc] = useState("");
    const [qExpAmt, setQExpAmt] = useState("");
    const [qExpCat, setQExpCat] = useState("food");

    useEffect(() => { lss(SK, loans); }, [loans]);
    useEffect(() => { lss(IK, incomes); }, [incomes]);
    useEffect(() => { lss(EK, expenses); }, [expenses]);
    useEffect(() => { lss(CIK, cic); }, [cic]);
    useEffect(() => { lss(CEK, cec); }, [cec]);
    useEffect(() => { lss(ELK, earnLog); }, [earnLog]);

    // custom cat helpers
    const saveCI = cat => setCic(p => { const i = p.findIndex(c => c.value === cat.value); return i >= 0 ? p.map((c, j) => j === i ? cat : c) : [...p, cat]; });
    const delCI = val => { setCic(p => p.filter(c => c.value !== val)); setIncomes(p => p.map(i => i.incomeType === val ? { ...i, incomeType: "other" } : i)); };
    const saveCE = cat => setCec(p => { const i = p.findIndex(c => c.value === cat.value); return i >= 0 ? p.map((c, j) => j === i ? cat : c) : [...p, cat]; });
    const delCE = val => { setCec(p => p.filter(c => c.value !== val)); setExpenses(p => p.map(e => e.category === val ? { ...e, category: "other" } : e)); };

    /* ── computed ───────────────────────────────────────────── */
    const cLoans = loans.map(item => {
        let due = item.dueDate;
        if (item.type === "monthly") due = getND(parseInt(item.dayOfMonth));
        const dl = getDL(due), safe = Math.max(dl, 1);
        let e = parseFloat(item.emiAmount) || 0;
        if (!e && item.principalAmount && item.interestRate && item.tenureMonths) e = calcEMI(parseFloat(item.principalAmount), parseFloat(item.interestRate), parseInt(item.tenureMonths));
        const daily = e / safe, p = parseFloat(item.principalAmount) || 0, r = parseFloat(item.interestRate) || 0;
        const n = parseInt(item.tenureMonths) || 0, paid = parseInt(item.duePaid) || 0;
        const tP = n > 0 ? e * n : null, tI = tP ? tP - p : null, aP = e * paid, out = tP ? Math.max(tP - aP, 0) : null;
        const prog = tP > 0 ? Math.min((aP / tP) * 100, 100) : null;
        return { ...item, dueDate: due, daysLeft: dl, dailyNeeded: daily, emiAmount: e, principal: p, rate: r, tenure: n, duePaid: paid, dueRemaining: n > 0 ? n - paid : null, totalInterest: tI, totalPayable: tP, amountPaid: aP, outstanding: out, repayProgress: prog };
    });

    const cIncs = incomes.map(inc => {
        const d = toDaily(inc.amount, inc.frequency);
        const next = inc.frequency === "monthly" && inc.creditDay ? getND(parseInt(inc.creditDay)) : null;
        return { ...inc, dailyEquiv: d, nextCredit: next, daysToCredit: next ? getDL(next) : null };
    });

    const today = tk();
    const todayExps = expenses.filter(e => e.date === today);
    const todaySpent = todayExps.reduce((s, e) => s + parseFloat(e.amount), 0);
    const todayEarns = earnLog.filter(e => e.date === today);
    const todayEarned = todayEarns.reduce((s, e) => s + parseFloat(e.amount), 0);

    const grouped = {};
    [...expenses].sort((a, b) => b.date.localeCompare(a.date)).forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });
    const catTotals = {};
    todayExps.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount); });

    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        return { key, label: i === 0 ? "Today" : i === 1 ? "Yest" : d.toLocaleDateString("en-IN", { weekday: "short" }), total: expenses.filter(e => e.date === key).reduce((s, e) => s + parseFloat(e.amount), 0) };
    }).reverse();
    const maxDay = Math.max(...last7.map(d => d.total), 1);

    const totalDailyNeeded = cLoans.reduce((s, i) => s + i.dailyNeeded, 0);
    const totalDailyGuaranteed = cIncs.filter(i => i.frequency !== "variable").reduce((s, i) => s + i.dailyEquiv, 0);
    const totalMonthlyIncome = cIncs.reduce((s, i) => { const a = parseFloat(i.amount) || 0; return s + (i.frequency === "monthly" ? a : i.frequency === "yearly" ? a / 12 : i.frequency === "weekly" ? a * 4.33 : i.frequency === "daily" ? a * 30 : 0); }, 0);
    const totalOwed = loans.reduce((s, l) => s + parseFloat(l.principalAmount || 0), 0);
    const netGap = Math.max(totalDailyNeeded - totalDailyGuaranteed, 0);
    const monthlyOut = totalDailyNeeded * 30;
    const netMonthly = totalMonthlyIncome - monthlyOut;
    const shortfall = Math.max(totalDailyNeeded - todayEarned - totalDailyGuaranteed, 0);
    const earnPct = totalDailyNeeded > 0 ? Math.min(((todayEarned + totalDailyGuaranteed) / totalDailyNeeded) * 100, 100) : 100;

    /* ── save ────────────────────────────────────────────────── */
    function saveLoan() {
        if (!loanForm.name) return;
        const n = { id: editLoanId || Date.now() + "", name: loanForm.name, category: loanForm.category, emiAmount: loanForm.emiAmount, type: loanForm.type, dayOfMonth: loanForm.dayOfMonth, dueDate: loanForm.dueDate, principalAmount: loanForm.principalAmount, interestRate: loanForm.interestRate, tenureMonths: loanForm.tenureMonths, duePaid: loanForm.duePaid, loanStartDate: loanForm.loanStartDate };
        setLoans(p => editLoanId ? p.map(i => i.id === editLoanId ? n : i) : [...p, n]);
        setLoanForm({ ...ELF }); setShowLoanForm(false); setEditLoanId(null);
    }
    function saveIncome() {
        if (!incomeForm.name || !incomeForm.amount) return;
        const n = { id: editIncomeId || Date.now() + "", name: incomeForm.name, incomeType: incomeForm.incomeType, amount: incomeForm.amount, frequency: incomeForm.frequency, creditDay: incomeForm.creditDay, notes: incomeForm.notes };
        setIncomes(p => editIncomeId ? p.map(i => i.id === editIncomeId ? n : i) : [...p, n]);
        setIncomeForm({ ...EIF }); setShowIncomeForm(false); setEditIncomeId(null);
    }
    function saveExp() {
        if (!expForm.description || !expForm.amount) return;
        const n = { id: editExpId || Date.now() + "", description: expForm.description, amount: expForm.amount, category: expForm.category, note: expForm.note, date: today, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) };
        setExpenses(p => editExpId ? p.map(e => e.id === editExpId ? n : e) : [...p, n]);
        setExpForm({ ...EEF }); setShowExpForm(false); setEditExpId(null);
    }
    function logEarning() {
        const v = parseFloat(earnAmt); if (isNaN(v) || v <= 0) return;
        setEarnLog(p => [...p, { id: Date.now() + "", amount: v, category: earnCat, note: earnNote, date: today, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
        setEarnAmt(""); setEarnNote("");
    }
    function logQuickExp() {
        if (!qExpDesc || !qExpAmt) return;
        setExpenses(p => [...p, { id: Date.now() + "", description: qExpDesc, amount: qExpAmt, category: qExpCat, note: "", date: today, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
        setQExpDesc(""); setQExpAmt("");
    }
    const delExp = id => setExpenses(p => p.filter(e => e.id !== id));
    const delEarn = id => setEarnLog(p => p.filter(e => e.id !== id));
    const getEC = val => EXPENSE_CATS.find(x => x.value === val) || { value: "other", label: "Other", icon: "💸", color: "#64748b" };
    const getIT = val => INCOME_TYPES.find(x => x.value === val) || { value: "other", label: "Other", icon: "💰" };
    const autoEMI = loanForm.principalAmount && loanForm.interestRate && loanForm.tenureMonths ? calcEMI(parseFloat(loanForm.principalAmount), parseFloat(loanForm.interestRate), parseInt(loanForm.tenureMonths)) : null;

    /* ── theme-aware style helpers ─────────────────────────── */
    const lbl = { display: "block", fontSize: 10, color: T.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 };
    const inp = { width: "100%", background: T.bg4, border: `1px solid ${T.border2}`, borderRadius: 10, padding: "10px 13px", color: T.text, fontSize: 14, outline: "none", marginBottom: 13, boxSizing: "border-box" };
    const card = { background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, marginTop: 12 };
    const earnColor = earnPct >= 100 ? "#00e676" : earnPct >= 60 ? "#ffca28" : "#ff3b5c";

    /* ── date display ───────────────────────────────────────── */
    const todayDisplay = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Inter',system-ui,sans-serif", paddingBottom: 80, transition: "background 0.3s,color 0.3s" }}>

            {/* ── Header ── */}
            <div style={{ background: T.header, padding: "36px 20px 16px", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ maxWidth: 480, margin: "0 auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <div style={{ fontSize: 10, letterSpacing: 2, color: isDark ? "#818cf8" : "#e0e7ff", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>💰 Daily Earn Tracker</div>
                            <div style={{ fontSize: 11, color: isDark ? "#475569" : "#c7d2fe", marginBottom: 6 }}>{todayDisplay}</div>
                            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                                ₹{fmt(netGap)}<span style={{ fontSize: 13, color: isDark ? "#64748b" : "#c7d2fe", fontWeight: 400 }}>/day to earn</span>
                            </div>
                            <div style={{ fontSize: 11, color: isDark ? "#475569" : "#c7d2fe", marginTop: 4 }}>
                                Target ₹{fmt(totalDailyNeeded)}/day · ₹{fmtD(totalDailyGuaranteed)} guaranteed
                            </div>
                        </div>
                        {/* Theme toggle */}
                        <button onClick={toggleTheme}
                            style={{ background: isDark ? "#1e293b" : "#ffffff33", border: `1px solid ${isDark ? "#334155" : "#ffffff44"}`, borderRadius: 12, padding: "8px 12px", cursor: "pointer", fontSize: 18, lineHeight: 1, marginTop: 4 }}>
                            {isDark ? "☀️" : "🌙"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ background: T.tabBg, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 10, boxShadow: isDark ? "none" : "0 1px 8px #0001" }}>
                <div style={{ maxWidth: 480, margin: "0 auto", display: "flex" }}>
                    {[["overview", "📊", "Overview"], ["loans", "🏦", "Loans"], ["income", "💰", "Income"], ["expenses", "🧾", "Expenses"]].map(([v, ic, lb]) => (
                        <button key={v} onClick={() => setTab(v)}
                            style={{ flex: 1, padding: "11px 2px", background: "none", border: "none", borderBottom: `2px solid ${tab === v ? T.accent : "transparent"}`, color: tab === v ? T.accentText : T.text3, fontWeight: tab === v ? 700 : 500, fontSize: 10, cursor: "pointer", transition: "all 0.2s" }}>
                            {ic}<br /><span style={{ fontSize: 9 }}>{lb}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

                {/* ══════════════════════════════════════════════════
            OVERVIEW TAB — fully revamped
        ══════════════════════════════════════════════════ */}
                {tab === "overview" && (<>

                    {/* ── Big progress ring + key stats ── */}
                    <div style={{ ...card, padding: "20px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            {/* main ring */}
                            <div style={{ position: "relative", flexShrink: 0 }}>
                                <ProgressRing percent={earnPct} size={90} stroke={8} color={earnColor} bg={T.ring} />
                                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: earnColor, lineHeight: 1 }}>{Math.round(earnPct)}%</div>
                                    <div style={{ fontSize: 8, color: T.text3, marginTop: 1 }}>of target</div>
                                </div>
                            </div>
                            {/* stats beside ring */}
                            <div style={{ flex: 1 }}>
                                <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontSize: 11, color: T.text3 }}>Earned today</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: T.text, lineHeight: 1.1 }}>₹{fmt(todayEarned)}</div>
                                    <div style={{ fontSize: 11, color: T.text3 }}>+ ₹{fmtD(totalDailyGuaranteed)} guaranteed</div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <div style={{ flex: 1, background: isDark ? "#0a1a0f" : "#f0fdf4", border: "1px solid #00e67622", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: "#00e676" }}>₹{fmt(todayEarned + totalDailyGuaranteed)}</div>
                                        <div style={{ fontSize: 9, color: T.text3 }}>Total in</div>
                                    </div>
                                    <div style={{ flex: 1, background: isDark ? "#1a0a0f" : "#fff7f0", border: "1px solid #f9731622", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: "#f97316" }}>₹{fmt(todaySpent)}</div>
                                        <div style={{ fontSize: 9, color: T.text3 }}>Spent</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* status bar */}
                        <div style={{ marginTop: 14, background: shortfall > 0 ? "#ff3b5c11" : "#00e67611", border: `1px solid ${shortfall > 0 ? "#ff3b5c22" : "#00e67622"}`, borderRadius: 10, padding: "10px 14px", textAlign: "center", fontSize: 13, fontWeight: 700, color: shortfall > 0 ? "#ff3b5c" : "#00e676" }}>
                            {shortfall > 0 ? `⚡ Earn ₹${fmt(shortfall)} more today to stay on track` : "🎉 You've hit today's target! Great job!"}
                        </div>
                    </div>

                    {/* ── Log Earnings ── */}
                    <div style={card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>💪 Log Earning</div>
                            {todayEarns.length > 0 && (
                                <button onClick={() => setShowEarnEntries(p => !p)} style={{ fontSize: 11, color: T.text3, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>
                                    {showEarnEntries ? "▲ Hide" : "▼ Show"} {todayEarns.length} · ₹{fmt(todayEarned)}
                                </button>
                            )}
                        </div>
                        {/* quick amount chips */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                            {[100, 200, 500, 1000, 2000, 5000].map(v => (
                                <button key={v} onClick={() => setEarnAmt(p => String((parseFloat(p) || 0) + v))}
                                    style={{ flex: 1, padding: "7px 2px", borderRadius: 9, border: `1px solid ${T.border2}`, background: T.bg4, color: T.accentText, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                                    +{v >= 1000 ? v / 1000 + "k" : v}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <input type="number" placeholder="₹ Amount earned" value={earnAmt}
                                onChange={e => setEarnAmt(e.target.value)} onKeyDown={e => e.key === "Enter" && logEarning()}
                                style={{ flex: 1, background: T.bg4, border: `1px solid ${T.border2}`, borderRadius: 10, padding: "11px 13px", color: T.text, fontSize: 15, fontWeight: 700, outline: "none" }} />
                            <button onClick={logEarning} style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 10, padding: "0 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Log</button>
                        </div>
                        {/* category chips */}
                        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2, marginBottom: 8 }}>
                            {INCOME_TYPES.map(it => (
                                <button key={it.value} onClick={() => setEarnCat(it.value)}
                                    style={{ flexShrink: 0, padding: "5px 10px", borderRadius: 20, border: `1px solid ${earnCat === it.value ? T.accent : T.border}`, background: earnCat === it.value ? T.accent + "22" : T.bg4, color: earnCat === it.value ? T.accentText : T.text3, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                                    {it.icon} {it.label}
                                </button>
                            ))}
                        </div>
                        <input placeholder="Note (optional)" value={earnNote} onChange={e => setEarnNote(e.target.value)}
                            style={{ width: "100%", background: T.bg4, border: `1px solid ${T.border2}`, borderRadius: 10, padding: "9px 13px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                        {/* today's earn entries */}
                        {showEarnEntries && todayEarns.length > 0 && (
                            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                                {[...todayEarns].reverse().map(e => {
                                    const it = getIT(e.category);
                                    return (
                                        <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg3, borderRadius: 9, padding: "9px 12px" }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <span style={{ fontSize: 16 }}>{it.icon}</span>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>₹{fmt(e.amount)} <span style={{ color: T.text3, fontWeight: 400, fontSize: 11 }}>· {it.label}</span></div>
                                                    {e.note && <div style={{ fontSize: 10, color: T.text4 }}>{e.note}</div>}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ fontSize: 10, color: T.text4 }}>{e.time}</span>
                                                <button onClick={() => delEarn(e.id)} style={{ background: "none", border: "none", color: T.text4, cursor: "pointer", fontSize: 14 }}>✕</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Quick Expense Entry ── */}
                    <div style={card}>
                        <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>⚡ Quick Expense</div>
                        {/* category chips */}
                        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
                            {EXPENSE_CATS.map(c => (
                                <button key={c.value} onClick={() => setQExpCat(c.value)}
                                    style={{ flexShrink: 0, padding: "5px 10px", borderRadius: 20, border: `1px solid ${qExpCat === c.value ? c.color + "88" : T.border}`, background: qExpCat === c.value ? c.color + "22" : T.bg4, color: qExpCat === c.value ? c.color : T.text3, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                                    {c.icon} {c.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input placeholder="What did you spend on?" value={qExpDesc} onChange={e => setQExpDesc(e.target.value)}
                                style={{ flex: 2, background: T.bg4, border: `1px solid ${T.border2}`, borderRadius: 10, padding: "10px 13px", color: T.text, fontSize: 13, outline: "none" }} />
                            <input type="number" placeholder="₹" value={qExpAmt} onChange={e => setQExpAmt(e.target.value)} onKeyDown={e => e.key === "Enter" && logQuickExp()}
                                style={{ flex: 1, background: T.bg4, border: `1px solid ${T.border2}`, borderRadius: 10, padding: "10px 10px", color: T.text, fontSize: 14, fontWeight: 700, outline: "none" }} />
                            <button onClick={logQuickExp} style={{ background: "linear-gradient(135deg,#ea580c,#c2410c)", color: "#fff", border: "none", borderRadius: 10, padding: "0 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+</button>
                        </div>
                        {/* today's last 3 expenses */}
                        {todayExps.length > 0 && (
                            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                                {[...todayExps].reverse().slice(0, 3).map(e => {
                                    const c = getEC(e.category);
                                    return (
                                        <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg3, borderRadius: 9, padding: "9px 12px" }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <div style={{ width: 30, height: 30, borderRadius: 8, background: c.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{c.icon}</div>
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{e.description}</div>
                                                    <div style={{ fontSize: 10, color: T.text3 }}>{c.label}{e.time ? ` · ${e.time}` : ""}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: c.color }}>₹{fmt(e.amount)}</div>
                                                <button onClick={() => delExp(e.id)} style={{ background: "none", border: "none", color: T.text4, cursor: "pointer", fontSize: 13 }}>✕</button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {todayExps.length > 3 && (
                                    <div onClick={() => setTab("expenses")} style={{ textAlign: "center", fontSize: 11, color: T.accent, cursor: "pointer", padding: "4px 0", fontWeight: 600 }}>
                                        +{todayExps.length - 3} more expenses → view all
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Summary strip ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                        <div style={{ background: isDark ? "#0a1a0f" : "#f0fdf4", border: "1px solid #00e67622", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: "#00e676", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Income</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#00e676", marginTop: 4 }}>₹{fmt(totalMonthlyIncome)}</div>
                            <div style={{ fontSize: 9, color: T.text4 }}>/month</div>
                        </div>
                        <div style={{ background: isDark ? "#1a0a0f" : "#fff7f0", border: "1px solid #f9731622", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: "#f97316", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Spent</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#f97316", marginTop: 4 }}>₹{fmt(todaySpent)}</div>
                            <div style={{ fontSize: 9, color: T.text4 }}>today</div>
                        </div>
                        <div style={{ background: isDark ? "#1a0a0f" : "#fff5f5", border: "1px solid #ff3b5c22", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: "#ff3b5c", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>EMIs</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#ff3b5c", marginTop: 4 }}>₹{fmt(monthlyOut)}</div>
                            <div style={{ fontSize: 9, color: T.text4 }}>/month</div>
                        </div>
                    </div>

                    {/* ── Monthly net ── */}
                    {(incomes.length > 0 || loans.length > 0) && (
                        <div style={{ background: netMonthly >= 0 ? (isDark ? "#0a1a0f" : "#f0fdf4") : (isDark ? "#1a0a0f" : "#fff5f5"), border: `1px solid ${netMonthly >= 0 ? "#00e67622" : "#ff3b5c22"}`, borderRadius: 12, padding: "12px 16px", marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontSize: 10, color: T.text3, fontWeight: 700, textTransform: "uppercase" }}>Monthly Net Balance</div>
                                <div style={{ fontSize: 10, color: T.text4, marginTop: 1 }}>{netMonthly >= 0 ? "Surplus after all EMIs" : "Shortfall — income lower than EMIs"}</div>
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: netMonthly >= 0 ? "#00e676" : "#ff3b5c" }}>{netMonthly >= 0 ? "+" : ""}₹{fmt(Math.abs(netMonthly))}</div>
                        </div>
                    )}

                    {/* ── Today's spend breakdown ── */}
                    {todayExps.length > 0 && (
                        <div style={card}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Today's Spending</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: "#f97316" }}>₹{fmt(todaySpent)}</div>
                            </div>
                            {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                                const c = getEC(cat); const pct = (amt / todaySpent) * 100;
                                return (
                                    <div key={cat} style={{ marginBottom: 10 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                            <span style={{ fontSize: 12, color: T.text }}>{c.icon} {c.label}</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>₹{fmt(amt)}</span>
                                        </div>
                                        <div style={{ background: T.bg4, borderRadius: 4, height: 5 }}>
                                            <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 4, transition: "width 0.4s" }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── 7-day bar chart ── */}
                    {expenses.length > 0 && (
                        <div style={card}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ fontSize: 12, color: T.text2, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>7-Day Spending</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316" }}>₹{fmt(last7.reduce((s, d) => s + d.total, 0))}</div>
                            </div>
                            <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 60 }}>
                                {last7.map(d => (
                                    <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                        <div style={{ fontSize: 7, color: "#f97316", fontWeight: 600, textAlign: "center" }}>{d.total > 0 ? `₹${fmt(d.total)}` : ""}</div>
                                        <div style={{ width: "100%", background: d.key === today ? "#f97316" : "#f9731644", borderRadius: "3px 3px 0 0", height: `${Math.max((d.total / maxDay) * 44, d.total > 0 ? 4 : 0)}px`, transition: "height 0.4s" }} />
                                        <div style={{ fontSize: 9, color: d.key === today ? "#f97316" : T.text4, fontWeight: d.key === today ? 700 : 400 }}>{d.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Upcoming income ── */}
                    {cIncs.filter(i => i.daysToCredit !== null && i.daysToCredit <= 10).length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 11, color: T.text3, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Incoming Soon</div>
                            {cIncs.filter(i => i.daysToCredit !== null && i.daysToCredit <= 10).map(inc => {
                                const it = getIT(inc.incomeType);
                                return (
                                    <div key={inc.id} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                            <span style={{ fontSize: 18 }}>{it.icon}</span>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{inc.name}</div>
                                                <div style={{ fontSize: 10, color: T.text3 }}>in {inc.daysToCredit}d · {inc.nextCredit}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: "#00e676" }}>₹{fmt(inc.amount)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Urgent loans ── */}
                    {cLoans.filter(l => l.daysLeft <= 7).length > 0 && (
                        <div style={{ marginTop: 4, marginBottom: 8 }}>
                            <div style={{ fontSize: 11, color: T.text3, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Upcoming Dues</div>
                            {cLoans.filter(l => l.daysLeft <= 7).map(l => (
                                <div key={l.id} style={{ background: T.bg2, border: `1px solid ${l.daysLeft <= 3 ? "#ff3b5c44" : "#ff8c0044"}`, borderRadius: 12, padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <span style={{ fontSize: 16 }}>{LOAN_CATS.find(c => c.value === l.category)?.icon || "🏦"}</span>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{l.name}</div>
                                            <div style={{ fontSize: 10, color: T.text3 }}>{l.daysLeft <= 3 ? "🔥 Due in " : "⚡ Due in "}{l.daysLeft}d · {l.dueDate}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: l.daysLeft <= 3 ? "#ff3b5c" : "#ff8c00" }}>₹{fmt(l.emiAmount)}</div>
                                </div>
                            ))}
                        </div>
                    )}

                </>)}

                {/* ══ LOANS TAB ══ */}
                {tab === "loans" && (<>
                    <div style={{ marginTop: 14 }}>
                        {cLoans.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: T.text3, fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>No loans or goals yet.</div>}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {cLoans.map(item => {
                                const exp = expandLoanId === item.id, cat = LOAN_CATS.find(c => c.value === item.category) || LOAN_CATS[0];
                                const urg = item.daysLeft <= 3 ? "#ff3b5c" : item.daysLeft <= 7 ? "#ff8c00" : T.accent;
                                const has = item.principal > 0 && item.tenure > 0;
                                return (
                                    <div key={item.id} style={{ background: T.bg2, border: `1px solid ${exp ? T.accent + "44" : T.border}`, borderRadius: 14, overflow: "hidden" }}>
                                        <div style={{ height: 3, background: urg, opacity: 0.8 }} />
                                        <div style={{ padding: "14px 16px 10px", cursor: "pointer" }} onClick={() => setExpandLoanId(exp ? null : item.id)}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                                                            {item.name}
                                                            {item.daysLeft <= 3 && <span style={{ background: "#ff3b5c22", color: "#ff3b5c", padding: "1px 6px", borderRadius: 20, fontSize: 9, fontWeight: 700 }}>🔥 URGENT</span>}
                                                            {item.daysLeft > 3 && item.daysLeft <= 7 && <span style={{ background: "#ff8c0022", color: "#ff8c00", padding: "1px 6px", borderRadius: 20, fontSize: 9, fontWeight: 700 }}>⚡ SOON</span>}
                                                        </div>
                                                        <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>Due {item.dueDate} · {item.daysLeft > 0 ? `${item.daysLeft}d left` : "Due today!"}</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>₹{fmt(item.dailyNeeded)}<span style={{ fontSize: 9, color: T.text3, fontWeight: 400 }}>/day</span></div>
                                                    <div style={{ fontSize: 10, color: T.text3 }}>EMI ₹{fmt(item.emiAmount)}</div>
                                                </div>
                                            </div>
                                            {item.repayProgress !== null && (
                                                <div style={{ marginTop: 10 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                                        <span style={{ fontSize: 9, color: T.text3 }}>Repayment</span>
                                                        <span style={{ fontSize: 9, color: T.accent, fontWeight: 700 }}>{item.repayProgress.toFixed(0)}%</span>
                                                    </div>
                                                    <div style={{ background: T.bg4, borderRadius: 3, height: 4 }}>
                                                        <div style={{ width: `${item.repayProgress}%`, height: "100%", background: "linear-gradient(90deg,#6366f1,#00e676)", borderRadius: 3 }} />
                                                    </div>
                                                </div>
                                            )}
                                            <div style={{ fontSize: 9, color: T.text4, marginTop: 5, textAlign: "right" }}>{exp ? "▲ collapse" : "▼ details"}</div>
                                        </div>
                                        {exp && (
                                            <div style={{ padding: "12px 16px 14px", borderTop: `1px solid ${T.border}` }}>
                                                {has ? (
                                                    <>
                                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                                                            <StatBox T={T} label="Principal" value={`₹${fmt(item.principal)}`} color={T.text} />
                                                            <StatBox T={T} label="Rate" value={`${item.rate}%`} color="#ffca28" sub="p.a." />
                                                            <StatBox T={T} label="Tenure" value={`${item.tenure}mo`} color="#818cf8" />
                                                        </div>
                                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                                                            <StatBox T={T} label="Monthly EMI" value={`₹${fmt(item.emiAmount)}`} color="#00e676" />
                                                            <StatBox T={T} label="Total Interest" value={item.totalInterest ? `₹${fmt(item.totalInterest)}` : "—"} color="#ff3b5c" />
                                                            <StatBox T={T} label="Total Payable" value={item.totalPayable ? `₹${fmt(item.totalPayable)}` : "—"} color={T.text} />
                                                        </div>
                                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                                                            <StatBox T={T} label="EMIs Paid" value={item.duePaid} color="#00e676" sub={`of ${item.tenure}`} />
                                                            <StatBox T={T} label="EMIs Left" value={item.dueRemaining ?? "-"} color="#ffca28" />
                                                            <StatBox T={T} label="Outstanding" value={item.outstanding ? `₹${fmt(item.outstanding)}` : "—"} color="#ff3b5c" />
                                                        </div>
                                                        {item.loanStartDate && <div style={{ marginTop: 8, fontSize: 10, color: T.text3, textAlign: "center" }}>Started: {item.loanStartDate}</div>}
                                                    </>
                                                ) : (
                                                    <div style={{ color: T.text4, fontSize: 11, textAlign: "center", padding: "8px 0" }}>Edit to add full loan details for breakdown.</div>
                                                )}
                                                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                                    <button onClick={() => { setLoanForm({ name: item.name, category: item.category, emiAmount: item.emiAmount || "", type: item.type, dayOfMonth: item.dayOfMonth || "5", dueDate: item.dueDate || "", principalAmount: item.principalAmount || "", interestRate: item.interestRate || "", tenureMonths: item.tenureMonths || "", duePaid: item.duePaid || "0", loanStartDate: item.loanStartDate || "" }); setEditLoanId(item.id); setShowLoanForm(true); }}
                                                        style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1px solid ${T.border2}`, background: T.bg4, color: T.text2, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ Edit</button>
                                                    <button onClick={() => { setLoans(p => p.filter(i => i.id !== item.id)); setExpandLoanId(null); }}
                                                        style={{ flex: 1, padding: "9px", borderRadius: 9, border: "1px solid #ff3b5c22", background: "#ff3b5c11", color: "#ff3b5c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑 Delete</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <button onClick={() => { setLoanForm({ ...ELF }); setEditLoanId(null); setShowLoanForm(true); }}
                        style={{ width: "100%", marginTop: 12, padding: 13, background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                        + Add Loan / Goal
                    </button>
                </>)}

                {/* ══ INCOME TAB ══ */}
                {tab === "income" && (<>
                    {incomes.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14, marginBottom: 12 }}>
                            <StatBox T={T} label="Monthly Total" value={`₹${fmt(totalMonthlyIncome)}`} color="#00e676" />
                            <StatBox T={T} label="Daily Guaranteed" value={`₹${fmtD(totalDailyGuaranteed)}`} color="#ffca28" />
                            <StatBox T={T} label="Sources" value={incomes.length} color="#818cf8" />
                        </div>
                    )}
                    {cIncs.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: T.text3, fontSize: 13, marginTop: 14 }}><div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>No income sources yet.</div>}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {cIncs.map(inc => {
                            const exp = expandIncomeId === inc.id, it = getIT(inc.incomeType);
                            const fl = FREQ_OPTIONS.find(f => f.value === inc.frequency)?.label || inc.frequency;
                            const isC = cic.some(c => c.value === inc.incomeType);
                            return (
                                <div key={inc.id} style={{ background: T.bg2, border: `1px solid ${exp ? "#00e67633" : T.border}`, borderRadius: 14, overflow: "hidden" }}>
                                    <div style={{ height: 3, background: "#00e676", opacity: 0.7 }} />
                                    <div style={{ padding: "13px 16px 10px", cursor: "pointer" }} onClick={() => setExpandIncomeId(exp ? null : inc.id)}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                <span style={{ fontSize: 20 }}>{it.icon}</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 14, color: T.text, display: "flex", alignItems: "center", gap: 6 }}>
                                                        {inc.name}
                                                        {isC && <span style={{ background: T.accent + "22", color: T.accentText, padding: "1px 6px", borderRadius: 20, fontSize: 9, fontWeight: 700 }}>Custom</span>}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{fl}{inc.nextCredit && ` · next ${inc.nextCredit}`}{inc.daysToCredit !== null && inc.daysToCredit <= 7 && <span style={{ color: "#00e676", marginLeft: 5, fontWeight: 700 }}>in {inc.daysToCredit}d</span>}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: "#00e676" }}>₹{fmt(inc.amount)}</div>
                                                <div style={{ fontSize: 10, color: T.text3 }}>/{inc.frequency === "monthly" ? "mo" : inc.frequency === "yearly" ? "yr" : inc.frequency === "weekly" ? "wk" : inc.frequency === "daily" ? "day" : "once"}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 9, color: T.text4, marginTop: 5, textAlign: "right" }}>{exp ? "▲ collapse" : "▼ details"}</div>
                                    </div>
                                    {exp && (
                                        <div style={{ padding: "12px 16px 14px", borderTop: `1px solid ${T.border}` }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                                                <StatBox T={T} label="Per Month" value={inc.frequency !== "variable" ? `₹${fmt(inc.frequency === "monthly" ? inc.amount : inc.frequency === "yearly" ? inc.amount / 12 : inc.frequency === "weekly" ? inc.amount * 4.33 : inc.amount * 30)}` : "Variable"} color="#00e676" />
                                                <StatBox T={T} label="Per Day" value={inc.dailyEquiv > 0 ? `₹${fmtD(inc.dailyEquiv)}` : "Variable"} color="#ffca28" />
                                            </div>
                                            {inc.notes && <div style={{ fontSize: 11, color: T.text3, background: T.bg3, borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>{inc.notes}</div>}
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button onClick={() => { setIncomeForm({ name: inc.name, incomeType: inc.incomeType, amount: inc.amount, frequency: inc.frequency, creditDay: inc.creditDay || "1", notes: inc.notes || "" }); setEditIncomeId(inc.id); setShowIncomeForm(true); }}
                                                    style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1px solid ${T.border2}`, background: T.bg4, color: T.text2, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ Edit</button>
                                                <button onClick={() => { setIncomes(p => p.filter(i => i.id !== inc.id)); setExpandIncomeId(null); }}
                                                    style={{ flex: 1, padding: "9px", borderRadius: 9, border: "1px solid #ff3b5c22", background: "#ff3b5c11", color: "#ff3b5c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑 Delete</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {cic.length > 0 && (
                        <div style={{ marginTop: 14, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px" }}>
                            <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>My Custom Income Categories</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {cic.map(c => (<button key={c.value} onClick={() => { setEditingCustomCat(c); setShowCustomCat("income"); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 20, border: `1px solid ${T.border}`, background: T.bg4, color: T.text2, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{c.icon} {c.label} <span style={{ opacity: 0.5, fontSize: 10 }}>✏️</span></button>))}
                            </div>
                        </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={() => { setIncomeForm({ ...EIF }); setEditIncomeId(null); setShowIncomeForm(true); }} style={{ flex: 2, padding: 13, background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Add Income</button>
                        <button onClick={() => { setEditingCustomCat(null); setShowCustomCat("income"); }} style={{ flex: 1, padding: 13, background: T.bg2, color: "#34d399", border: "1px solid #05966944", borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>＋ Category</button>
                    </div>
                </>)}

                {/* ══ EXPENSES TAB ══ */}
                {tab === "expenses" && (<>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14, marginBottom: 12 }}>
                        <StatBox T={T} label="Today's Spend" value={`₹${fmt(todaySpent)}`} color="#f97316" />
                        <StatBox T={T} label="Items Today" value={todayExps.length} color="#818cf8" />
                        <StatBox T={T} label="This Week" value={`₹${fmt(last7.reduce((s, d) => s + d.total, 0))}`} color="#ffca28" />
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        {[["today", "Today"], ["history", "History"]].map(([v, l]) => (
                            <button key={v} onClick={() => setExpView(v)}
                                style={{ padding: "7px 14px", borderRadius: 9, border: `1px solid ${expView === v ? "#f97316" : T.border}`, background: expView === v ? "#f9731622" : T.bg4, color: expView === v ? "#f97316" : T.text3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
                        {["all", ...EXPENSE_CATS.map(c => c.value)].map(v => {
                            const c = EXPENSE_CATS.find(x => x.value === v);
                            return (<button key={v} onClick={() => setExpFilter(v)} style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 9, border: `1px solid ${expFilter === v ? (c?.color || T.accent) + "66" : T.border}`, background: expFilter === v ? (c?.color || T.accent) + "22" : T.bg4, color: expFilter === v ? (c?.color || T.text) : T.text3, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{c ? c.icon + " " : ""}{v === "all" ? "All" : c?.label}</button>);
                        })}
                    </div>
                    {expView === "today" && (<>
                        {todayExps.length === 0 && <div style={{ textAlign: "center", padding: "36px 20px", color: T.text3, fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>No expenses logged today.</div>}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {todayExps.filter(e => expFilter === "all" || e.category === expFilter).sort((a, b) => (b.time || "").localeCompare(a.time || "")).map(e => {
                                const c = getEC(e.category);
                                return (
                                    <div key={e.id} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: c.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{e.description}</div>
                                                <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}><span style={{ color: c.color }}>{c.label}</span>{e.time ? ` · ${e.time}` : ""}{e.note && <span style={{ color: T.text4 }}> · {e.note}</span>}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: c.color }}>₹{fmt(e.amount)}</div>
                                            <button onClick={() => delExp(e.id)} style={{ background: "none", border: "none", color: T.text4, cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>✕</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>)}
                    {expView === "history" && (<>
                        {Object.keys(grouped).length === 0 && <div style={{ textAlign: "center", padding: "36px 20px", color: T.text3, fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>No history yet.</div>}
                        {Object.entries(grouped).filter(([, es]) => expFilter === "all" || es.some(e => e.category === expFilter)).map(([date, es]) => {
                            const filtered = expFilter === "all" ? es : es.filter(e => e.category === expFilter);
                            const dt = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);
                            return (
                                <div key={date} style={{ marginBottom: 14 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, color: date === today ? "#f97316" : T.text3, fontWeight: 700 }}>{date === today ? "Today" : date}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: "#f97316" }}>₹{fmt(dt)}</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {filtered.map(e => {
                                            const c = getEC(e.category);
                                            return (
                                                <div key={e.id} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                        <span style={{ fontSize: 16 }}>{c.icon}</span>
                                                        <div>
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{e.description}</div>
                                                            <div style={{ fontSize: 9, color: T.text4 }}>{c.label}{e.note ? ` · ${e.note}` : ""}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>₹{fmt(e.amount)}</span>
                                                        <button onClick={() => delExp(e.id)} style={{ background: "none", border: "none", color: T.text4, cursor: "pointer", fontSize: 12 }}>✕</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </>)}
                    {cec.length > 0 && (
                        <div style={{ marginTop: 14, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px" }}>
                            <div style={{ fontSize: 10, color: "#f97316", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>My Custom Expense Categories</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {cec.map(c => (<button key={c.value} onClick={() => { setEditingCustomCat(c); setShowCustomCat("expense"); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 20, border: `1px solid ${c.color}44`, background: c.color + "11", color: c.color, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{c.icon} {c.label} <span style={{ opacity: 0.5, fontSize: 10 }}>✏️</span></button>))}
                            </div>
                        </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={() => { setExpForm({ ...EEF }); setEditExpId(null); setShowExpForm(true); }} style={{ flex: 2, padding: 13, background: "linear-gradient(135deg,#ea580c,#c2410c)", color: "#fff", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Log Expense</button>
                        <button onClick={() => { setEditingCustomCat(null); setShowCustomCat("expense"); }} style={{ flex: 1, padding: 13, background: T.bg2, color: "#f97316", border: "1px solid #f9731644", borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>＋ Category</button>
                    </div>
                </>)}
            </div>

            {/* ══ LOAN FORM ══ */}
            {showLoanForm && (
                <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) { setShowLoanForm(false); setEditLoanId(null); } }}>
                    <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", padding: "20px 18px 40px", width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 18 }}>{editLoanId ? "Edit" : "Add"} Loan / Goal</div>
                        <Sec T={T} title="Basic Info">
                            <label style={lbl}>Name</label><input placeholder="e.g. HDFC Home Loan" value={loanForm.name} onChange={e => setLoanForm(f => ({ ...f, name: e.target.value }))} style={inp} />
                            <label style={lbl}>Category</label>
                            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>{LOAN_CATS.map(c => (<button key={c.value} onClick={() => setLoanForm(f => ({ ...f, category: c.value }))} style={{ flex: 1, padding: "8px 2px", borderRadius: 9, border: `1px solid ${loanForm.category === c.value ? T.accent : T.border}`, background: loanForm.category === c.value ? T.accent + "22" : T.bg4, color: loanForm.category === c.value ? T.accentText : T.text3, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{c.icon} {c.label}</button>))}</div>
                            <label style={lbl}>Due Type</label>
                            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>{[{ v: "monthly", l: "🔁 Monthly" }, { v: "oneoff", l: "📅 One-time" }].map(t => (<button key={t.v} onClick={() => setLoanForm(f => ({ ...f, type: t.v }))} style={{ flex: 1, padding: "8px 4px", borderRadius: 9, border: `1px solid ${loanForm.type === t.v ? T.accent : T.border}`, background: loanForm.type === t.v ? T.accent + "22" : T.bg4, color: loanForm.type === t.v ? T.accentText : T.text3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.l}</button>))}</div>
                            {loanForm.type === "monthly" ? <><label style={lbl}>Due Day</label><input type="number" min="1" max="31" placeholder="5" value={loanForm.dayOfMonth} onChange={e => setLoanForm(f => ({ ...f, dayOfMonth: e.target.value }))} style={inp} /></> : <><label style={lbl}>Deadline</label><input type="date" value={loanForm.dueDate} onChange={e => setLoanForm(f => ({ ...f, dueDate: e.target.value }))} style={inp} /></>}
                        </Sec>
                        <Sec T={T} title="Loan Details" subtitle="optional — for full breakdown">
                            <label style={lbl}>Principal (₹)</label><input type="number" placeholder="e.g. 200000" value={loanForm.principalAmount} onChange={e => setLoanForm(f => ({ ...f, principalAmount: e.target.value }))} style={inp} />
                            <label style={lbl}>Annual Interest (%)</label><input type="number" placeholder="e.g. 12.5" value={loanForm.interestRate} onChange={e => setLoanForm(f => ({ ...f, interestRate: e.target.value }))} style={inp} />
                            <label style={lbl}>Tenure (months)</label><input type="number" placeholder="e.g. 24" value={loanForm.tenureMonths} onChange={e => setLoanForm(f => ({ ...f, tenureMonths: e.target.value }))} style={inp} />
                            {autoEMI && (<div style={{ background: T.accent + "11", border: `1px solid ${T.accent}33`, borderRadius: 10, padding: "9px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 12, color: T.accentText }}>Auto-calculated EMI</span><span style={{ fontSize: 15, fontWeight: 800, color: "#00e676" }}>₹{fmt(autoEMI)}/mo</span></div>)}
                            <label style={lbl}>Monthly EMI (₹)</label><input type="number" placeholder={autoEMI ? `Auto ₹${fmt(autoEMI)}` : "e.g. 4500"} value={loanForm.emiAmount} onChange={e => setLoanForm(f => ({ ...f, emiAmount: e.target.value }))} style={inp} />
                            <label style={lbl}>EMIs Paid</label><input type="number" placeholder="0" value={loanForm.duePaid} onChange={e => setLoanForm(f => ({ ...f, duePaid: e.target.value }))} style={inp} />
                            <label style={lbl}>Start Date</label><input type="date" value={loanForm.loanStartDate} onChange={e => setLoanForm(f => ({ ...f, loanStartDate: e.target.value }))} style={inp} />
                        </Sec>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setShowLoanForm(false); setEditLoanId(null); }} style={{ flex: 1, padding: 12, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bg4, color: T.text3, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                            <button onClick={saveLoan} style={{ flex: 2, padding: 12, borderRadius: 11, border: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{editLoanId ? "Save Changes" : "Add Loan"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ INCOME FORM ══ */}
            {showIncomeForm && (
                <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) { setShowIncomeForm(false); setEditIncomeId(null); } }}>
                    <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", padding: "20px 18px 40px", width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 18 }}>{editIncomeId ? "Edit" : "Add"} Income Source</div>
                        <label style={lbl}>Name</label><input placeholder="e.g. HDFC Salary" value={incomeForm.name} onChange={e => setIncomeForm(f => ({ ...f, name: e.target.value }))} style={inp} />
                        <label style={lbl}>Type</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                            {INCOME_TYPES.map(it => (<button key={it.value} onClick={() => setIncomeForm(f => ({ ...f, incomeType: it.value }))} style={{ padding: "8px 4px", borderRadius: 9, border: `1px solid ${incomeForm.incomeType === it.value ? "#059669" : T.border}`, background: incomeForm.incomeType === it.value ? "#05966922" : T.bg4, color: incomeForm.incomeType === it.value ? "#34d399" : T.text3, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{it.icon}<br />{it.label}</button>))}
                            <button onClick={() => { setShowIncomeForm(false); setTimeout(() => { setEditingCustomCat(null); setShowCustomCat("income"); }, 100); }} style={{ padding: "8px 4px", borderRadius: 9, border: "1px dashed #059669", background: "#05966911", color: "#059669", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>＋<br />New</button>
                        </div>
                        <label style={lbl}>Amount (₹)</label><input type="number" placeholder="e.g. 50000" value={incomeForm.amount} onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))} style={inp} />
                        <label style={lbl}>Frequency</label>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>{FREQ_OPTIONS.map(fo => (<button key={fo.value} onClick={() => setIncomeForm(f => ({ ...f, frequency: fo.value }))} style={{ padding: "7px 12px", borderRadius: 9, border: `1px solid ${incomeForm.frequency === fo.value ? "#059669" : T.border}`, background: incomeForm.frequency === fo.value ? "#05966922" : T.bg4, color: incomeForm.frequency === fo.value ? "#34d399" : T.text3, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{fo.label}</button>))}</div>
                        {incomeForm.frequency === "monthly" && (<><label style={lbl}>Credit Day</label><input type="number" min="1" max="31" placeholder="1" value={incomeForm.creditDay} onChange={e => setIncomeForm(f => ({ ...f, creditDay: e.target.value }))} style={inp} /></>)}
                        <label style={lbl}>Notes</label><input placeholder="optional" value={incomeForm.notes} onChange={e => setIncomeForm(f => ({ ...f, notes: e.target.value }))} style={inp} />
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setShowIncomeForm(false); setEditIncomeId(null); }} style={{ flex: 1, padding: 12, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bg4, color: T.text3, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                            <button onClick={saveIncome} style={{ flex: 2, padding: 12, borderRadius: 11, border: "none", background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{editIncomeId ? "Save Changes" : "Add Income"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ EXPENSE FORM ══ */}
            {showExpForm && (
                <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) { setShowExpForm(false); setEditExpId(null); } }}>
                    <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", padding: "20px 18px 40px", width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 18 }}>Log Expense</div>
                        <label style={{ ...lbl, color: "#f97316" }}>What did you spend on?</label><input placeholder="e.g. Lunch, Uber..." value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} style={inp} />
                        <label style={{ ...lbl, color: "#f97316" }}>Amount (₹)</label><input type="number" placeholder="e.g. 250" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} style={inp} />
                        <label style={{ ...lbl, color: "#f97316" }}>Category</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                            {EXPENSE_CATS.map(c => (<button key={c.value} onClick={() => setExpForm(f => ({ ...f, category: c.value }))} style={{ padding: "8px 4px", borderRadius: 9, border: `1px solid ${expForm.category === c.value ? c.color + "88" : T.border}`, background: expForm.category === c.value ? c.color + "22" : T.bg4, color: expForm.category === c.value ? c.color : T.text3, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{c.icon}<br />{c.label}</button>))}
                            <button onClick={() => { setShowExpForm(false); setTimeout(() => { setEditingCustomCat(null); setShowCustomCat("expense"); }, 100); }} style={{ padding: "8px 4px", borderRadius: 9, border: "1px dashed #f97316", background: "#f9731611", color: "#f97316", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>＋<br />New</button>
                        </div>
                        <label style={{ ...lbl, color: "#f97316" }}>Note (optional)</label><input placeholder="e.g. office lunch..." value={expForm.note} onChange={e => setExpForm(f => ({ ...f, note: e.target.value }))} style={inp} />
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setShowExpForm(false); setEditExpId(null); }} style={{ flex: 1, padding: 12, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bg4, color: T.text3, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                            <button onClick={saveExp} style={{ flex: 2, padding: 12, borderRadius: 11, border: "none", background: "linear-gradient(135deg,#ea580c,#c2410c)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Log Expense</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ CUSTOM CATEGORY MODAL ══ */}
            {showCustomCat && (
                <CustomCatModal T={T} mode={showCustomCat} existing={editingCustomCat}
                    onSave={showCustomCat === "income" ? saveCI : saveCE}
                    onDelete={showCustomCat === "income" ? delCI : delCE}
                    onClose={() => { setShowCustomCat(null); setEditingCustomCat(null); }} />
            )}
        </div>
    );
}
