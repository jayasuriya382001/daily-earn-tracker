import { useState, useEffect } from "react";

const STORAGE_KEY = "det-loans-v2";
const INCOME_KEY = "det-income-v1";
const EXPENSE_KEY = "det-expenses-v1";
const CUSTOM_INC_KEY = "det-custom-income-cats";
const CUSTOM_EXP_KEY = "det-custom-expense-cats";

/* ── built-in constants ─────────────────────────────────── */
const LOAN_CATS = [
    { value: "emi", label: "EMI / Loan", icon: "🏦" },
    { value: "debt", label: "Debt", icon: "💳" },
    { value: "goal", label: "Goal", icon: "🎯" },
];
const BASE_INCOME_TYPES = [
    { value: "salary", label: "Salary", icon: "💼" },
    { value: "interest", label: "Bank Interest", icon: "🏛️" },
    { value: "freelance", label: "Freelance", icon: "💻" },
    { value: "rent", label: "Rent Income", icon: "🏠" },
    { value: "dividend", label: "Dividend", icon: "📈" },
    { value: "business", label: "Business", icon: "🏪" },
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
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
    { value: "variable", label: "Variable" },
];
const CUSTOM_COLORS = [
    "#6366f1", "#f97316", "#00e676", "#ffca28", "#ef4444", "#ec4899",
    "#06b6d4", "#a855f7", "#84cc16", "#14b8a6", "#f43f5e", "#8b5cf6",
];
const EMOJI_PICKS = ["⭐", "🌟", "🔥", "💡", "🎵", "🏋️", "✈️", "🌿", "🎨", "🍕", "☕", "🐾", "🎯", "🏆", "💎", "🎁", "🔑", "🌙", "🌊", "🌸"];

const EMPTY_LOAN_FORM = { name: "", category: "emi", emiAmount: "", type: "monthly", dayOfMonth: "5", dueDate: "", principalAmount: "", interestRate: "", tenureMonths: "", duePaid: "0", loanStartDate: "" };
const EMPTY_INCOME_FORM = { name: "", incomeType: "salary", amount: "", frequency: "monthly", creditDay: "1", notes: "" };
const EMPTY_EXP_FORM = { description: "", amount: "", category: "food", note: "" };
const EMPTY_CUSTOM_CAT = { label: "", icon: "⭐", color: "#6366f1" };

/* ── helpers ────────────────────────────────────────────── */
function getDaysLeft(d) { const t = new Date(); t.setHours(0, 0, 0, 0); const x = new Date(d); x.setHours(0, 0, 0, 0); return Math.ceil((x - t) / 86400000); }
function getNextDate(day) { const today = new Date(); const tm = new Date(today.getFullYear(), today.getMonth(), day); if (tm <= today) return new Date(today.getFullYear(), today.getMonth() + 1, day).toISOString().split("T")[0]; return tm.toISOString().split("T")[0]; }
function calcEMI(p, r, n) { if (!p || !r || !n) return 0; const mr = r / 12 / 100; if (mr === 0) return p / n; return p * mr * Math.pow(1 + mr, n) / (Math.pow(1 + mr, n) - 1); }
function toDailyIncome(amount, freq) { const a = parseFloat(amount) || 0; return freq === "daily" ? a : freq === "weekly" ? a / 7 : freq === "monthly" ? a / 30 : freq === "yearly" ? a / 365 : 0; }
function todayKey() { return new Date().toISOString().split("T")[0]; }
function fmt(n) { return Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 }); }
function fmtD(n) { return Number(n).toLocaleString("en-IN", { maximumFractionDigits: 1 }); }
function slugify(s) { return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now(); }

