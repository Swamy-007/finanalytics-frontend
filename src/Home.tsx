import React, { useState, useEffect, useCallback, useRef, Component } from "react";
import axios from "axios";
import Dashboard from "./Dashboard";
import { useTheme } from "./ThemeContext.ts";

const apiUrl = (import.meta.env.VITE_API_URL as string) || "";

class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: string },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode; fallback?: string }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Render error caught:', error.message, '\nComponent stack:', info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12,
          padding: "32px 24px", textAlign: "center", margin: "24px 0"
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 600, color: "#991B1B", marginBottom: 6 }}>
            {this.props.fallback ?? "Something went wrong rendering this section."}
          </div>
          <div style={{ fontSize: 12, color: "#B91C1C" }}>{this.state.errorMessage}</div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, errorMessage: "" })}
            style={{
              marginTop: 16, background: "#E24B4B", color: "#fff", border: "none",
              borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13
            }}
          >Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

type User = {
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
  exp: number;
  iat: number;
  token?: string;
};

interface HomeProps {
  user: User;
  onLogout?: () => void;
}

// Data models
interface FamilyMember {
  name: string;
  relationship: string;
  ageRange: string;
}

interface Dependent {
  name: string;
  relationship: string;
  ageRange: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  ageRange: string;
  familyMembers: FamilyMember[];
  dependents: Dependent[];
}

interface Asset {
  name: string;
  type: string;
  value: number;
}

interface Liability {
  name: string;
  type: string;
  value: number;
  monthlyPayment: number;
}

interface Expenditure {
  type: "credit_card" | "insurance" | "other";
  description: string;
  monthlyAmount: number;
}

interface Saving {
  type: "401k" | "ira" | "emergency" | "investment" | "other";
  description: string;
  monthlyContribution: number;
}

interface FinancialData {
  assets: Asset[];
  liabilities: Liability[];
  primaryYearlyIncome: number;
  familyYearlyIncome: number;
  expenditures: Expenditure[];
  savings: Saving[];
}

interface Product {
  id: string;
  name: string;
  type: "loan" | "insurance" | "investment" | "savings";
  provider: string;
  description: string;
  benefits: string[];
}

interface Case {
  id: string;
  productId: string;
  status: "Recommended" | "Accepted" | "Declined" | "Applied";
  reasoning: string;
  applicationDetails: Record<string, unknown> | null;
  updatedAt: string;
  product?: Product;
}

interface AIAnalysis {
  score: number;
  debtRatio: number;
  savingsRatio: number;
  gaps: string[];
  advice: string;
  updatedAt: string;
}

interface AdminUser {
  email: string;
  name: string;
  hasFinancialData: boolean;
  casesCount: number;
  healthScore: number | null;
}

interface AdminAnalytics {
  totalUsers: number;
  averageScore: number;
  totalProducts: number;
  casesByStatus: {
    Recommended: number;
    Accepted: number;
    Declined: number;
    Applied: number;
  };
}

const Home: React.FC<HomeProps> = ({ user, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("health");

  // State profiles
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
    email: user.email,
    ageRange: "26-35",
    familyMembers: [],
    dependents: []
  });

  const [financialData, setFinancialData] = useState<FinancialData>({
    assets: [],
    liabilities: [],
    primaryYearlyIncome: 0,
    familyYearlyIncome: 0,
    expenditures: [{ type: "credit_card", description: "", monthlyAmount: 0 }],
    savings: [{ type: "401k", description: "", monthlyContribution: 0 }],
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // For Adding Assets/Liabilities/Family members dynamically in forms
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetType, setNewAssetType] = useState("savings");
  const [newAssetValue, setNewAssetValue] = useState(0);

  const [newLiabilityName, setNewLiabilityName] = useState("");
  const [newLiabilityType, setNewLiabilityType] = useState("loan");
  const [newLiabilityValue, setNewLiabilityValue] = useState(0);
  const [newLiabilityPayment, setNewLiabilityPayment] = useState(0);

  const [newFamilyName, setNewFamilyName] = useState("");
  const [newFamilyRel, setNewFamilyRel] = useState("spouse");
  const [newFamilyAge, setNewFamilyAge] = useState("26-35");

  const [newDepName, setNewDepName] = useState("");
  const [newDepRel, setNewDepRel] = useState("mother");
  const [newDepAge, setNewDepAge] = useState("51-65");

  // Case Application workflow states
  const [applyingCase, setApplyingCase] = useState<Case | null>(null);
  const [appIncome, setAppIncome] = useState<number>(0);
  const [appEmployment, setAppEmployment] = useState<string>("Employed");
  const [appSSN, setAppSSN] = useState<string>("");
  const [appAmount, setAppAmount] = useState<number>(0);
  const [appTerms, setAppTerms] = useState<boolean>(false);
  const [submittingApp, setSubmittingApp] = useState<boolean>(false);

  // Admin states
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState<AdminAnalytics | null>(null);

  // Navigation & wizard states
  const [showFinancialMenu, setShowFinancialMenu] = useState<boolean>(false);
  const [evaluateMode, setEvaluateMode] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [refreshingCases, setRefreshingCases] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const closeMobileNav = () => setMobileNavOpen(false);
  const [evaluateStep, setEvaluateStep] = useState<number>(1);

  // Mutable ref holds the active auth token. Initialized with whatever token
  // the user logged in with (Google ID token or session token). Swapped to a
  // backend-issued session token after auth/sync responds, so Google users
  // never hit a 1-hour token-expiry 401 on subsequent calls.
  const authTokenRef = useRef<string>(user.token ?? "");

  // Sync ref when user.token changes externally (e.g. parent re-login).
  useEffect(() => { authTokenRef.current = user.token ?? ""; }, [user.token]);

  // Stable callback — reads from ref at call time, never causes re-renders.
  const getAxiosConfig = useCallback(() => ({
    headers: { Authorization: `Bearer ${authTokenRef.current}` },
  }), []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get<UserProfile | null>(`${apiUrl}/api/users/profile`, getAxiosConfig());
      if (res.data) setProfile(res.data);
    } catch (err) {
      console.error('[fetchProfile] Failed to fetch user profile:', err);
    }
  }, [getAxiosConfig]);

  const fetchFinancialData = useCallback(async () => {
    try {
      const res = await axios.get<FinancialData | null>(`${apiUrl}/api/financial-data`, getAxiosConfig());
      if (res.data) {
        if (!Array.isArray(res.data.expenditures)) {
          console.warn('[fetchFinancialData] expenditures field missing or not an array in server response — keeping defaults. Raw data:', res.data);
        }
        if (!Array.isArray(res.data.savings)) {
          console.warn('[fetchFinancialData] savings field missing or not an array in server response — keeping defaults. Raw data:', res.data);
        }
        setFinancialData(prev => ({
          ...prev,
          ...res.data,
          expenditures: Array.isArray(res.data!.expenditures) && res.data!.expenditures.length > 0
            ? res.data!.expenditures
            : prev.expenditures,
          savings: Array.isArray(res.data!.savings) && res.data!.savings.length > 0
            ? res.data!.savings
            : prev.savings,
        }));
      }
    } catch (err) {
      console.error('[fetchFinancialData] Failed to fetch financial data:', err);
    }
  }, [getAxiosConfig]);

  const fetchCases = useCallback(async () => {
    try {
      const res = await axios.get<Case[]>(`${apiUrl}/api/cases`, getAxiosConfig());
      setCases(res.data);
    } catch (err) {
      console.error('[fetchCases] Failed to fetch cases:', err);
    }
  }, [getAxiosConfig]);

  const handleRefreshCases = async () => {
    console.log('[Refresh Offers] User clicked Refresh Offers at', new Date().toISOString());
    setRefreshingCases(true);
    setError(null);
    try {
      const res = await axios.get<Case[]>(`${apiUrl}/api/cases`, getAxiosConfig());
      setCases(res.data);
      console.log('[Refresh Offers] Fetched', res.data.length, 'case(s)');
    } catch (err) {
      console.error('[Refresh Offers] Failed to refresh cases:', err);
      setError(axios.isAxiosError(err) ? err.response?.data?.error || 'Failed to refresh offers.' : 'Failed to refresh offers.');
    } finally {
      setRefreshingCases(false);
    }
  };

  // Load user data on mount.
  // auth/sync is awaited FIRST so the session token is swapped before data fetches run.
  // Google ID tokens expire in 1 hour; waiting for the swap means data calls always
  // use the 7-day session token instead of the short-lived Google token.
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.post<{ ok: boolean; isAdmin?: boolean; sessionToken?: string }>(
          `${apiUrl}/api/auth/sync`, {}, getAxiosConfig()
        );
        if (res.data.sessionToken) authTokenRef.current = res.data.sessionToken;
        if (res.data.isAdmin) setIsAdmin(true);
      } catch (err) {
        console.warn("[auth/sync] login sync failed (non-fatal):", axios.isAxiosError(err) ? err.message : err);
      }
      await fetchProfile();
      await fetchFinancialData();
      await fetchCases();
    })();
  }, [fetchProfile, fetchFinancialData, fetchCases, getAxiosConfig]);

  useEffect(() => {
    if (activeTab !== "admin") return;
    (async () => {
      try {
        const usersRes = await axios.get<AdminUser[]>(`${apiUrl}/api/admin/users`, getAxiosConfig());
        const analyticsRes = await axios.get<AdminAnalytics>(`${apiUrl}/api/admin/analytics`, getAxiosConfig());
        setAdminUsers(usersRes.data);
        setAdminAnalytics(analyticsRes.data);
      } catch (err) {
        console.error("Error fetching admin data", err);
      }
    })();
  }, [activeTab, getAxiosConfig]);

  // Handle Saves
  const handleSaveProfile = async (e?: { preventDefault(): void }): Promise<boolean> => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await axios.put(`${apiUrl}/api/users/profile`, profile, getAxiosConfig());
      setProfile(res.data);
      setSuccessMsg("Personal profile saved successfully!");
      return true;
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || "Failed to save profile" : "Failed to save profile");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFinancial = async (e?: { preventDefault(): void }): Promise<boolean> => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await axios.post(`${apiUrl}/api/financial-data`, financialData, getAxiosConfig());
      setFinancialData(res.data);
      setSuccessMsg("Financial profile saved successfully!");
      return true;
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || "Failed to save financial data" : "Failed to save financial data");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Run AI Financial Audit
  const handleRunAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await axios.get(`${apiUrl}/api/analysis`, getAxiosConfig());
      if (res.data.aiAnalysis) {
        setAiAnalysis(res.data.aiAnalysis);
      }
      if (res.data.cases) {
        fetchCases();
      }
      setSuccessMsg("AI Audit completed successfully! New recommendations generated.");
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || "AI Analysis failed. Make sure your profile and financial inputs are saved." : "AI Analysis failed. Make sure your profile and financial inputs are saved.");
    } finally {
      setLoading(false);
    }
  }, [getAxiosConfig, fetchCases]);

  // Update Case Status
  const handleUpdateCaseStatus = async (caseId: string, status: "Accepted" | "Declined") => {
    try {
      await axios.put(`${apiUrl}/api/cases/${caseId}/status`, { status }, getAxiosConfig());
      setCases(prev => prev.map(c => c.id === caseId ? { ...c, status } : c));
      setSuccessMsg(`Product recommendation offer ${status.toLowerCase()}!`);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || "Failed to update offer status" : "Failed to update offer status");
    }
  };

  // Submit product application
  const handleSubmitApplication = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!applyingCase) return;
    if (!appTerms) {
      setError("You must accept the terms & conditions.");
      return;
    }

    setSubmittingApp(true);
    setError(null);
    try {
      const res = await axios.post(`${apiUrl}/api/applications`, {
        caseId: applyingCase.id,
        applicationDetails: {
          annualIncome: appIncome,
          employmentStatus: appEmployment,
          nationalId: appSSN,
          requestedAmount: appAmount
        }
      }, getAxiosConfig());

      // Update local case state
      setCases(prev => prev.map(c => c.id === applyingCase.id ? res.data : c));
      setSuccessMsg(`Application submitted successfully! Ref: ${res.data.applicationDetails.referenceNumber}`);
      setApplyingCase(null); // Close modal
      // Reset form
      setAppIncome(0);
      setAppSSN("");
      setAppAmount(0);
      setAppTerms(false);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || "Failed to submit application" : "Failed to submit application");
    } finally {
      setSubmittingApp(false);
    }
  };

  // Dynamic Array Add/Remove Helpers
  const addAsset = () => {
    if (!newAssetName.trim() || newAssetValue <= 0) return;
    setFinancialData(prev => ({
      ...prev,
      assets: [...prev.assets, { name: newAssetName, type: newAssetType, value: newAssetValue }]
    }));
    setNewAssetName("");
    setNewAssetValue(0);
  };

  const removeAsset = (index: number) => {
    setFinancialData(prev => ({
      ...prev,
      assets: prev.assets.filter((_, i) => i !== index)
    }));
  };

  const addLiability = () => {
    if (!newLiabilityName.trim() || newLiabilityValue <= 0) return;
    setFinancialData(prev => ({
      ...prev,
      liabilities: [...prev.liabilities, {
        name: newLiabilityName,
        type: newLiabilityType,
        value: newLiabilityValue,
        monthlyPayment: newLiabilityPayment
      }]
    }));
    setNewLiabilityName("");
    setNewLiabilityValue(0);
    setNewLiabilityPayment(0);
  };

  const removeLiability = (index: number) => {
    setFinancialData(prev => ({
      ...prev,
      liabilities: prev.liabilities.filter((_, i) => i !== index)
    }));
  };

  const addExpenditure = () => {
    setFinancialData(prev => ({
      ...prev,
      expenditures: [...prev.expenditures, { type: "credit_card", description: "", monthlyAmount: 0 }]
    }));
  };

  const removeExpenditure = (index: number) => {
    setFinancialData(prev => ({
      ...prev,
      expenditures: prev.expenditures.filter((_, i) => i !== index)
    }));
  };

  const updateExpenditure = (index: number, field: keyof Expenditure, value: string | number) => {
    setFinancialData(prev => ({
      ...prev,
      expenditures: prev.expenditures.map((e, i) => i === index ? { ...e, [field]: value } : e)
    }));
  };

  const addSaving = () => {
    setFinancialData(prev => ({
      ...prev,
      savings: [...prev.savings, { type: "401k", description: "", monthlyContribution: 0 }]
    }));
  };

  const removeSaving = (index: number) => {
    setFinancialData(prev => ({
      ...prev,
      savings: prev.savings.filter((_, i) => i !== index)
    }));
  };

  const updateSaving = (index: number, field: keyof Saving, value: string | number) => {
    setFinancialData(prev => ({
      ...prev,
      savings: prev.savings.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const addFamilyMember = () => {
    if (!newFamilyName.trim()) return;
    setProfile(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, { name: newFamilyName, relationship: newFamilyRel, ageRange: newFamilyAge }]
    }));
    setNewFamilyName("");
  };

  const removeFamilyMember = (index: number) => {
    setProfile(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  const addDependent = () => {
    if (!newDepName.trim()) return;
    setProfile(prev => ({
      ...prev,
      dependents: [...prev.dependents, { name: newDepName, relationship: newDepRel, ageRange: newDepAge }]
    }));
    setNewDepName("");
  };

  const removeDependent = (index: number) => {
    setProfile(prev => ({
      ...prev,
      dependents: prev.dependents.filter((_, i) => i !== index)
    }));
  };

  const startEvaluateFlow = () => {
    setEvaluateMode(true);
    setEvaluateStep(1);
    setActiveTab("profile");
    setShowFinancialMenu(false);
  };

  const exitEvaluateFlow = () => {
    setEvaluateMode(false);
    setEvaluateStep(1);
    setActiveTab("health");
  };

  const nextEvaluateStep = async () => {
    if (evaluateStep === 1) {
      const ok = await handleSaveProfile();
      if (!ok) return;
      setEvaluateStep(2); setActiveTab("financial");
    } else if (evaluateStep === 2) {
      const ok = await handleSaveFinancial();
      if (!ok) return;
      setEvaluateStep(3); setActiveTab("health");
    } else if (evaluateStep === 3) {
      setEvaluateStep(4); setActiveTab("recommendations");
    } else {
      exitEvaluateFlow();
    }
  };

  const prevEvaluateStep = () => {
    if (evaluateStep === 2) { setEvaluateStep(1); setActiveTab("profile"); }
    else if (evaluateStep === 3) { setEvaluateStep(2); setActiveTab("financial"); }
    else if (evaluateStep === 4) { setEvaluateStep(3); setActiveTab("health"); }
  };

  // Helper color for score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#2EAF7D"; // Green
    if (score >= 50) return "#FFAA00"; // Orange
    return "#E24B4A"; // Red
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      background: "var(--fw-bg-page)",
      color: "var(--fw-text-primary)",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {/* TOP NAVBAR */}
      <nav className="finwise-nav" style={{
        height: 64,
        background: "var(--fw-bg-nav)",
        borderBottom: "1px solid var(--fw-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexShrink: 0
      }}>
        {/* Logo */}
        <div className="finwise-nav-logo" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "linear-gradient(135deg, #6C63FF 0%, #4D33FF 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: 18, boxShadow: "0 0 15px rgba(108, 99, 255, 0.4)"
          }}>F</div>
          <div>
            <span style={{
              fontSize: 17, fontWeight: 700,
              background: "linear-gradient(to right, #4338CA, #6C63FF)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>Financial AI Solutions</span>
            <div style={{ fontSize: 10, color: "var(--fw-text-muted)", fontWeight: 500 }}>ADVISORY PORTAL</div>
          </div>
        </div>

        {/* Nav Links — hidden on mobile, visible on desktop */}
        <div className={`finwise-nav-links${mobileNavOpen ? " open" : ""}`}>
          <button
            className={`finwise-nav-btn-item${activeTab === "health" && !evaluateMode ? " active" : ""}`}
            onClick={() => { setActiveTab("health"); setEvaluateMode(false); setShowFinancialMenu(false); closeMobileNav(); }}
          >Home</button>

          <div
            className="finwise-nav-dropdown-wrap"
            onMouseEnter={() => setShowFinancialMenu(true)}
            onMouseLeave={() => setShowFinancialMenu(false)}
          >
            <button className={`finwise-nav-btn-item${evaluateMode || activeTab === "upload" || activeTab === "stocks" ? " active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Financial AI Solutions ▾
            </button>
            {(showFinancialMenu || mobileNavOpen) && (
              <div className="finwise-nav-submenu">
                <button className="finwise-nav-submenu-btn" onClick={() => { startEvaluateFlow(); closeMobileNav(); }}>📊 Evaluate Financials</button>
                <button className="finwise-nav-submenu-btn" onClick={() => { setActiveTab("upload"); setEvaluateMode(false); setShowFinancialMenu(false); closeMobileNav(); }}>💳 Credit Card Analyzer</button>
                <button className="finwise-nav-submenu-btn" onClick={() => { setActiveTab("stocks"); setEvaluateMode(false); setShowFinancialMenu(false); closeMobileNav(); }}>📈 Your Stocks Analyzer</button>
              </div>
            )}
          </div>

          <button
            className={`finwise-nav-btn-item${activeTab === "contact" ? " active" : ""}`}
            onClick={() => { setActiveTab("contact"); setEvaluateMode(false); setShowFinancialMenu(false); closeMobileNav(); }}
          >Contact Us</button>

          {/* Mobile-only: show user controls inside the menu */}
          <div className="finwise-mobile-user-row">
            <button onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"} style={{
              background: "transparent", border: "1px solid var(--fw-border)", borderRadius: 6,
              padding: "5px 9px", color: "var(--fw-text-secondary)", fontSize: 15, cursor: "pointer"
            }}>{theme === "dark" ? "☀️" : "🌙"}</button>
            {isAdmin && (
              <button
                className={`finwise-nav-admin-btn${activeTab === "admin" ? " active" : ""}`}
                onClick={() => { setActiveTab("admin"); setEvaluateMode(false); setShowFinancialMenu(false); closeMobileNav(); }}
                title="Admin Panel">🛡️</button>
            )}
            <button onClick={onLogout} style={{
              background: "#FFF1F2", border: "1px solid #FECACA", borderRadius: 6,
              padding: "6px 14px", color: "#E24B4B", fontSize: 12, fontWeight: 500, cursor: "pointer"
            }}>Logout</button>
          </div>
        </div>

        {/* Right side: user section (desktop) + hamburger (mobile) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Desktop user controls */}
          <div className="finwise-user-section" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={toggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                background: "transparent", border: "1px solid var(--fw-border)", borderRadius: 6,
                padding: "5px 9px", color: "var(--fw-text-secondary)", fontSize: 15, cursor: "pointer", lineHeight: 1
              }}>{theme === "dark" ? "☀️" : "🌙"}</button>
            {isAdmin && (
              <button
                data-testid="desktop-admin-btn"
                className={`finwise-nav-admin-btn${activeTab === "admin" ? " active" : ""}`}
                onClick={() => { setActiveTab("admin"); setEvaluateMode(false); setShowFinancialMenu(false); }}
                title="Admin Panel">🛡️</button>
            )}
            {user.picture
              ? <img src={user.picture} alt={user.name} style={{ width: 32, height: 32, borderRadius: "50%" }} />
              : <div style={{
                  width: 32, height: 32, borderRadius: "50%", background: "#6C63FF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: "bold"
                }}>{(user.name ?? "U").substring(0, 1)}</div>
            }
            <span className="finwise-user-name" style={{ fontSize: 13, color: "var(--fw-text-secondary)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name}
            </span>
            <button data-testid="desktop-logout-btn" onClick={onLogout} style={{
              background: "#FFF1F2", border: "1px solid #FECACA", borderRadius: 6,
              padding: "6px 14px", color: "#E24B4B", fontSize: 12, fontWeight: 500, cursor: "pointer"
            }}>Logout</button>
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="finwise-nav-hamburger"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(prev => !prev)}
            style={{
              display: "none", background: "none", border: "1px solid var(--fw-border)",
              borderRadius: 6, padding: "6px 10px", color: "var(--fw-text-secondary)",
              fontSize: 20, lineHeight: 1, cursor: "pointer"
            }}
          >{mobileNavOpen ? "✕" : "☰"}</button>
        </div>
      </nav>

      {/* EVALUATE FINANCIALS WIZARD STEPPER */}
      {evaluateMode && (
        <div className="finwise-stepper" style={{
          background: "var(--fw-bg-surface)",
          borderBottom: "1px solid var(--fw-border)",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0
        }}>
          <div className="finwise-stepper-steps" style={{ display: "flex", alignItems: "center" }}>
            {([
              { step: 1, label: "Personal Profile" },
              { step: 2, label: "Financial Data" },
              { step: 3, label: "AI Analysis" },
              { step: 4, label: "Recommendations" }
            ] as { step: number; label: string }[]).map(({ step, label }, idx) => (
              <React.Fragment key={step}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: evaluateStep >= step ? "linear-gradient(135deg, #6C63FF, #4D33FF)" : "#E2E8F0",
                    border: evaluateStep === step ? "2px solid #A5A1FF" : "2px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: evaluateStep >= step ? "#fff" : "var(--fw-text-muted)"
                  }}>
                    {evaluateStep > step ? "✓" : step}
                  </div>
                  <span className="finwise-stepper-label" style={{
                    fontSize: 13,
                    fontWeight: evaluateStep === step ? 600 : 400,
                    color: evaluateStep === step ? "#A5A1FF" : evaluateStep > step ? "#6A7A8A" : "#5F5F88"
                  }}>
                    {label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className="finwise-stepper-connector" style={{ width: 48, height: 1, background: evaluateStep > step ? "#6C63FF" : "var(--fw-border)", margin: "0 12px" }} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="finwise-stepper-actions" style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={exitEvaluateFlow}
              style={{
                background: "transparent",
                border: "1px solid #CBD5E1",
                borderRadius: 6,
                padding: "6px 14px",
                color: "var(--fw-text-secondary)",
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              Exit Wizard
            </button>
            {evaluateStep > 1 && (
              <button
                type="button"
                onClick={prevEvaluateStep}
                style={{
                  background: "var(--fw-nav-active-bg)",
                  border: "1px solid #C7D2FE",
                  borderRadius: 6,
                  padding: "6px 14px",
                  color: "#A5A1FF",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                ← Back
              </button>
            )}
            {evaluateStep < 4 ? (
              <button
                type="button"
                onClick={nextEvaluateStep}
                style={{
                  background: "linear-gradient(90deg, #6C63FF, #4D33FF)",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={exitEvaluateFlow}
                style={{
                  background: "linear-gradient(90deg, #2EAF7D, #1A8A58)",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Finish ✓
              </button>
            )}
          </div>
        </div>
      )}

      {/* STATUS ALERTS */}
      {(successMsg || error) && (
        <div className="finwise-alerts" style={{ padding: "12px 32px 0", display: "flex", gap: 12 }}>
          {successMsg && (
            <div style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#46C670",
              fontSize: 13,
              fontWeight: 500
            }}>
              ✓ {successMsg}
            </div>
          )}
          {error && (
            <div style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#E24B4B",
              fontSize: 13,
              fontWeight: 500
            }}>
              ⚠ {error}
            </div>
          )}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="finwise-page-header" style={{
        padding: "20px 32px 0",
        borderBottom: "1px solid var(--fw-border)"
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>
          {activeTab === "health" && "Financial AI Audit Dashboard"}
          {activeTab === "recommendations" && "Personalized Financial Product Offers"}
          {activeTab === "profile" && "Edit Personal Profile"}
          {activeTab === "financial" && "Asset & Liability Manager"}
          {activeTab === "upload" && "Credit Card Statement Analysis"}
          {activeTab === "stocks" && "Your Stocks Analyzer"}
          {activeTab === "contact" && "Contact Us"}
          {activeTab === "admin" && "Administrative System Analytics"}
        </h2>
      </div>

      {/* PAGE CONTENT */}
      <div className="finwise-content" style={{ flex: 1, padding: 32, overflowY: "auto" }}>

          {/* TAB 1: AI FINANCIAL HEALTH ANALYSIS */}
          {activeTab === "health" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{
                background: "var(--fw-bg-card)",
                borderRadius: 16,
                padding: 28,
                border: "1px solid var(--fw-border)"
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>AI Advisory Engine</h3>
                    <p style={{ color: "var(--fw-text-secondary)", fontSize: 14, margin: 0, maxWidth: 520 }}>
                      {evaluateMode
                        ? "Make sure your profile and financial data are saved, then run the AI audit to calculate your health score, ratios, and product recommendations."
                        : "Your AI financial health audit results are shown below. Use the Financial Evaluation wizard to run a new analysis."}
                    </p>
                  </div>
                  {evaluateMode && (
                    <button
                      onClick={handleRunAnalysis}
                      disabled={loading}
                      style={{
                        background: loading ? "var(--fw-bg-surface)" : "linear-gradient(135deg, #6C63FF, #4D33FF)",
                        color: loading ? "var(--fw-text-muted)" : "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "12px 24px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      }}
                    >
                      {loading ? (
                        <><span className="fw-spinner" /> Analysing…</>
                      ) : (
                        <>⚡ Run AI Analysis</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {aiAnalysis ? (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 24
                }}>
                  {/* Health Score Gauge */}
                  <div style={{
                    background: "var(--fw-bg-card)",
                    borderRadius: 14,
                    padding: 24,
                    border: "1px solid var(--fw-border)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 280
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fw-text-secondary)", marginBottom: 20 }}>Financial Health Score</div>
                    <div style={{
                      width: 140,
                      height: 140,
                      borderRadius: "50%",
                      border: `10px solid var(--fw-score-circle)`,
                      borderTop: `10px solid ${getScoreColor(aiAnalysis.score)}`,
                      borderRight: `10px solid ${aiAnalysis.score >= 50 ? getScoreColor(aiAnalysis.score) : 'var(--fw-score-circle)'}`,
                      borderBottom: `10px solid ${aiAnalysis.score >= 80 ? getScoreColor(aiAnalysis.score) : 'var(--fw-score-circle)'}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      transform: "rotate(-45deg)",
                      marginBottom: 20
                    }}>
                      <span style={{
                        fontSize: 36,
                        fontWeight: 700,
                        color: "var(--fw-text-primary)",
                        transform: "rotate(45deg)"
                      }}>
                        {aiAnalysis.score}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--fw-text-muted)", transform: "rotate(45deg)", fontWeight: 600 }}>MAX 100</span>
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: getScoreColor(aiAnalysis.score),
                      background: `${getScoreColor(aiAnalysis.score)}15`,
                      padding: "6px 16px",
                      borderRadius: 20
                    }}>
                      {aiAnalysis.score >= 80 ? "EXCELLENT" : aiAnalysis.score >= 50 ? "AVERAGE" : "IMPROVEMENT NEEDED"}
                    </div>
                  </div>

                  {/* Ratios & Key Stats */}
                  <div style={{
                    background: "var(--fw-bg-card)",
                    borderRadius: 14,
                    padding: 24,
                    border: "1px solid var(--fw-border)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px" }}>Core Ratios</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: "var(--fw-text-secondary)" }}>Debt-to-Assets Ratio</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fw-text-primary)" }}>{aiAnalysis.debtRatio}%</span>
                          </div>
                          <div style={{ height: 6, background: "var(--fw-border)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(aiAnalysis.debtRatio, 100)}%`, height: "100%", background: aiAnalysis.debtRatio > 40 ? "#E24B4B" : "#2EAF7D" }} />
                          </div>
                          <span style={{ fontSize: 11, color: "var(--fw-text-muted)" }}>Ideally below 35%</span>
                        </div>

                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: "var(--fw-text-secondary)" }}>Savings Ratio</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fw-text-primary)" }}>{aiAnalysis.savingsRatio}%</span>
                          </div>
                          <div style={{ height: 6, background: "var(--fw-border)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(aiAnalysis.savingsRatio, 100)}%`, height: "100%", background: aiAnalysis.savingsRatio < 15 ? "#FFAA00" : "#2EAF7D" }} />
                          </div>
                          <span style={{ fontSize: 11, color: "var(--fw-text-muted)" }}>Ideally 20% or higher</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--fw-text-muted)", marginTop: 20 }}>
                      Last Audit: {new Date(aiAnalysis.updatedAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Identified Gaps list */}
                  <div style={{
                    background: "var(--fw-bg-card)",
                    borderRadius: 14,
                    padding: 24,
                    border: "1px solid var(--fw-border)"
                  }}>
                    <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>🚨 Gaps Identified</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {aiAnalysis.gaps.map((gap, index) => (
                        <div key={index} style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          background: "#FEF2F2",
                          border: "1px solid #FECACA",
                          borderRadius: 8,
                          padding: 12
                        }}>
                          <span style={{ color: "#E24B4B" }}>⚠</span>
                          <span style={{ fontSize: 13, color: "#991B1B" }}>{gap}</span>
                        </div>
                      ))}
                      {aiAnalysis.gaps.length === 0 && (
                        <div style={{ color: "var(--fw-text-secondary)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                          No specific gaps identified. Good job!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: "var(--fw-bg-card)",
                  borderRadius: 14,
                  padding: "60px 20px",
                  border: "1px solid var(--fw-border)",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
                  <h4 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>No AI Audit Run Yet</h4>
                  <p style={{ color: "var(--fw-text-secondary)", fontSize: 14, margin: "0 auto 20px", maxWidth: 450 }}>
                    Please fill out your personal profile and financial listings, then click the button above to generate a complete financial health report.
                  </p>
                </div>
              )}

              {aiAnalysis && (
                <div style={{
                  background: "var(--fw-bg-card)",
                  borderRadius: 14,
                  padding: 28,
                  border: "1px solid var(--fw-border)"
                }}>
                  <h4 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>Advisor Recommendations & Strategy</h4>
                  <div style={{
                    fontSize: 14,
                    color: "var(--fw-text-secondary)",
                    lineHeight: "1.6",
                    whiteSpace: "pre-line",
                    background: "var(--fw-bg-surface)",
                    borderRadius: 10,
                    padding: 20,
                    border: "1px solid var(--fw-border)"
                  }}>
                    {aiAnalysis.advice}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCT RECOMMENDATIONS & CASES */}
          {activeTab === "recommendations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{
                background: "var(--fw-bg-surface)",
                borderRadius: 12,
                padding: "16px 20px",
                border: "1px solid var(--fw-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <p style={{ margin: 0, color: "var(--fw-text-secondary)", fontSize: 14 }}>
                  Case Lifecycle: <strong>Recommended → Accepted → Declined → Applied</strong>
                </p>
                <button
                  onClick={handleRefreshCases}
                  disabled={refreshingCases}
                  style={{
                    background: "transparent",
                    color: "#A5A1FF",
                    border: "1px solid #A5A1FF",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: refreshingCases ? "not-allowed" : "pointer",
                    opacity: refreshingCases ? 0.6 : 1
                  }}
                >
                  {refreshingCases ? "Refreshing…" : "Refresh Offers"}
                </button>
              </div>

              {cases.length === 0 ? (
                <div style={{
                  background: "var(--fw-bg-card)",
                  borderRadius: 14,
                  padding: "60px 20px",
                  border: "1px solid var(--fw-border)",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                  <h4 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>No Offers Matching Your Profile</h4>
                  <p style={{ color: "var(--fw-text-secondary)", fontSize: 14, margin: 0 }}>
                    Run the ⚡ <strong>AI Audit</strong> on the Financial AI Audit tab to auto-generate personalized product recommendations.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
                  gap: 24
                }}>
                  {cases.map((c) => {
                    const prod = c.product;
                    if (!prod) return null;
                    return (
                      <div key={c.id} style={{
                        background: "var(--fw-bg-card)",
                        borderRadius: 14,
                        border: "1px solid var(--fw-border)",
                        padding: 24,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative"
                      }}>
                        {/* Status Badge */}
                        <div style={{
                          position: "absolute",
                          top: 20,
                          right: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: 20,
                          background:
                            c.status === "Applied" ? "#F0FDF4" :
                            c.status === "Accepted" ? "#EFF6FF" :
                            c.status === "Declined" ? "#FEF2F2" : "#FFFBEB",
                          color:
                            c.status === "Applied" ? "#16A34A" :
                            c.status === "Accepted" ? "#2563EB" :
                            c.status === "Declined" ? "#6B7280" : "#B45309",
                          border: `1px solid ${
                            c.status === "Applied" ? "#BBF7D0" :
                            c.status === "Accepted" ? "#93C5FD" :
                            c.status === "Declined" ? "#FECACA" : "#FDE68A"
                          }`
                        }}>
                          {c.status.toUpperCase()}
                        </div>

                        <div>
                          {/* Title */}
                          <div style={{ fontSize: 11, color: "#6C63FF", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                            {prod.type} • {prod.provider}
                          </div>
                          <h4 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 10px", color: "var(--fw-text-primary)" }}>{prod.name}</h4>
                          <p style={{ color: "var(--fw-text-secondary)", fontSize: 13, margin: "0 0 16px", lineHeight: "1.4" }}>
                            {prod.description}
                          </p>

                          {/* Benefits tags */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                            {prod.benefits.map((b, idx) => (
                              <span key={idx} style={{
                                fontSize: 11,
                                background: "var(--fw-nav-active-bg)",
                                color: "var(--fw-text-secondary)",
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: "1px solid #C7D2FE"
                              }}>
                                ✓ {b}
                              </span>
                            ))}
                          </div>

                          {/* AI Recommendation Reasoning */}
                          <div style={{
                            background: "var(--fw-nav-active-bg)",
                            borderRadius: 8,
                            padding: 14,
                            borderLeft: "3px solid #6C63FF",
                            fontSize: 12,
                            color: "var(--fw-text-secondary)",
                            lineHeight: "1.5",
                            marginBottom: 20,
                            fontStyle: "italic"
                          }}>
                            <strong>AI Reasoning:</strong> {c.reasoning}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {c.status === "Recommended" && (
                            <div style={{ display: "flex", gap: 10 }}>
                              <button
                                onClick={() => handleUpdateCaseStatus(c.id, "Accepted")}
                                style={{
                                  flex: 1,
                                  background: "linear-gradient(90deg, #6C63FF 0%, #4D33FF 100%)",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 8,
                                  padding: "11px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Accept Offer
                              </button>
                              <button
                                onClick={() => handleUpdateCaseStatus(c.id, "Declined")}
                                style={{
                                  background: "#FEF2F2",
                                  color: "#E24B4B",
                                  border: "1px solid #FECACA",
                                  borderRadius: 8,
                                  padding: "11px 16px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Decline
                              </button>
                            </div>
                          )}

                          {c.status === "Accepted" && (
                            <div style={{ display: "flex", gap: 10 }}>
                              <button
                                onClick={() => {
                                  setApplyingCase(c);
                                  setAppAmount(prod.type === "loan" ? 10000 : 0);
                                }}
                                style={{
                                  flex: 1,
                                  background: "linear-gradient(90deg, #6C63FF 0%, #4D33FF 100%)",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 8,
                                  padding: "11px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Apply Online
                              </button>
                              <button
                                onClick={() => handleUpdateCaseStatus(c.id, "Declined")}
                                style={{
                                  background: "#FEF2F2",
                                  color: "#E24B4B",
                                  border: "1px solid #FECACA",
                                  borderRadius: 8,
                                  padding: "11px 16px",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Decline
                              </button>
                            </div>
                          )}

                          {c.status === "Recommended" && (
                            <button
                              onClick={() => {
                                setApplyingCase(c);
                                setAppAmount(prod.type === "loan" ? 10000 : 0);
                              }}
                              style={{
                                width: "100%",
                                background: "transparent",
                                color: "#6C63FF",
                                border: "1px solid #6C63FF",
                                borderRadius: 8,
                                padding: "10px",
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: "pointer"
                              }}
                            >
                              Apply Online
                            </button>
                          )}

                          {c.status === "Declined" && (
                            <button
                              onClick={() => handleUpdateCaseStatus(c.id, "Accepted")}
                              style={{
                                width: "100%",
                                background: "transparent",
                                color: "#6C63FF",
                                border: "1px solid #6C63FF",
                                borderRadius: 8,
                                padding: "11px",
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: "pointer"
                              }}
                            >
                              Re-Accept Offer
                            </button>
                          )}

                          {c.status === "Applied" && (
                            <div style={{
                              background: "#F0FDF4",
                              borderRadius: 8,
                              padding: 12,
                              border: "1px solid #BBF7D0",
                              fontSize: 12
                            }}>
                              <div style={{ color: "#46C670", fontWeight: 700, marginBottom: 2 }}>
                                Application Submitted
                              </div>
                              <div style={{ color: "#166534" }}>
                                Ref: <strong>{String(c.applicationDetails?.referenceNumber ?? "")}</strong>
                              </div>
                              <div style={{ color: "#166534" }}>
                                Submitted: {new Date(String(c.applicationDetails?.submittedAt ?? "")).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Dynamic Application form Modal */}
              {applyingCase && (
                <div style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0, 0, 0, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                  padding: 20
                }}>
                  <form
                    onSubmit={handleSubmitApplication}
                    style={{
                      background: "var(--fw-bg-card)",
                      border: "1px solid var(--fw-border)",
                      borderRadius: 16,
                      width: "100%",
                      maxWidth: 500,
                      padding: 28,
                      display: "flex",
                      flexDirection: "column",
                      gap: 16
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--fw-border)", paddingBottom: 12 }}>
                      <h4 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                        Apply for {applyingCase.product?.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setApplyingCase(null)}
                        style={{ background: "transparent", border: "none", color: "var(--fw-text-secondary)", fontSize: 20, cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Product Provider</label>
                      <input
                        type="text"
                        disabled
                        value={applyingCase.product?.provider || ""}
                        style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13 }}
                      />
                    </div>

                    {applyingCase.product?.type === "loan" && (
                      <div>
                        <label style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Requested Loan Amount ($)</label>
                        <input
                          type="number"
                          value={appAmount === 0 ? "" : appAmount}
                          onChange={(e) => setAppAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                          style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13 }}
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Annual Income ($)</label>
                      <input
                        type="number"
                        value={appIncome === 0 ? "" : appIncome}
                        onChange={(e) => setAppIncome(e.target.value === "" ? 0 : Number(e.target.value))}
                        style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13 }}
                        required
                        min={1}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Employment Status</label>
                      <select
                        value={appEmployment}
                        onChange={(e) => setAppEmployment(e.target.value)}
                        style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13 }}
                      >
                        <option value="Employed">Employed</option>
                        <option value="Self-Employed">Self-Employed</option>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Student">Student</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Identity Verification (SSN or ID)</label>
                      <input
                        type="text"
                        placeholder="XXX-XX-XXXX"
                        value={appSSN}
                        onChange={(e) => setAppSSN(e.target.value)}
                        style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13 }}
                        required
                      />
                    </div>

                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginTop: 8 }}>
                      <input
                        type="checkbox"
                        checked={appTerms}
                        onChange={(e) => setAppTerms(e.target.checked)}
                        style={{ marginTop: 3 }}
                      />
                      <span style={{ fontSize: 12, color: "var(--fw-text-secondary)", lineHeight: "1.4" }}>
                        I confirm that the personal and financial details provided are accurate, and I authorize FinWise AI to securely process my application with the product issuer.
                      </span>
                    </label>

                    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={() => setApplyingCase(null)}
                        style={{ flex: 1, background: "var(--fw-nav-active-bg)", border: "1px solid #C7D2FE", color: "#4338CA", borderRadius: 8, padding: 12, fontSize: 13, cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingApp}
                        style={{
                          flex: 1,
                          background: "linear-gradient(90deg, #6C63FF 0%, #4D33FF 100%)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {submittingApp ? "Submitting..." : "Submit Application"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERSONAL PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
              <div style={{
                background: "var(--fw-bg-card)",
                border: "1px solid var(--fw-border)",
                borderRadius: 14,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 10px" }}>General Profile</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>First Name</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13 }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Last Name</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13 }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Email Address (Verified Google Email)</label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-muted)", fontSize: 13 }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Phone Number</label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13 }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Age Range</label>
                    <select
                      value={profile.ageRange}
                      onChange={(e) => setProfile({ ...profile, ageRange: e.target.value })}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13 }}
                    >
                      <option value="Under 18">Under 18</option>
                      <option value="18-25">18-25</option>
                      <option value="26-35">26-35</option>
                      <option value="36-50">36-50</option>
                      <option value="51-65">51-65</option>
                      <option value="65+">65+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Residential Address</label>
                  <textarea
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13, height: 60 }}
                    required
                  />
                </div>
              </div>

              {/* Family members management */}
              <div style={{
                background: "var(--fw-bg-card)",
                border: "1px solid var(--fw-border)",
                borderRadius: 14,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Family Members (Spouse & Children)</h3>
                <p style={{ color: "var(--fw-text-secondary)", fontSize: 12, margin: 0 }}>Capture core details to inform insurance and liability calculations.</p>

                {/* Add member subform */}
                <div style={{
                  background: "var(--fw-bg-surface)",
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid var(--fw-border)",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-end",
                  flexWrap: "wrap"
                }}>
                  <div style={{ flex: 2, minWidth: 150 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={newFamilyName}
                      onChange={(e) => setNewFamilyName(e.target.value)}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Relationship</label>
                    <select
                      value={newFamilyRel}
                      onChange={(e) => setNewFamilyRel(e.target.value)}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                    >
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Age Range</label>
                    <select
                      value={newFamilyAge}
                      onChange={(e) => setNewFamilyAge(e.target.value)}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                    >
                      <option value="0-5">0-5</option>
                      <option value="6-12">6-12</option>
                      <option value="13-18">13-18</option>
                      <option value="19-25">19-25</option>
                      <option value="26-35">26-35</option>
                      <option value="36-50">36-50</option>
                      <option value="51-65">51-65</option>
                      <option value="65+">65+</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={addFamilyMember}
                    style={{
                      background: "var(--fw-nav-active-bg)",
                      color: "#A5A1FF",
                      border: "1px solid #C7D2FE",
                      borderRadius: 8,
                      padding: "9px 18px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Add
                  </button>
                </div>

                {/* Table of Members */}
                {(profile.familyMembers ?? []).length > 0 && (
                  <div className="finwise-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--fw-border)", textAlign: "left" }}>
                        <th style={{ padding: "8px 12px", color: "var(--fw-text-secondary)" }}>Name</th>
                        <th style={{ padding: "8px 12px", color: "var(--fw-text-secondary)" }}>Relationship</th>
                        <th style={{ padding: "8px 12px", color: "var(--fw-text-secondary)" }}>Age Range</th>
                        <th style={{ padding: "8px 12px", width: 80 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.familyMembers.map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--fw-border)" }}>
                          <td style={{ padding: "10px 12px" }}>{m.name}</td>
                          <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{m.relationship}</td>
                          <td style={{ padding: "10px 12px" }}>{m.ageRange}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <button
                              type="button"
                              onClick={() => removeFamilyMember(idx)}
                              style={{ background: "transparent", border: "none", color: "#E24B4B", cursor: "pointer", fontSize: 11 }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>

              {/* Dependent details */}
              <div style={{
                background: "var(--fw-bg-card)",
                border: "1px solid var(--fw-border)",
                borderRadius: 14,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Dependent Relatives (Parents/In-laws)</h3>

                <div style={{
                  background: "var(--fw-bg-surface)",
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid var(--fw-border)",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-end",
                  flexWrap: "wrap"
                }}>
                  <div style={{ flex: 2, minWidth: 150 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mary Doe"
                      value={newDepName}
                      onChange={(e) => setNewDepName(e.target.value)}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Relationship</label>
                    <select
                      value={newDepRel}
                      onChange={(e) => setNewDepRel(e.target.value)}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                    >
                      <option value="mother">Mother</option>
                      <option value="father">Father</option>
                      <option value="mother-in-law">Mother-in-law</option>
                      <option value="father-in-law">Father-in-law</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Age Range</label>
                    <select
                      value={newDepAge}
                      onChange={(e) => setNewDepAge(e.target.value)}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                    >
                      <option value="36-50">36-50</option>
                      <option value="51-65">51-65</option>
                      <option value="65+">65+</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={addDependent}
                    style={{
                      background: "var(--fw-nav-active-bg)",
                      color: "#A5A1FF",
                      border: "1px solid #C7D2FE",
                      borderRadius: 8,
                      padding: "9px 18px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Add
                  </button>
                </div>

                {/* Table of Dependents */}
                {profile.dependents.length > 0 && (
                  <div className="finwise-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--fw-border)", textAlign: "left" }}>
                        <th style={{ padding: "8px 12px", color: "var(--fw-text-secondary)" }}>Name</th>
                        <th style={{ padding: "8px 12px", color: "var(--fw-text-secondary)" }}>Relationship</th>
                        <th style={{ padding: "8px 12px", color: "var(--fw-text-secondary)" }}>Age Range</th>
                        <th style={{ padding: "8px 12px", width: 80 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.dependents.map((d, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--fw-border)" }}>
                          <td style={{ padding: "10px 12px" }}>{d.name}</td>
                          <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{d.relationship}</td>
                          <td style={{ padding: "10px 12px" }}>{d.ageRange}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <button
                              type="button"
                              onClick={() => removeDependent(idx)}
                              style={{ background: "transparent", border: "none", color: "#E24B4B", cursor: "pointer", fontSize: 11 }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "linear-gradient(90deg, #6C63FF 0%, #4D33FF 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "14px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  boxShadow: "0 4px 15px rgba(108, 99, 255, 0.3)"
                }}
              >
                {loading ? "Saving Profile..." : "Save Profile Details"}
              </button>
            </form>
          )}

          {/* TAB 4: FINANCIAL DATA CAPTURE */}
          {activeTab === "financial" && (
            <ErrorBoundary fallback="Financial data failed to render. This may be caused by outdated saved data — please refresh the page.">
            <form onSubmit={handleSaveFinancial} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
                gap: 24
              }}>
                {/* Assets Manager */}
                <div style={{
                  background: "var(--fw-bg-card)",
                  border: "1px solid var(--fw-border)",
                  borderRadius: 14,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16
                }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Asset Portfolio</h3>
                  <p style={{ color: "var(--fw-text-secondary)", fontSize: 12, margin: 0 }}>Enter checking, savings, property, gold, stock values, etc.</p>

                  <div style={{
                    background: "var(--fw-bg-surface)",
                    padding: 14,
                    borderRadius: 8,
                    border: "1px solid var(--fw-border)",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-end",
                    flexWrap: "wrap"
                  }}>
                    <div style={{ flex: 2, minWidth: 120 }}>
                      <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Asset Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Primary Savings"
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                        style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                      />
                    </div>
                    <div style={{ flex: 1.5, minWidth: 100 }}>
                      <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Type</label>
                      <select
                        value={newAssetType}
                        onChange={(e) => setNewAssetType(e.target.value)}
                        style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                      >
                        <option value="savings">Savings Account</option>
                        <option value="investment">Stock / Investment</option>
                        <option value="property">Real Estate Property</option>
                        <option value="cash">Cash / Liquid</option>
                        <option value="other">Other Assets</option>
                      </select>
                    </div>
                    <div style={{ flex: 1.5, minWidth: 100 }}>
                      <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Value ($)</label>
                      <input
                        type="number"
                        value={newAssetValue === 0 ? "" : newAssetValue}
                        onChange={(e) => setNewAssetValue(e.target.value === "" ? 0 : Number(e.target.value))}
                        style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addAsset}
                      style={{
                        background: "var(--fw-nav-active-bg)",
                        color: "#A5A1FF",
                        border: "1px solid #C7D2FE",
                        borderRadius: 8,
                        padding: "9px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Add
                    </button>
                  </div>

                  {(financialData.assets ?? []).length > 0 && (
                    <div className="finwise-table-wrap">
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--fw-border)", textAlign: "left" }}>
                          <th style={{ padding: "8px", color: "var(--fw-text-secondary)" }}>Name</th>
                          <th style={{ padding: "8px", color: "var(--fw-text-secondary)" }}>Type</th>
                          <th style={{ padding: "8px", color: "var(--fw-text-secondary)", textAlign: "right" }}>Value</th>
                          <th style={{ padding: "8px", width: 60 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialData.assets.map((a, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--fw-border)" }}>
                            <td style={{ padding: "8px" }}>{a.name}</td>
                            <td style={{ padding: "8px", textTransform: "capitalize" }}>{a.type}</td>
                            <td style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>${a.value.toLocaleString()}</td>
                            <td style={{ padding: "8px", textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => removeAsset(idx)}
                                style={{ background: "transparent", border: "none", color: "#E24B4B", cursor: "pointer", fontSize: 11 }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--fw-border)", paddingTop: 14, marginTop: "auto" }}>
                    <span style={{ fontSize: 14, color: "var(--fw-text-secondary)" }}>Total Assets</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#2EAF7D" }}>
                      ${financialData.assets.reduce((sum, a) => sum + a.value, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Liabilities Manager */}
                <div style={{
                  background: "var(--fw-bg-card)",
                  border: "1px solid var(--fw-border)",
                  borderRadius: 14,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16
                }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Liabilities & Loans</h3>
                  <p style={{ color: "var(--fw-text-secondary)", fontSize: 12, margin: 0 }}>Enter mortgages, auto loans, personal debt, student debt, etc.</p>

                  <div style={{
                    background: "var(--fw-bg-surface)",
                    padding: 14,
                    borderRadius: 8,
                    border: "1px solid var(--fw-border)",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-end",
                    flexWrap: "wrap"
                  }}>
                    <div style={{ flex: 1.5, minWidth: 110 }}>
                      <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Debt Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Mortgage"
                        value={newLiabilityName}
                        onChange={(e) => setNewLiabilityName(e.target.value)}
                        style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 80 }}>
                      <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Type</label>
                      <select
                        value={newLiabilityType}
                        onChange={(e) => setNewLiabilityType(e.target.value)}
                        style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                      >
                        <option value="mortgage">Mortgage</option>
                        <option value="loan">Auto / Personal Loan</option>
                        <option value="credit_card">Credit Card Debt</option>
                        <option value="student_debt">Student Debt</option>
                        <option value="other">Other Debt</option>
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 80 }}>
                      <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Balance ($)</label>
                      <input
                        type="number"
                        value={newLiabilityValue === 0 ? "" : newLiabilityValue}
                        onChange={(e) => setNewLiabilityValue(e.target.value === "" ? 0 : Number(e.target.value))}
                        style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 80 }}>
                      <label style={{ display: "block", fontSize: 11, color: "var(--fw-text-secondary)", marginBottom: 4 }}>Monthly ($)</label>
                      <input
                        type="number"
                        value={newLiabilityPayment === 0 ? "" : newLiabilityPayment}
                        onChange={(e) => setNewLiabilityPayment(e.target.value === "" ? 0 : Number(e.target.value))}
                        style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 8, color: "var(--fw-text-primary)", fontSize: 12 }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addLiability}
                      style={{
                        background: "var(--fw-nav-active-bg)",
                        color: "#A5A1FF",
                        border: "1px solid #C7D2FE",
                        borderRadius: 8,
                        padding: "9px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Add
                    </button>
                  </div>

                  {(financialData.liabilities ?? []).length > 0 && (
                    <div className="finwise-table-wrap">
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--fw-border)", textAlign: "left" }}>
                          <th style={{ padding: "8px", color: "var(--fw-text-secondary)" }}>Name</th>
                          <th style={{ padding: "8px", color: "var(--fw-text-secondary)" }}>Type</th>
                          <th style={{ padding: "8px", color: "var(--fw-text-secondary)", textAlign: "right" }}>Balance</th>
                          <th style={{ padding: "8px", color: "var(--fw-text-secondary)", textAlign: "right" }}>Monthly Payment</th>
                          <th style={{ padding: "8px", width: 50 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialData.liabilities.map((l, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--fw-border)" }}>
                            <td style={{ padding: "8px" }}>{l.name}</td>
                            <td style={{ padding: "8px", textTransform: "capitalize" }}>{l.type}</td>
                            <td style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>${l.value.toLocaleString()}</td>
                            <td style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>${l.monthlyPayment}/mo</td>
                            <td style={{ padding: "8px", textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => removeLiability(idx)}
                                style={{ background: "transparent", border: "none", color: "#E24B4B", cursor: "pointer", fontSize: 11 }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--fw-border)", paddingTop: 14, marginTop: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14, color: "var(--fw-text-secondary)" }}>Total Outstanding Debt</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#E24B4B" }}>
                        ${financialData.liabilities.reduce((sum, l) => sum + l.value, 0).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--fw-text-muted)" }}>Total Monthly Debt Payments</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#FFAA00" }}>
                        ${financialData.liabilities.reduce((sum, l) => sum + l.monthlyPayment, 0).toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Income Section */}
              <div style={{ background: "var(--fw-bg-card)", border: "1px solid var(--fw-border)", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>Income</h3>
                  <p style={{ color: "var(--fw-text-secondary)", fontSize: 12, margin: 0 }}>Enter annual gross income. Family income is optional and only applies if there are additional earners in the household.</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
                  <div>
                    <label htmlFor="primary-yearly-income" style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Primary Yearly Income ($) <span style={{ color: "#E24B4B" }}>*</span></label>
                    <input
                      id="primary-yearly-income"
                      type="number"
                      min={0}
                      value={financialData.primaryYearlyIncome === 0 ? "" : financialData.primaryYearlyIncome}
                      onChange={(e) => setFinancialData(prev => ({ ...prev, primaryYearlyIncome: e.target.value === "" ? 0 : Number(e.target.value) }))}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label htmlFor="family-yearly-income" style={{ display: "block", fontSize: 12, color: "var(--fw-text-secondary)", marginBottom: 6 }}>Family / Household Yearly Income ($) <span style={{ color: "var(--fw-text-muted)" }}>(optional)</span></label>
                    <input
                      id="family-yearly-income"
                      type="number"
                      min={0}
                      value={financialData.familyYearlyIncome === 0 ? "" : financialData.familyYearlyIncome}
                      onChange={(e) => setFinancialData(prev => ({ ...prev, familyYearlyIncome: e.target.value === "" ? 0 : Number(e.target.value) }))}
                      style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 8, padding: 10, color: "var(--fw-text-primary)", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                </div>
                {(financialData.primaryYearlyIncome > 0 || financialData.familyYearlyIncome > 0) && (
                  <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--fw-border)", paddingTop: 12 }}>
                    <span style={{ fontSize: 13, color: "var(--fw-text-secondary)", marginRight: 12 }}>Combined Yearly Income</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#2EAF7D" }}>
                      ${(financialData.primaryYearlyIncome + financialData.familyYearlyIncome).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Expenditures Section */}
              <div style={{ background: "var(--fw-bg-card)", border: "1px solid var(--fw-border)", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>Monthly Expenditures</h3>
                    <p style={{ color: "var(--fw-text-secondary)", fontSize: 12, margin: 0 }}>Add each recurring monthly bill. Defaults to credit card bill — add more as needed.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addExpenditure}
                    style={{ background: "var(--fw-nav-active-bg)", color: "#A5A1FF", border: "1px solid #C7D2FE", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                  >+ Add Expenditure</button>
                </div>
                <div className="finwise-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--fw-border)", textAlign: "left" }}>
                        <th style={{ padding: "8px 10px", color: "var(--fw-text-secondary)", fontWeight: 500, width: 170 }}>Type</th>
                        <th style={{ padding: "8px 10px", color: "var(--fw-text-secondary)", fontWeight: 500 }}>Description</th>
                        <th style={{ padding: "8px 10px", color: "var(--fw-text-secondary)", fontWeight: 500, width: 130, textAlign: "right" }}>Monthly ($)</th>
                        <th style={{ padding: "8px", width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(financialData.expenditures ?? []).map((exp, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--fw-border)" }}>
                          <td style={{ padding: "6px 10px" }}>
                            <select
                              value={exp.type}
                              onChange={(e) => updateExpenditure(idx, "type", e.target.value)}
                              style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 6, padding: "6px 8px", color: "var(--fw-text-primary)", fontSize: 12 }}
                            >
                              <option value="credit_card">Credit Card Bill</option>
                              <option value="insurance">Insurance Bill</option>
                              <option value="other">Other Monthly Bill</option>
                            </select>
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input
                              type="text"
                              placeholder="e.g. Visa Platinum"
                              value={exp.description}
                              onChange={(e) => updateExpenditure(idx, "description", e.target.value)}
                              style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 6, padding: "6px 8px", color: "var(--fw-text-primary)", fontSize: 12, boxSizing: "border-box" }}
                            />
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input
                              type="number"
                              min={0}
                              value={exp.monthlyAmount === 0 ? "" : exp.monthlyAmount}
                              onChange={(e) => updateExpenditure(idx, "monthlyAmount", e.target.value === "" ? 0 : Number(e.target.value))}
                              style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 6, padding: "6px 8px", color: "var(--fw-text-primary)", fontSize: 12, textAlign: "right", boxSizing: "border-box" }}
                            />
                          </td>
                          <td style={{ padding: "6px", textAlign: "center" }}>
                            {(financialData.expenditures ?? []).length > 1 && (
                              <button type="button" onClick={() => removeExpenditure(idx)} style={{ background: "transparent", border: "none", color: "#E24B4B", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--fw-border)", paddingTop: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--fw-text-secondary)" }}>Total Monthly Expenditure</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#E24B4B" }}>
                    ${(financialData.expenditures ?? []).reduce((s, e) => s + (e.monthlyAmount || 0), 0).toLocaleString()}/mo
                  </span>
                </div>
              </div>

              {/* Savings Section */}
              <div style={{ background: "var(--fw-bg-card)", border: "1px solid var(--fw-border)", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>Monthly Savings</h3>
                    <p style={{ color: "var(--fw-text-secondary)", fontSize: 12, margin: 0 }}>Add each savings or retirement contribution. Defaults to 401(k) — add more as needed.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addSaving}
                    style={{ background: "var(--fw-nav-active-bg)", color: "#A5A1FF", border: "1px solid #C7D2FE", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                  >+ Add Saving</button>
                </div>
                <div className="finwise-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--fw-border)", textAlign: "left" }}>
                        <th style={{ padding: "8px 10px", color: "var(--fw-text-secondary)", fontWeight: 500, width: 170 }}>Type</th>
                        <th style={{ padding: "8px 10px", color: "var(--fw-text-secondary)", fontWeight: 500 }}>Description</th>
                        <th style={{ padding: "8px 10px", color: "var(--fw-text-secondary)", fontWeight: 500, width: 150, textAlign: "right" }}>Monthly Contribution ($)</th>
                        <th style={{ padding: "8px", width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(financialData.savings ?? []).map((sav, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--fw-border)" }}>
                          <td style={{ padding: "6px 10px" }}>
                            <select
                              value={sav.type}
                              onChange={(e) => updateSaving(idx, "type", e.target.value)}
                              style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 6, padding: "6px 8px", color: "var(--fw-text-primary)", fontSize: 12 }}
                            >
                              <option value="401k">401(k) / Employer Plan</option>
                              <option value="ira">IRA (Traditional / Roth)</option>
                              <option value="emergency">Emergency Fund</option>
                              <option value="investment">Investment Account</option>
                              <option value="other">Other Savings</option>
                            </select>
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input
                              type="text"
                              placeholder="e.g. Employer 401k match"
                              value={sav.description}
                              onChange={(e) => updateSaving(idx, "description", e.target.value)}
                              style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 6, padding: "6px 8px", color: "var(--fw-text-primary)", fontSize: 12, boxSizing: "border-box" }}
                            />
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input
                              type="number"
                              min={0}
                              value={sav.monthlyContribution === 0 ? "" : sav.monthlyContribution}
                              onChange={(e) => updateSaving(idx, "monthlyContribution", e.target.value === "" ? 0 : Number(e.target.value))}
                              style={{ width: "100%", background: "var(--fw-bg-surface)", border: "1px solid var(--fw-border)", borderRadius: 6, padding: "6px 8px", color: "var(--fw-text-primary)", fontSize: 12, textAlign: "right", boxSizing: "border-box" }}
                            />
                          </td>
                          <td style={{ padding: "6px", textAlign: "center" }}>
                            {(financialData.savings ?? []).length > 1 && (
                              <button type="button" onClick={() => removeSaving(idx)} style={{ background: "transparent", border: "none", color: "#E24B4B", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--fw-border)", paddingTop: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--fw-text-secondary)" }}>Total Monthly Savings</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#2EAF7D" }}>
                    ${(financialData.savings ?? []).reduce((s, sv) => s + (sv.monthlyContribution || 0), 0).toLocaleString()}/mo
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "linear-gradient(90deg, #6C63FF 0%, #4D33FF 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "14px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  boxShadow: "0 4px 15px rgba(108, 99, 255, 0.3)"
                }}
              >
                {loading ? "Saving Records..." : "Save Financial Portfolio"}
              </button>
            </form>
            </ErrorBoundary>
          )}

          {/* TAB 5: SPENDWISE STATEMENT UPLOADER */}
          {activeTab === "upload" && (
            <div>
              <div style={{
                background: "var(--fw-bg-card)",
                border: "1px solid var(--fw-border)",
                borderRadius: 14,
                padding: "24px 28px",
                marginBottom: 24
              }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>Statement Transaction Extractor</h4>
                <p style={{ color: "var(--fw-text-secondary)", fontSize: 13, margin: 0 }}>
                  Upload your credit card PDF statements below. The AI extracts transactions and categorizes them automatically.
                  Extracted sums can help you gauge your Monthly Credit Card Bills.
                </p>
              </div>
              {/* Render the original Dashboard component here */}
              <Dashboard />
            </div>
          )}

          {/* TAB 6: ADMIN PANEL */}
          {activeTab === "admin" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* Analytics metrics */}
              {adminAnalytics ? (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 20
                }}>
                  <div style={{ background: "var(--fw-bg-card)", border: "1px solid var(--fw-border)", borderRadius: 12, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "var(--fw-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Total Registered Users</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: "var(--fw-text-primary)" }}>{adminAnalytics.totalUsers}</div>
                  </div>

                  <div style={{ background: "var(--fw-bg-card)", border: "1px solid var(--fw-border)", borderRadius: 12, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "var(--fw-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Average AI Health Score</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: "#2EAF7D" }}>{adminAnalytics.averageScore} / 100</div>
                  </div>

                  <div style={{ background: "var(--fw-bg-card)", border: "1px solid var(--fw-border)", borderRadius: 12, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "var(--fw-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Products Catalog Size</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: "#6C63FF" }}>{adminAnalytics.totalProducts} Products</div>
                  </div>

                  <div style={{ background: "var(--fw-bg-card)", border: "1px solid var(--fw-border)", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 12, color: "var(--fw-text-secondary)", textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>Case Pipeline Statuses</div>
                    <div style={{ display: "flex", justifyContent: "space-around", fontSize: 12 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "#FFAA00", fontWeight: 700 }}>{adminAnalytics.casesByStatus.Recommended}</div>
                        <div style={{ fontSize: 10, color: "var(--fw-text-muted)" }}>Rec</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "#4CA6FF", fontWeight: 700 }}>{adminAnalytics.casesByStatus.Accepted}</div>
                        <div style={{ fontSize: 10, color: "var(--fw-text-muted)" }}>Acc</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "#6B7280", fontWeight: 700 }}>{adminAnalytics.casesByStatus.Declined}</div>
                        <div style={{ fontSize: 10, color: "var(--fw-text-muted)" }}>Dec</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "#46C670", fontWeight: 700 }}>{adminAnalytics.casesByStatus.Applied}</div>
                        <div style={{ fontSize: 10, color: "var(--fw-text-muted)" }}>App</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: "var(--fw-text-secondary)", fontSize: 13 }}>Loading system analytics...</div>
              )}

              {/* Users table */}
              <div style={{
                background: "var(--fw-bg-card)",
                border: "1px solid var(--fw-border)",
                borderRadius: 14,
                padding: 24
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>User Database Directory</h3>
                {adminUsers.length === 0 ? (
                  <div style={{ color: "var(--fw-text-secondary)", fontSize: 14, textAlign: "center", padding: 20 }}>No user data available in DB yet.</div>
                ) : (
                  <div className="finwise-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--fw-border)", textAlign: "left" }}>
                        <th style={{ padding: "10px 12px", color: "var(--fw-text-secondary)" }}>User Email</th>
                        <th style={{ padding: "10px 12px", color: "var(--fw-text-secondary)" }}>Profile Name</th>
                        <th style={{ padding: "10px 12px", color: "var(--fw-text-secondary)", textAlign: "center" }}>Financial Assets Saved?</th>
                        <th style={{ padding: "10px 12px", color: "var(--fw-text-secondary)", textAlign: "center" }}>Active Cases</th>
                        <th style={{ padding: "10px 12px", color: "var(--fw-text-secondary)", textAlign: "center" }}>Audit Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((u, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--fw-border)" }}>
                          <td style={{ padding: "12px" }}>{u.email}</td>
                          <td style={{ padding: "12px" }}>{u.name}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{u.hasFinancialData ? "✅ Yes" : "❌ No"}</td>
                          <td style={{ padding: "12px", textAlign: "center", fontWeight: 600 }}>{u.casesCount} Cases</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            {u.healthScore !== null ? (
                              <span style={{
                                color: getScoreColor(u.healthScore),
                                background: `${getScoreColor(u.healthScore)}15`,
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontWeight: 700
                              }}>
                                {u.healthScore}
                              </span>
                            ) : "Not Audited"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STOCKS TAB */}
          {activeTab === "stocks" && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 400,
              gap: 16,
              background: "var(--fw-bg-card)",
              borderRadius: 16,
              border: "1px solid var(--fw-border)",
              padding: 48
            }}>
              <div style={{ fontSize: 56 }}>📈</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#A5A1FF" }}>
                Your Stocks Analyzer
              </h3>
              <p style={{ color: "var(--fw-text-secondary)", fontSize: 15, textAlign: "center", maxWidth: 480, margin: 0 }}>
                AI-powered stock portfolio analysis is coming soon. You will be able to upload your holdings,
                track performance, and receive personalized investment insights.
              </p>
              <div style={{
                background: "var(--fw-nav-active-bg)",
                border: "1px solid #C7D2FE",
                borderRadius: 8,
                padding: "8px 20px",
                color: "#6C63FF",
                fontSize: 13,
                fontWeight: 500
              }}>
                Coming Soon
              </div>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === "contact" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
              <div style={{
                background: "var(--fw-bg-card)",
                borderRadius: 16,
                border: "1px solid var(--fw-border)",
                padding: 32
              }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>Get in Touch</h3>
                <p style={{ color: "var(--fw-text-secondary)", fontSize: 14, margin: "0 0 24px" }}>
                  Have questions about your financial plan or need support? Reach out to our team.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ fontSize: 22 }}>✉️</div>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--fw-text-secondary)" }}>Email</div>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>support@finwiseai.com</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ fontSize: 22 }}>📞</div>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--fw-text-secondary)" }}>Phone</div>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>+1 (800) 555-0199</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ fontSize: 22 }}>🕐</div>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--fw-text-secondary)" }}>Support Hours</div>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>Mon – Fri, 9 AM – 6 PM EST</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

      </div>
    </div>
  );
};

export default Home;