/* ── components ─────────────────────────────────────────── */
function ProgressRing({ percent, size = 72, stroke = 6, color }) {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (Math.min(percent, 100) / 100) * circ;
    return (<svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} /></svg>);
}
function StatBox({ label, value, color = "#e2e8f0", sub }) {
    return (<div style={{ flex: 1, background: "#0d1526", borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid #1e293b" }}><div style={{ fontSize: 14, fontWeight: 800, color }}>{value}</div>{sub && <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 600 }}>{sub}</div>}<div style={{ fontSize: 9, color: "#475569", marginTop: 2, lineHeight: 1.3 }}>{label}</div></div>);
}
function Sec({ title, subtitle, children }) {
    return (<div style={{ marginBottom: 18 }}><div style={{ marginBottom: 10 }}><div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{title}</div>{subtitle && <div style={{ fontSize: 10, color: "#334155", marginTop: 1 }}>{subtitle}</div>}</div>{children}</div>);
}
const lbl = { display: "block", fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 };
const inp = { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 13px", color: "#fff", fontSize: 14, outline: "none", marginBottom: 13, boxSizing: "border-box" };

/* ══ CUSTOM CATEGORY MODAL ════════════════════════════════ */
function CustomCatModal({ mode, existing, onSave, onDelete, onClose }) {
    // mode = "income" | "expense"
    const [form, setForm] = useState(existing || { ...EMPTY_CUSTOM_CAT });
    const isExpense = mode === "expense";
    const accentColor = isExpense ? "#f97316" : "#059669";

    return (
        <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 18, padding: "22px 18px 24px", width: "100%", maxWidth: 360 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 16 }}>
                    {existing ? "Edit" : "Add"} Custom {isExpense ? "Expense" : "Income"} Category
                </div>

                <label style={{ ...lbl, color: accentColor }}>Category Name</label>
                <input placeholder="e.g. Pet Care, Crypto, Tips..." value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))} style={inp} />

                <label style={{ ...lbl, color: accentColor }}>Pick an Emoji</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {EMOJI_PICKS.map(em => (
                        <button key={em} onClick={() => setForm(f => ({ ...f, icon: em }))}
                            style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${form.icon === em ? accentColor : "#1e293b"}`, background: form.icon === em ? accentColor + "22" : "#1e293b", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {em}
                        </button>
                    ))}
                    <div style={{ position: "relative", width: 36, height: 36 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${!EMOJI_PICKS.includes(form.icon) ? accentColor : "#1e293b"}`, background: !EMOJI_PICKS.includes(form.icon) ? accentColor + "22" : "#1e293b", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {!EMOJI_PICKS.includes(form.icon) ? form.icon : "✏️"}
                        </div>
                        <input type="text" maxLength={2} placeholder="✏️"
                            onChange={e => { if (e.target.value) setForm(f => ({ ...f, icon: e.target.value })); }}
                            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
                    </div>
                </div>

                {isExpense && (
                    <>
                        <label style={{ ...lbl, color: accentColor }}>Pick a Colour</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                            {CUSTOM_COLORS.map(c => (
                                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                                    style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `3px solid ${form.color === c ? "#fff" : "transparent"}`, cursor: "pointer" }} />
                            ))}
                        </div>
                    </>
                )}

                {/* preview */}
                <div style={{ background: "#1e293b", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: (isExpense ? form.color : "#059669") + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{form.icon || "⭐"}</div>
                    <span style={{ fontWeight: 700, color: isExpense ? form.color : "#34d399", fontSize: 13 }}>{form.label || "Preview"}</span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    {existing && <button onClick={() => { onDelete(existing.value); onClose(); }} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ff3b5c22", background: "#ff3b5c11", color: "#ff3b5c", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Delete</button>}
                    <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: "1px solid #1e293b", background: "#1e293b", color: "#64748b", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => { if (!form.label) return; onSave({ ...form, value: existing?.value || slugify(form.label) }); onClose(); }}
                        style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: `linear-gradient(135deg,${accentColor},${accentColor}bb)`, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        {existing ? "Save Changes" : "Add Category"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ══ MAIN APP ═════════════════════════════════════════════ */
export default function App() {
    const [tab, setTab] = useState("overview");

    const [loans, setLoans] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] } });
    const [incomes, setIncomes] = useState(() => { try { return JSON.parse(localStorage.getItem(INCOME_KEY) || "[]") } catch { return [] } });
    const [expenses, setExpenses] = useState(() => { try { return JSON.parse(localStorage.getItem(EXPENSE_KEY) || "[]") } catch { return [] } });
    const [customIncCats, setCustomIncCats] = useState(() => { try { return JSON.parse(localStorage.getItem(CUSTOM_INC_KEY) || "[]") } catch { return [] } });
    const [customExpCats, setCustomExpCats] = useState(() => { try { return JSON.parse(localStorage.getItem(CUSTOM_EXP_KEY) || "[]") } catch { return [] } });

    const INCOME_TYPES = [...BASE_INCOME_TYPES, ...customIncCats];
    const EXPENSE_CATS = [...BASE_EXPENSE_CATS, ...customExpCats];

    // forms
    const [showLoanForm, setShowLoanForm] = useState(false);
    const [showIncomeForm, setShowIncomeForm] = useState(false);
    const [showExpForm, setShowExpForm] = useState(false);
    const [loanForm, setLoanForm] = useState({ ...EMPTY_LOAN_FORM });
    const [incomeForm, setIncomeForm] = useState({ ...EMPTY_INCOME_FORM });
    const [expForm, setExpForm] = useState({ ...EMPTY_EXP_FORM });
    const [editLoanId, setEditLoanId] = useState(null);
    const [editIncomeId, setEditIncomeId] = useState(null);
    const [editExpId, setEditExpId] = useState(null);
    const [expandLoanId, setExpandLoanId] = useState(null);
    const [expandIncomeId, setExpandIncomeId] = useState(null);
    const [expView, setExpView] = useState("today");
    const [expFilter, setExpFilter] = useState("all");

    // custom cat modals
    const [showCustomCat, setShowCustomCat] = useState(null); // null | "income" | "expense"
    const [editingCustomCat, setEditingCustomCat] = useState(null);

    const [todayEarned, setTodayEarned] = useState(() => { try { return parseFloat(localStorage.getItem("det-earned") || "0") } catch { return 0 } });
    const [earnInput, setEarnInput] = useState("");

    useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loans)) } catch { } }, [loans]);
    useEffect(() => { try { localStorage.setItem(INCOME_KEY, JSON.stringify(incomes)) } catch { } }, [incomes]);
    useEffect(() => { try { localStorage.setItem(EXPENSE_KEY, JSON.stringify(expenses)) } catch { } }, [expenses]);
    useEffect(() => { try { localStorage.setItem(CUSTOM_INC_KEY, JSON.stringify(customIncCats)) } catch { } }, [customIncCats]);
    useEffect(() => { try { localStorage.setItem(CUSTOM_EXP_KEY, JSON.stringify(customExpCats)) } catch { } }, [customExpCats]);
    useEffect(() => { try { localStorage.setItem("det-earned", todayEarned) } catch { } }, [todayEarned]);

    /* custom cat handlers */
    function saveCustomIncCat(cat) {
        setCustomIncCats(p => { const idx = p.findIndex(c => c.value === cat.value); return idx >= 0 ? p.map((c, i) => i === idx ? cat : c) : [...p, cat]; });
    }
    function delCustomIncCat(val) {
        setCustomIncCats(p => p.filter(c => c.value !== val));
        setIncomes(p => p.map(i => i.incomeType === val ? { ...i, incomeType: "other" } : i));
    }
    function saveCustomExpCat(cat) {
        setCustomExpCats(p => { const idx = p.findIndex(c => c.value === cat.value); return idx >= 0 ? p.map((c, i) => i === idx ? cat : c) : [...p, cat]; });
    }
    function delCustomExpCat(val) {
        setCustomExpCats(p => p.filter(c => c.value !== val));
        setExpenses(p => p.map(e => e.category === val ? { ...e, category: "other" } : e));
    }

    /* computed */
    const cLoans = loans.map(item => {
        let due = item.dueDate;
        if (item.type === "monthly") due = getNextDate(parseInt(item.dayOfMonth));
        const daysLeft = getDaysLeft(due), safe = Math.max(daysLeft, 1);
        let emi = parseFloat(item.emiAmount) || 0;
        if (!emi && item.principalAmount && item.interestRate && item.tenureMonths)
            emi = calcEMI(parseFloat(item.principalAmount), parseFloat(item.interestRate), parseInt(item.tenureMonths));
        const daily = emi / safe, p = parseFloat(item.principalAmount) || 0, r = parseFloat(item.interestRate) || 0;
        const n = parseInt(item.tenureMonths) || 0, paid = parseInt(item.duePaid) || 0;
        const totalP = n > 0 ? emi * n : null, totalI = totalP ? totalP - p : null;
        const amtPaid = emi * paid, out = totalP ? Math.max(totalP - amtPaid, 0) : null;
        const prog = totalP > 0 ? Math.min((amtPaid / totalP) * 100, 100) : null;
        return {
            ...item, dueDate: due, daysLeft, dailyNeeded: daily, emiAmount: emi, principal: p, rate: r, tenure: n, duePaid: paid,
            dueRemaining: n > 0 ? n - paid : null, totalInterest: totalI, totalPayable: totalP, amountPaid: amtPaid, outstanding: out, repayProgress: prog
        };
    });

    const cIncomes = incomes.map(inc => {
        const daily = toDailyIncome(inc.amount, inc.frequency);
        const next = inc.frequency === "monthly" && inc.creditDay ? getNextDate(parseInt(inc.creditDay)) : null;
        return { ...inc, dailyEquiv: daily, nextCredit: next, daysToCredit: next ? getDaysLeft(next) : null };
    });

    const today = todayKey();
    const todayExps = expenses.filter(e => e.date === today);
    const todayTotal = todayExps.reduce((s, e) => s + parseFloat(e.amount), 0);
    const grouped = {};
    [...expenses].sort((a, b) => b.date.localeCompare(a.date)).forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });
    const catTotals = {};
    todayExps.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount); });
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const label = i === 0 ? "Today" : i === 1 ? "Yest" : d.toLocaleDateString("en-IN", { weekday: "short" });
        return { key, label, total: expenses.filter(e => e.date === key).reduce((s, e) => s + parseFloat(e.amount), 0) };
    }).reverse();
    const maxDay = Math.max(...last7.map(d => d.total), 1);

    const totalDailyNeeded = cLoans.reduce((s, i) => s + i.dailyNeeded, 0);
    const totalDailyGuaranteed = cIncomes.filter(i => i.frequency !== "variable").reduce((s, i) => s + i.dailyEquiv, 0);
    const totalMonthlyIncome = cIncomes.reduce((s, i) => {
        const a = parseFloat(i.amount) || 0;
        return s + (i.frequency === "monthly" ? a : i.frequency === "yearly" ? a / 12 : i.frequency === "weekly" ? a * 4.33 : i.frequency === "daily" ? a * 30 : 0);
    }, 0);
    const netGap = Math.max(totalDailyNeeded - totalDailyGuaranteed, 0);
    const coverPct = totalDailyNeeded > 0 ? Math.min(((todayEarned + totalDailyGuaranteed) / totalDailyNeeded) * 100, 100) : 100;
    const ringColor = coverPct >= 100 ? "#00e676" : coverPct >= 60 ? "#ffca28" : "#ff3b5c";
    const shortfall = Math.max(totalDailyNeeded - todayEarned - totalDailyGuaranteed, 0);
    const monthlyOut = totalDailyNeeded * 30;
    const netMonthly = totalMonthlyIncome - monthlyOut;

    function saveLoan() {
        if (!loanForm.name) return;
        const n = { id: editLoanId || Date.now() + "", name: loanForm.name, category: loanForm.category, emiAmount: loanForm.emiAmount, type: loanForm.type, dayOfMonth: loanForm.dayOfMonth, dueDate: loanForm.dueDate, principalAmount: loanForm.principalAmount, interestRate: loanForm.interestRate, tenureMonths: loanForm.tenureMonths, duePaid: loanForm.duePaid, loanStartDate: loanForm.loanStartDate };
        setLoans(p => editLoanId ? p.map(i => i.id === editLoanId ? n : i) : [...p, n]);
        setLoanForm({ ...EMPTY_LOAN_FORM }); setShowLoanForm(false); setEditLoanId(null);
    }
    function saveIncome() {
        if (!incomeForm.name || !incomeForm.amount) return;
        const n = { id: editIncomeId || Date.now() + "", name: incomeForm.name, incomeType: incomeForm.incomeType, amount: incomeForm.amount, frequency: incomeForm.frequency, creditDay: incomeForm.creditDay, notes: incomeForm.notes };
        setIncomes(p => editIncomeId ? p.map(i => i.id === editIncomeId ? n : i) : [...p, n]);
        setIncomeForm({ ...EMPTY_INCOME_FORM }); setShowIncomeForm(false); setEditIncomeId(null);
    }
    function saveExp() {
        if (!expForm.description || !expForm.amount) return;
        const n = { id: editExpId || Date.now() + "", description: expForm.description, amount: expForm.amount, category: expForm.category, note: expForm.note, date: today, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) };
        setExpenses(p => editExpId ? p.map(e => e.id === editExpId ? n : e) : [...p, n]);
        setExpForm({ ...EMPTY_EXP_FORM }); setShowExpForm(false); setEditExpId(null);
    }
    function delExp(id) { setExpenses(p => p.filter(e => e.id !== id)); }
    function logEarning() { const v = parseFloat(earnInput); if (!isNaN(v) && v > 0) { setTodayEarned(p => p + v); setEarnInput(""); } }
    const autoEMI = loanForm.principalAmount && loanForm.interestRate && loanForm.tenureMonths ? calcEMI(parseFloat(loanForm.principalAmount), parseFloat(loanForm.interestRate), parseInt(loanForm.tenureMonths)) : null;

    /* helper to get cat info */
    function getExpCat(val) { return EXPENSE_CATS.find(x => x.value === val) || { value: "other", label: "Other", icon: "💸", color: "#64748b" }; }
    function getIncType(val) { return INCOME_TYPES.find(x => x.value === val) || { value: "other", label: "Other", icon: "💰" }; }

    return (
        <div style={{ minHeight: "100vh", background: "#080d1a", color: "#e2e8f0", fontFamily: "'Inter',system-ui,sans-serif", paddingBottom: 80 }}>

            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1a1545 100%)", padding: "24px 20px 14px", borderBottom: "1px solid #1e293b" }}>
                <div style={{ maxWidth: 480, margin: "0 auto" }}>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: "#6366f1", fontWeight: 700, marginBottom: 3, textTransform: "uppercase" }}>Daily Earn Tracker</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#fff" }}>₹{fmt(netGap)}<span style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>/day still needed</span></h1>
                            <p style={{ margin: "3px 0 0", fontSize: 11, color: "#475569" }}>₹{fmtD(totalDailyGuaranteed)}/day guaranteed · spent ₹{fmt(todayTotal)} today</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 10, color: "#475569" }}>Daily target</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#ff3b5c" }}>₹{fmt(totalDailyNeeded)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ background: "#0a0f1e", borderBottom: "1px solid #1e293b", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: 480, margin: "0 auto", display: "flex" }}>
                    {[["overview", "📊"], ["loans", "🏦"], ["income", "💰"], ["expenses", "🧾"]].map(([v, icon]) => (
                        <button key={v} onClick={() => setTab(v)}
                            style={{ flex: 1, padding: "11px 2px", background: "none", border: "none", borderBottom: `2px solid ${tab === v ? "#6366f1" : "transparent"}`, color: tab === v ? "#818cf8" : "#475569", fontWeight: tab === v ? 700 : 500, fontSize: 11, cursor: "pointer", textTransform: "capitalize" }}>
                            {icon} {v}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

                {/* ══ OVERVIEW ══ */}
                {tab === "overview" && (
                    <>
                        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 18, marginTop: 16 }}>
                            <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Today's Overview</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <div style={{ position: "relative", flexShrink: 0 }}>
                                    <ProgressRing percent={coverPct} size={68} stroke={6} color={ringColor} />
                                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: ringColor }}>{Math.round(coverPct)}%</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>Logged today</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>₹{fmt(todayEarned)}</div>
                                    <div style={{ fontSize: 11, color: "#64748b" }}>+ ₹{fmtD(totalDailyGuaranteed)} guaranteed</div>
                                    <div style={{ fontSize: 11, marginTop: 3, color: shortfall > 0 ? "#ff3b5c" : "#00e676" }}>{shortfall > 0 ? `₹${fmt(shortfall)} more needed` : "✓ Daily goal cleared!"}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 10, color: "#ef4444" }}>Spent</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>₹{fmt(todayTotal)}</div>
                                    <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{todayExps.length} items</div>
                                </div>
                            </div>
                            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                                <input type="number" placeholder="Log extra earnings..." value={earnInput} onChange={e => setEarnInput(e.target.value)} onKeyDown={e => e.key === "Enter" && logEarning()} style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 14, outline: "none" }} />
                                <button onClick={logEarning} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Log</button>
                                {todayEarned > 0 && <button onClick={() => setTodayEarned(0)} style={{ background: "#1e293b", color: "#64748b", border: "1px solid #1e293b", borderRadius: 10, padding: "9px 10px", fontSize: 12, cursor: "pointer" }}>↺</button>}
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
                            <div style={{ background: "#0a1a0f", border: "1px solid #00e67622", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                                <div style={{ fontSize: 10, color: "#00e676", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Income</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#00e676", marginTop: 4 }}>₹{fmt(totalMonthlyIncome)}</div>
                                <div style={{ fontSize: 9, color: "#334155" }}>/month</div>
                            </div>
                            <div style={{ background: "#1a0a0f", border: "1px solid #ff3b5c22", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                                <div style={{ fontSize: 10, color: "#ff3b5c", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>EMIs</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#ff3b5c", marginTop: 4 }}>₹{fmt(monthlyOut)}</div>
                                <div style={{ fontSize: 9, color: "#334155" }}>/month</div>
                            </div>
                            <div style={{ background: "#1a100a", border: "1px solid #f9731622", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                                <div style={{ fontSize: 10, color: "#f97316", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Spent</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#f97316", marginTop: 4 }}>₹{fmt(todayTotal)}</div>
                                <div style={{ fontSize: 9, color: "#334155" }}>today</div>
                            </div>
                        </div>
                        {(incomes.length > 0 || loans.length > 0) && (
                            <div style={{ background: netMonthly >= 0 ? "#0a1a0f" : "#1a0a0f", border: `1px solid ${netMonthly >= 0 ? "#00e67622" : "#ff3b5c22"}`, borderRadius: 12, padding: "12px 16px", marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Monthly Net</div>
                                    <div style={{ fontSize: 10, color: "#334155", marginTop: 1 }}>{netMonthly >= 0 ? "Surplus after EMIs" : "Short of EMIs"}</div>
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: netMonthly >= 0 ? "#00e676" : "#ff3b5c" }}>{netMonthly >= 0 ? "+" : ""}₹{fmt(Math.abs(netMonthly))}</div>
                            </div>
                        )}
                        {expenses.length > 0 && (
                            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "14px 16px", marginTop: 10 }}>
                                <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>7-Day Spending</div>
                                <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60 }}>
                                    {last7.map(d => (
                                        <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                            <div style={{ fontSize: 8, color: "#f97316", fontWeight: 600 }}>{d.total > 0 ? `₹${fmt(d.total)}` : ""}</div>
                                            <div style={{ width: "100%", background: d.key === today ? "#f97316" : "#f9731644", borderRadius: "3px 3px 0 0", height: `${Math.max((d.total / maxDay) * 44, d.total > 0 ? 4 : 0)}px`, transition: "height 0.4s" }} />
                                            <div style={{ fontSize: 9, color: d.key === today ? "#f97316" : "#334155", fontWeight: d.key === today ? 700 : 400 }}>{d.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {todayExps.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                                <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Today's Breakdown</div>
                                {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                                    const c = getExpCat(cat); const pct = (amt / todayTotal) * 100;
                                    return (<div key={cat} style={{ marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, color: "#e2e8f0" }}>{c.icon} {c.label}</span><span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>₹{fmt(amt)}</span></div><div style={{ background: "#1e293b", borderRadius: 4, height: 4 }}><div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 4, transition: "width 0.4s" }} /></div></div>);
                                })}
                            </div>
                        )}
                        {cIncomes.filter(i => i.daysToCredit !== null && i.daysToCredit <= 10).length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Incoming Soon</div>
                                {cIncomes.filter(i => i.daysToCredit !== null && i.daysToCredit <= 10).map(inc => {
                                    const it = getIncType(inc.incomeType);
                                    return (<div key={inc.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 18 }}>{it.icon}</span><div><div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{inc.name}</div><div style={{ fontSize: 10, color: "#475569" }}>in {inc.daysToCredit}d · {inc.nextCredit}</div></div></div><div style={{ fontSize: 15, fontWeight: 800, color: "#00e676" }}>₹{fmt(inc.amount)}</div></div>);
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ══ LOANS ══ */}
                {tab === "loans" && (
                    <>
                        <div style={{ marginTop: 14 }}>
                            {cLoans.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: "#334155", fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>No loans or goals yet.</div>}
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {cLoans.map(item => {
                                    const exp = expandLoanId === item.id;
                                    const cat = LOAN_CATS.find(c => c.value === item.category) || LOAN_CATS[0];
                                    const urg = item.daysLeft <= 3 ? "#ff3b5c" : item.daysLeft <= 7 ? "#ff8c00" : "#6366f1";
                                    const has = item.principal > 0 && item.tenure > 0;
                                    return (
                                        <div key={item.id} style={{ background: "#0f172a", border: `1px solid ${exp ? "#6366f133" : "#1e293b"}`, borderRadius: 14, overflow: "hidden" }}>
                                            <div style={{ height: 3, background: urg, opacity: 0.8 }} />
                                            <div style={{ padding: "14px 16px 10px", cursor: "pointer" }} onClick={() => setExpandLoanId(exp ? null : item.id)}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                        <span style={{ fontSize: 20 }}>{cat.icon}</span>
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                                                                {item.name}
                                                                {item.daysLeft <= 3 && <span style={{ background: "#ff3b5c22", color: "#ff3b5c", padding: "1px 6px", borderRadius: 20, fontSize: 9, fontWeight: 700 }}>🔥 URGENT</span>}
                                                                {item.daysLeft > 3 && item.daysLeft <= 7 && <span style={{ background: "#ff8c0022", color: "#ff8c00", padding: "1px 6px", borderRadius: 20, fontSize: 9, fontWeight: 700 }}>⚡ SOON</span>}
                                                            </div>
                                                            <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>Due {item.dueDate} · {item.daysLeft > 0 ? `${item.daysLeft}d left` : "Due today!"}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>₹{fmt(item.dailyNeeded)}<span style={{ fontSize: 9, color: "#475569", fontWeight: 400 }}>/day</span></div>
                                                        <div style={{ fontSize: 10, color: "#475569" }}>EMI ₹{fmt(item.emiAmount)}</div>
                                                    </div>
                                                </div>
                                                {item.repayProgress !== null && (<div style={{ marginTop: 10 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 9, color: "#475569" }}>Repayment</span><span style={{ fontSize: 9, color: "#6366f1", fontWeight: 700 }}>{item.repayProgress.toFixed(0)}%</span></div><div style={{ background: "#1e293b", borderRadius: 3, height: 4 }}><div style={{ width: `${item.repayProgress}%`, height: "100%", background: "linear-gradient(90deg,#6366f1,#00e676)", borderRadius: 3 }} /></div></div>)}
                                                <div style={{ fontSize: 9, color: "#334155", marginTop: 5, textAlign: "right" }}>{exp ? "▲ collapse" : "▼ details"}</div>
                                            </div>
                                            {exp && (
                                                <div style={{ padding: "0 16px 14px", borderTop: "1px solid #1e293b", paddingTop: 12 }}>
                                                    {has ? (<><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}><StatBox label="Principal" value={`₹${fmt(item.principal)}`} color="#fff" /><StatBox label="Rate" value={`${item.rate}%`} color="#ffca28" sub="p.a." /><StatBox label="Tenure" value={`${item.tenure}mo`} color="#818cf8" /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}><StatBox label="Monthly EMI" value={`₹${fmt(item.emiAmount)}`} color="#00e676" /><StatBox label="Total Interest" value={item.totalInterest ? `₹${fmt(item.totalInterest)}` : "—"} color="#ff3b5c" /><StatBox label="Total Payable" value={item.totalPayable ? `₹${fmt(item.totalPayable)}` : "—"} color="#fff" /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}><StatBox label="EMIs Paid" value={item.duePaid} color="#00e676" sub={`of ${item.tenure}`} /><StatBox label="EMIs Left" value={item.dueRemaining ?? "-"} color="#ffca28" /><StatBox label="Outstanding" value={item.outstanding ? `₹${fmt(item.outstanding)}` : "—"} color="#ff3b5c" /></div>{item.loanStartDate && <div style={{ marginTop: 8, fontSize: 10, color: "#475569", textAlign: "center" }}>Started: {item.loanStartDate}</div>}</>) : (<div style={{ color: "#334155", fontSize: 11, textAlign: "center", padding: "8px 0" }}>Edit to add loan details.</div>)}
                                                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                                        <button onClick={() => { setLoanForm({ name: item.name, category: item.category, emiAmount: item.emiAmount || "", type: item.type, dayOfMonth: item.dayOfMonth || "5", dueDate: item.dueDate || "", principalAmount: item.principalAmount || "", interestRate: item.interestRate || "", tenureMonths: item.tenureMonths || "", duePaid: item.duePaid || "0", loanStartDate: item.loanStartDate || "" }); setEditLoanId(item.id); setShowLoanForm(true); }} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ Edit</button>
                                                        <button onClick={() => { setLoans(p => p.filter(i => i.id !== item.id)); setExpandLoanId(null); }} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1px solid #ff3b5c22", background: "#ff3b5c11", color: "#ff3b5c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑 Delete</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <button onClick={() => { setLoanForm({ ...EMPTY_LOAN_FORM }); setEditLoanId(null); setShowLoanForm(true); }} style={{ width: "100%", marginTop: 12, padding: 13, background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Add Loan / Goal</button>
                    </>
                )}

                {/* ══ INCOME ══ */}
                {tab === "income" && (
                    <>
                        {incomes.length > 0 && (<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14, marginBottom: 12 }}><StatBox label="Monthly Total" value={`₹${fmt(totalMonthlyIncome)}`} color="#00e676" /><StatBox label="Daily Guaranteed" value={`₹${fmtD(totalDailyGuaranteed)}`} color="#ffca28" /><StatBox label="Sources" value={incomes.length} color="#818cf8" /></div>)}
                        {cIncomes.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: "#334155", fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>No income sources yet.</div>}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: incomes.length === 0 ? 14 : 0 }}>
                            {cIncomes.map(inc => {
                                const exp = expandIncomeId === inc.id;
                                const it = getIncType(inc.incomeType);
                                const fl = FREQ_OPTIONS.find(f => f.value === inc.frequency)?.label || inc.frequency;
                                const isCustom = customIncCats.some(c => c.value === inc.incomeType);
                                return (
                                    <div key={inc.id} style={{ background: "#0f172a", border: `1px solid ${exp ? "#00e67633" : "#1e293b"}`, borderRadius: 14, overflow: "hidden" }}>
                                        <div style={{ height: 3, background: "#00e676", opacity: 0.6 }} />
                                        <div style={{ padding: "13px 16px 10px", cursor: "pointer" }} onClick={() => setExpandIncomeId(exp ? null : inc.id)}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <span style={{ fontSize: 20 }}>{it.icon}</span>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 6 }}>
                                                            {inc.name}
                                                            {isCustom && <span style={{ background: "#6366f122", color: "#818cf8", padding: "1px 6px", borderRadius: 20, fontSize: 9, fontWeight: 700 }}>Custom</span>}
                                                        </div>
                                                        <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{fl}{inc.nextCredit && ` · next ${inc.nextCredit}`}{inc.daysToCredit !== null && inc.daysToCredit <= 7 && <span style={{ color: "#00e676", marginLeft: 5, fontWeight: 700 }}>in {inc.daysToCredit}d</span>}</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#00e676" }}>₹{fmt(inc.amount)}</div>
                                                    <div style={{ fontSize: 10, color: "#475569" }}>/{inc.frequency === "monthly" ? "mo" : inc.frequency === "yearly" ? "yr" : inc.frequency === "weekly" ? "wk" : inc.frequency === "daily" ? "day" : "once"}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 9, color: "#334155", marginTop: 5, textAlign: "right" }}>{exp ? "▲ collapse" : "▼ details"}</div>
                                        </div>
                                        {exp && (
                                            <div style={{ padding: "0 16px 14px", borderTop: "1px solid #1e293b", paddingTop: 12 }}>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                                                    <StatBox label="Per Month" value={inc.frequency !== "variable" ? `₹${fmt(inc.frequency === "monthly" ? inc.amount : inc.frequency === "yearly" ? inc.amount / 12 : inc.frequency === "weekly" ? inc.amount * 4.33 : inc.amount * 30)}` : "Variable"} color="#00e676" />
                                                    <StatBox label="Per Day" value={inc.dailyEquiv > 0 ? `₹${fmtD(inc.dailyEquiv)}` : "Variable"} color="#ffca28" />
                                                </div>
                                                {inc.notes && <div style={{ fontSize: 11, color: "#475569", background: "#0d1526", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>{inc.notes}</div>}
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <button onClick={() => { setIncomeForm({ name: inc.name, incomeType: inc.incomeType, amount: inc.amount, frequency: inc.frequency, creditDay: inc.creditDay || "1", notes: inc.notes || "" }); setEditIncomeId(inc.id); setShowIncomeForm(true); }} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ Edit</button>
                                                    <button onClick={() => { setIncomes(p => p.filter(i => i.id !== inc.id)); setExpandIncomeId(null); }} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1px solid #ff3b5c22", background: "#ff3b5c11", color: "#ff3b5c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑 Delete</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Custom income categories management */}
                        {customIncCats.length > 0 && (
                            <div style={{ marginTop: 14, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "14px 16px" }}>
                                <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>My Custom Income Categories</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {customIncCats.map(c => (
                                        <button key={c.value} onClick={() => { setEditingCustomCat(c); setShowCustomCat("income"); }}
                                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 20, border: "1px solid #1e293b", background: "#1e293b", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                            {c.icon} {c.label} <span style={{ color: "#475569", fontSize: 10 }}>✏️</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button onClick={() => { setIncomeForm({ ...EMPTY_INCOME_FORM }); setEditIncomeId(null); setShowIncomeForm(true); }} style={{ flex: 2, padding: 13, background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Add Income</button>
                            <button onClick={() => { setEditingCustomCat(null); setShowCustomCat("income"); }} style={{ flex: 1, padding: 13, background: "#1e293b", color: "#34d399", border: "1px solid #05966944", borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>＋ Category</button>
                        </div>
                    </>
                )}

                {/* ══ EXPENSES ══ */}
                {tab === "expenses" && (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14, marginBottom: 12 }}>
                            <StatBox label="Today's Spend" value={`₹${fmt(todayTotal)}`} color="#f97316" />
                            <StatBox label="Today's Items" value={todayExps.length} color="#818cf8" />
                            <StatBox label="This Week" value={`₹${fmt(last7.reduce((s, d) => s + d.total, 0))}`} color="#ffca28" />
                        </div>

                        {/* view + filter */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                            {[["today", "Today"], ["history", "History"]].map(([v, l]) => (
                                <button key={v} onClick={() => setExpView(v)} style={{ padding: "7px 14px", borderRadius: 9, border: `1px solid ${expView === v ? "#f97316" : "#1e293b"}`, background: expView === v ? "#f9731622" : "#1e293b", color: expView === v ? "#f97316" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
                            {["all", ...EXPENSE_CATS.map(c => c.value)].map(v => {
                                const c = EXPENSE_CATS.find(x => x.value === v);
                                return (<button key={v} onClick={() => setExpFilter(v)} style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 9, border: `1px solid ${expFilter === v ? (c?.color || "#6366f1") + "66" : "#1e293b"}`, background: expFilter === v ? (c?.color || "#6366f1") + "22" : "#1e293b", color: expFilter === v ? (c?.color || "#e2e8f0") : "#475569", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{c ? c.icon + " " : ""}{v === "all" ? "All" : c?.label}</button>);
                            })}
                        </div>

                        {expView === "today" && (
                            <>
                                {todayExps.length === 0 && <div style={{ textAlign: "center", padding: "36px 20px", color: "#334155", fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>No expenses logged today.</div>}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {todayExps.filter(e => expFilter === "all" || e.category === expFilter).sort((a, b) => (b.time || "").localeCompare(a.time || "")).map(e => {
                                        const c = getExpCat(e.category);
                                        const isCustom = customExpCats.some(x => x.value === e.category);
                                        return (
                                            <div key={e.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: c.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 5 }}>{e.description}{isCustom && <span style={{ background: "#6366f122", color: "#818cf8", padding: "1px 5px", borderRadius: 10, fontSize: 8, fontWeight: 700 }}>Custom</span>}</div>
                                                        <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}><span style={{ color: c.color }}>{c.label}</span>{e.time ? ` · ${e.time}` : ""}{e.note && <span style={{ color: "#334155" }}> · {e.note}</span>}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <div style={{ fontSize: 15, fontWeight: 800, color: c.color }}>₹{fmt(e.amount)}</div>
                                                    <button onClick={() => delExp(e.id)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>✕</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                        {expView === "history" && (
                            <>
                                {Object.keys(grouped).length === 0 && <div style={{ textAlign: "center", padding: "36px 20px", color: "#334155", fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>No history yet.</div>}
                                {Object.entries(grouped).filter(([, exps]) => expFilter === "all" || exps.some(e => e.category === expFilter)).map(([date, exps]) => {
                                    const filtered = expFilter === "all" ? exps : exps.filter(e => e.category === expFilter);
                                    const dayTotal = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);
                                    return (
                                        <div key={date} style={{ marginBottom: 14 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                <span style={{ fontSize: 11, color: date === today ? "#f97316" : "#475569", fontWeight: 700 }}>{date === today ? "Today" : date}</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: "#f97316" }}>₹{fmt(dayTotal)}</span>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                {filtered.map(e => {
                                                    const c = getExpCat(e.category);
                                                    return (<div key={e.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 16 }}>{c.icon}</span><div><div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{e.description}</div><div style={{ fontSize: 9, color: "#334155" }}>{c.label}{e.note ? ` · ${e.note}` : ""}</div></div></div><div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>₹{fmt(e.amount)}</span><button onClick={() => delExp(e.id)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 12 }}>✕</button></div></div>);
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        {/* Custom expense categories management */}
                        {customExpCats.length > 0 && (
                            <div style={{ marginTop: 14, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "14px 16px" }}>
                                <div style={{ fontSize: 10, color: "#f97316", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>My Custom Expense Categories</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {customExpCats.map(c => (
                                        <button key={c.value} onClick={() => { setEditingCustomCat(c); setShowCustomCat("expense"); }}
                                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 20, border: `1px solid ${c.color}44`, background: c.color + "11", color: c.color, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                            {c.icon} {c.label} <span style={{ opacity: 0.6, fontSize: 10 }}>✏️</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button onClick={() => { setExpForm({ ...EMPTY_EXP_FORM }); setEditExpId(null); setShowExpForm(true); }} style={{ flex: 2, padding: 13, background: "linear-gradient(135deg,#ea580c,#c2410c)", color: "#fff", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Log Expense</button>
                            <button onClick={() => { setEditingCustomCat(null); setShowCustomCat("expense"); }} style={{ flex: 1, padding: 13, background: "#1e293b", color: "#f97316", border: "1px solid #f9731644", borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>＋ Category</button>
                        </div>
                    </>
                )}
            </div>

            {/* ══ LOAN FORM ══ */}
            {showLoanForm && (
                <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) { setShowLoanForm(false); setEditLoanId(null); } }}>
                    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "20px 20px 0 0", padding: "20px 18px 40px", width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", marginBottom: 18 }}>{editLoanId ? "Edit Loan / Goal" : "Add Loan / Goal"}</div>
                        <Sec title="Basic Info">
                            <label style={lbl}>Name</label><input placeholder="e.g. HDFC Home Loan" value={loanForm.name} onChange={e => setLoanForm(f => ({ ...f, name: e.target.value }))} style={inp} />
                            <label style={lbl}>Category</label>
                            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>{LOAN_CATS.map(c => (<button key={c.value} onClick={() => setLoanForm(f => ({ ...f, category: c.value }))} style={{ flex: 1, padding: "8px 2px", borderRadius: 9, border: `1px solid ${loanForm.category === c.value ? "#6366f1" : "#1e293b"}`, background: loanForm.category === c.value ? "#6366f122" : "#1e293b", color: loanForm.category === c.value ? "#818cf8" : "#64748b", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{c.icon} {c.label}</button>))}</div>
                            <label style={lbl}>Due Type</label>
                            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>{[{ v: "monthly", l: "🔁 Monthly" }, { v: "oneoff", l: "📅 One-time" }].map(t => (<button key={t.v} onClick={() => setLoanForm(f => ({ ...f, type: t.v }))} style={{ flex: 1, padding: "8px 4px", borderRadius: 9, border: `1px solid ${loanForm.type === t.v ? "#6366f1" : "#1e293b"}`, background: loanForm.type === t.v ? "#6366f122" : "#1e293b", color: loanForm.type === t.v ? "#818cf8" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.l}</button>))}</div>
                            {loanForm.type === "monthly" ? <><label style={lbl}>Due Day</label><input type="number" min="1" max="31" placeholder="5" value={loanForm.dayOfMonth} onChange={e => setLoanForm(f => ({ ...f, dayOfMonth: e.target.value }))} style={inp} /></> : <><label style={lbl}>Deadline</label><input type="date" value={loanForm.dueDate} onChange={e => setLoanForm(f => ({ ...f, dueDate: e.target.value }))} style={inp} /></>}
                        </Sec>
                        <Sec title="Loan Details" subtitle="optional — for full breakdown">
                            <label style={lbl}>Principal (₹)</label><input type="number" placeholder="e.g. 200000" value={loanForm.principalAmount} onChange={e => setLoanForm(f => ({ ...f, principalAmount: e.target.value }))} style={inp} />
                            <label style={lbl}>Annual Interest (%)</label><input type="number" placeholder="e.g. 12.5" value={loanForm.interestRate} onChange={e => setLoanForm(f => ({ ...f, interestRate: e.target.value }))} style={inp} />
                            <label style={lbl}>Tenure (months)</label><input type="number" placeholder="e.g. 24" value={loanForm.tenureMonths} onChange={e => setLoanForm(f => ({ ...f, tenureMonths: e.target.value }))} style={inp} />
                            {autoEMI && (<div style={{ background: "#6366f111", border: "1px solid #6366f133", borderRadius: 10, padding: "9px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 12, color: "#818cf8" }}>Auto-calculated EMI</span><span style={{ fontSize: 15, fontWeight: 800, color: "#00e676" }}>₹{fmt(autoEMI)}/mo</span></div>)}
                            <label style={lbl}>Monthly EMI (₹)</label><input type="number" placeholder={autoEMI ? `Auto ₹${fmt(autoEMI)}` : "e.g. 4500"} value={loanForm.emiAmount} onChange={e => setLoanForm(f => ({ ...f, emiAmount: e.target.value }))} style={inp} />
                            <label style={lbl}>EMIs Paid</label><input type="number" placeholder="0" value={loanForm.duePaid} onChange={e => setLoanForm(f => ({ ...f, duePaid: e.target.value }))} style={inp} />
                            <label style={lbl}>Start Date</label><input type="date" value={loanForm.loanStartDate} onChange={e => setLoanForm(f => ({ ...f, loanStartDate: e.target.value }))} style={inp} />
                        </Sec>
                        <div style={{ display: "flex", gap: 8 }}><button onClick={() => { setShowLoanForm(false); setEditLoanId(null); }} style={{ flex: 1, padding: 12, borderRadius: 11, border: "1px solid #1e293b", background: "#1e293b", color: "#64748b", fontWeight: 600, cursor: "pointer" }}>Cancel</button><button onClick={saveLoan} style={{ flex: 2, padding: 12, borderRadius: 11, border: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{editLoanId ? "Save" : "Add Loan"}</button></div>
                    </div>
                </div>
            )}

            {/* ══ INCOME FORM ══ */}
            {showIncomeForm && (
                <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) { setShowIncomeForm(false); setEditIncomeId(null); } }}>
                    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "20px 20px 0 0", padding: "20px 18px 40px", width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", marginBottom: 18 }}>{editIncomeId ? "Edit Income" : "Add Income Source"}</div>
                        <label style={lbl}>Name</label><input placeholder="e.g. HDFC Salary" value={incomeForm.name} onChange={e => setIncomeForm(f => ({ ...f, name: e.target.value }))} style={inp} />
                        <label style={lbl}>Type</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                            {INCOME_TYPES.map(it => (<button key={it.value} onClick={() => setIncomeForm(f => ({ ...f, incomeType: it.value }))} style={{ padding: "8px 4px", borderRadius: 9, border: `1px solid ${incomeForm.incomeType === it.value ? "#059669" : "#1e293b"}`, background: incomeForm.incomeType === it.value ? "#05966922" : "#1e293b", color: incomeForm.incomeType === it.value ? "#34d399" : "#64748b", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{it.icon}<br />{it.label}</button>))}
                            <button onClick={() => { setShowIncomeForm(false); setTimeout(() => { setEditingCustomCat(null); setShowCustomCat("income"); }, 100); }} style={{ padding: "8px 4px", borderRadius: 9, border: "1px dashed #059669", background: "#05966911", color: "#059669", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>＋<br />New</button>
                        </div>
                        <label style={lbl}>Amount (₹)</label><input type="number" placeholder="e.g. 50000" value={incomeForm.amount} onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))} style={inp} />
                        <label style={lbl}>Frequency</label>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>{FREQ_OPTIONS.map(fo => (<button key={fo.value} onClick={() => setIncomeForm(f => ({ ...f, frequency: fo.value }))} style={{ padding: "7px 12px", borderRadius: 9, border: `1px solid ${incomeForm.frequency === fo.value ? "#059669" : "#1e293b"}`, background: incomeForm.frequency === fo.value ? "#05966922" : "#1e293b", color: incomeForm.frequency === fo.value ? "#34d399" : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{fo.label}</button>))}</div>
                        {incomeForm.frequency === "monthly" && (<><label style={lbl}>Credit Day</label><input type="number" min="1" max="31" placeholder="1" value={incomeForm.creditDay} onChange={e => setIncomeForm(f => ({ ...f, creditDay: e.target.value }))} style={inp} /></>)}
                        <label style={lbl}>Notes</label><input placeholder="optional" value={incomeForm.notes} onChange={e => setIncomeForm(f => ({ ...f, notes: e.target.value }))} style={inp} />
                        <div style={{ display: "flex", gap: 8 }}><button onClick={() => { setShowIncomeForm(false); setEditIncomeId(null); }} style={{ flex: 1, padding: 12, borderRadius: 11, border: "1px solid #1e293b", background: "#1e293b", color: "#64748b", fontWeight: 600, cursor: "pointer" }}>Cancel</button><button onClick={saveIncome} style={{ flex: 2, padding: 12, borderRadius: 11, border: "none", background: "linear-gradient(135deg,#059669,#047857)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{editIncomeId ? "Save" : "Add Income"}</button></div>
                    </div>
                </div>
            )}

            {/* ══ EXPENSE FORM ══ */}
            {showExpForm && (
                <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) { setShowExpForm(false); setEditExpId(null); } }}>
                    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "20px 20px 0 0", padding: "20px 18px 40px", width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", marginBottom: 18 }}>Log Expense</div>
                        <label style={{ ...lbl, color: "#f97316" }}>What did you spend on?</label><input placeholder="e.g. Lunch, Uber, Groceries..." value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} style={inp} />
                        <label style={{ ...lbl, color: "#f97316" }}>Amount (₹)</label><input type="number" placeholder="e.g. 250" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} style={inp} />
                        <label style={{ ...lbl, color: "#f97316" }}>Category</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                            {EXPENSE_CATS.map(c => (<button key={c.value} onClick={() => setExpForm(f => ({ ...f, category: c.value }))} style={{ padding: "8px 4px", borderRadius: 9, border: `1px solid ${expForm.category === c.value ? c.color + "88" : "#1e293b"}`, background: expForm.category === c.value ? c.color + "22" : "#1e293b", color: expForm.category === c.value ? c.color : "#64748b", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{c.icon}<br />{c.label}</button>))}
                            <button onClick={() => { setShowExpForm(false); setTimeout(() => { setEditingCustomCat(null); setShowCustomCat("expense"); }, 100); }} style={{ padding: "8px 4px", borderRadius: 9, border: "1px dashed #f97316", background: "#f9731611", color: "#f97316", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>＋<br />New</button>
                        </div>
                        <label style={{ ...lbl, color: "#f97316" }}>Note (optional)</label><input placeholder="e.g. office lunch..." value={expForm.note} onChange={e => setExpForm(f => ({ ...f, note: e.target.value }))} style={inp} />
                        <div style={{ display: "flex", gap: 8 }}><button onClick={() => { setShowExpForm(false); setEditExpId(null); }} style={{ flex: 1, padding: 12, borderRadius: 11, border: "1px solid #1e293b", background: "#1e293b", color: "#64748b", fontWeight: 600, cursor: "pointer" }}>Cancel</button><button onClick={saveExp} style={{ flex: 2, padding: 12, borderRadius: 11, border: "none", background: "linear-gradient(135deg,#ea580c,#c2410c)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Log Expense</button></div>
                    </div>
                </div>
            )}

            {/* ══ CUSTOM CATEGORY MODAL ══ */}
            {showCustomCat && (
                <CustomCatModal
                    mode={showCustomCat}
                    existing={editingCustomCat}
                    onSave={showCustomCat === "income" ? saveCustomIncCat : saveCustomExpCat}
                    onDelete={showCustomCat === "income" ? delCustomIncCat : delCustomExpCat}
                    onClose={() => { setShowCustomCat(null); setEditingCustomCat(null); }}
                />
            )}
        </div>
    );
}
