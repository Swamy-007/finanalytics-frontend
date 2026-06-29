import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useTheme } from "./ThemeContext.ts";

type User = {
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
  exp: number;
  iat: number;
  token?: string;
};

interface LandingPageProps {
  onLogin: (user: User) => void;
  sessionMsg?: string | null;
}

type AuthMode = "login" | "register";

const FEATURES = [
  {
    icon: "🧠",
    title: "AI Financial Health Analysis",
    desc: "Get a holistic view of your financial health with AI-computed debt ratios, savings rates, and risk scores."
  },
  {
    icon: "🎯",
    title: "Personalised Product Recommendations",
    desc: "Receive loan, insurance, and investment suggestions tailored specifically to your financial profile."
  },
  {
    icon: "📉",
    title: "Debt & Savings Optimisation",
    desc: "AI-driven strategies to reduce liabilities, grow savings, and close financial gaps efficiently."
  },
  {
    icon: "🪄",
    title: "Step-by-Step Financial Wizard",
    desc: "A guided 4-step journey — profile, data entry, AI audit, and product recommendations — all in one place."
  },
  {
    icon: "💳",
    title: "Credit Card Statement Analyser",
    desc: "Upload your statement and instantly see your spending by category with AI-powered insights."
  },
  {
    icon: "📊",
    title: "Case Lifecycle Management",
    desc: "Track every product recommendation through its full lifecycle: Recommended → Accepted → Applied."
  }
];

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, sessionMsg }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<"home" | "contact">("home");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL as string;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const openAuth = () => {
    setAuthError("");
    setAuthSuccess("");
    setShowAuthModal(true);
    setShowDropdown(false);
    setMobileMenuOpen(false);
  };

  const closeAuth = () => {
    setShowAuthModal(false);
    setAuthError("");
    setAuthSuccess("");
    setLoginEmail("");
    setLoginPassword("");
    setRegName("");
    setRegEmail("");
    setRegPassword("");
    setRegConfirm("");
  };

  const handleEmailLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setAuthError("");
    setLoginLoading(true);
    try {
      const res = await axios.post<{ id: string; name: string; email: string; sessionToken: string }>(
        `${apiUrl}/api/users/login`,
        { email: loginEmail, password: loginPassword }
      );
      const { name, email, sessionToken } = res.data;
      onLogin({ name, email, picture: "", email_verified: false, exp: 0, iat: 0, token: sessionToken });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : null;
      setAuthError(msg || "Invalid email or password.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse.credential;
    if (!credential) {
      setAuthError("Google did not return a credential. Please try again.");
      return;
    }
    try {
      // Exchange the short-lived Google credential for a 7-day backend session token.
      // This means user.token is ALWAYS a session token — the Google credential is
      // never used as an Authorization header for any data API call.
      const res = await axios.post<{ sessionToken: string; email: string; name: string; isAdmin: boolean }>(
        `${apiUrl}/api/auth/google-exchange`,
        { credential }
      );
      const { sessionToken, email, name } = res.data;
      onLogin({ name, email, picture: "", email_verified: true, exp: 0, iat: 0, token: sessionToken });
    } catch (err) {
      console.error("Google sign-in error:", err);
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : null;
      setAuthError(msg || "Google sign-in failed. Please try again.");
    }
  };

  const handleRegister = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setAuthError("");
    if (regPassword !== regConfirm) {
      setAuthError("Passwords do not match.");
      return;
    }
    if (regPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    setRegLoading(true);
    try {
      const res = await axios.post<{ id: string; name: string; email: string; sessionToken: string }>(
        `${apiUrl}/api/users/register`,
        { name: regName, email: regEmail, password: regPassword }
      );
      const { name, email, sessionToken } = res.data;
      onLogin({ name, email, picture: "", email_verified: false, exp: 0, iat: 0, token: sessionToken });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : null;
      setAuthError(msg || "Registration failed. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {sessionMsg && (
        <div className="fw-session-banner">⚠ {sessionMsg}</div>
      )}
      {/* ── Navbar ── */}
      <nav className="fw-nav">
        <div className="fw-nav-brand">
          <div className="fw-nav-brand-icon">F</div>
          <div>
            <div className="fw-nav-brand-title">Financial AI Solutions</div>
            <div className="fw-nav-brand-sub">Advisory Portal</div>
          </div>
        </div>

        <button
          className="fw-nav-hamburger"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(prev => !prev)}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <div className={`fw-nav-links${mobileMenuOpen ? " open" : ""}`}>
          <button
            className={`fw-nav-btn${activeSection === "home" ? " active" : ""}`}
            onClick={() => { setActiveSection("home"); closeMobileMenu(); }}
          >
            Home
          </button>

          <div
            className="fw-nav-dropdown"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button className="fw-nav-btn" onClick={openAuth}>AI Solutions ▾</button>
            {(showDropdown || mobileMenuOpen) && (
              <div className="fw-nav-dropdown-menu">
                <button className="fw-nav-dropdown-item" onClick={openAuth}>
                  📊 Evaluate Financials
                </button>
                <button className="fw-nav-dropdown-item" onClick={openAuth}>
                  💳 Credit Card Analyser
                </button>
                <button className="fw-nav-dropdown-item" onClick={openAuth}>
                  📈 Your Stocks Analyser
                </button>
              </div>
            )}
          </div>

          <button
            className={`fw-nav-btn${activeSection === "contact" ? " active" : ""}`}
            onClick={() => { setActiveSection("contact"); closeMobileMenu(); }}
          >
            Contact Us
          </button>

          <button
            className="fw-nav-btn"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      {activeSection === "home" && (
        <>
          <section className="fw-hero">
            <div className="fw-hero-badge">✨ AI-Powered Financial Advisory</div>
            <h1 className="fw-hero-title">Your Smartest Financial Decisions Start Here</h1>
            <p className="fw-hero-sub">
              Harness AI to analyse your financial health, receive personalised product
              recommendations, and take confident steps toward your financial goals.
            </p>
            <div className="fw-hero-cta">
              <button className="fw-btn-primary" onClick={openAuth}>
                Get Started — It's Free
              </button>
              <button className="fw-btn-secondary" onClick={() => setActiveSection("contact")}>
                Learn More
              </button>
            </div>
          </section>

          <section className="fw-features-grid">
            {FEATURES.map((f) => (
              <div className="fw-feature-card" key={f.title}>
                <div className="fw-feature-icon">{f.icon}</div>
                <h3 className="fw-feature-title">{f.title}</h3>
                <p className="fw-feature-desc">{f.desc}</p>
              </div>
            ))}
          </section>
        </>
      )}

      {activeSection === "contact" && (
        <section className="fw-contact">
          <h2 className="fw-contact-title">Contact Us</h2>
          <p className="fw-contact-desc">
            Have questions about your financial journey? Our team is here to help.
          </p>
          <p className="fw-contact-email">support@finwiseai.com</p>
        </section>
      )}

      {/* ── Auth Modal ── */}
      {showAuthModal && (
        <div className="fw-modal-overlay" onClick={closeAuth}>
          <div className="fw-modal" onClick={(e) => e.stopPropagation()}>
            <button className="fw-modal-close" onClick={closeAuth}>✕</button>

            <h2 className="fw-modal-title">
              {authMode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="fw-modal-subtitle">
              {authMode === "login"
                ? "Sign in to access AI-powered financial tools"
                : "Register to start your financial journey"}
            </p>

            <div className="fw-modal-tabs">
              <button
                className={`fw-modal-tab${authMode === "login" ? " active" : ""}`}
                onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
              >
                Sign In
              </button>
              <button
                className={`fw-modal-tab${authMode === "register" ? " active" : ""}`}
                onClick={() => { setAuthMode("register"); setAuthError(""); setAuthSuccess(""); }}
              >
                Register
              </button>
            </div>

            {authError && <div className="fw-alert-error">{authError}</div>}
            {authSuccess && <div className="fw-alert-success">{authSuccess}</div>}

            {authMode === "login" && (
              <>
                <div className="fw-google-row">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setAuthError("Google sign-in failed. Please try again.")}
                  />
                </div>

                <div className="fw-divider">or sign in with email</div>

                <form onSubmit={handleEmailLogin}>
                  <div className="fw-form-group">
                    <label className="fw-form-label">Email Address</label>
                    <input
                      className="fw-form-input"
                      type="email"
                      placeholder="jane@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="fw-form-group">
                    <label className="fw-form-label">Password</label>
                    <input
                      className="fw-form-input"
                      type="password"
                      placeholder="Your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    className="fw-btn-primary fw-btn-full"
                    type="submit"
                    disabled={loginLoading}
                  >
                    {loginLoading ? "Signing in…" : "Sign In"}
                  </button>
                </form>
              </>
            )}

            {authMode === "register" && (
              <form onSubmit={handleRegister}>
                <div className="fw-form-group">
                  <label className="fw-form-label">Full Name</label>
                  <input
                    className="fw-form-input"
                    type="text"
                    placeholder="Jane Smith"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>
                <div className="fw-form-group">
                  <label className="fw-form-label">Email Address</label>
                  <input
                    className="fw-form-input"
                    type="email"
                    placeholder="jane@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="fw-form-group">
                  <label className="fw-form-label">Password</label>
                  <input
                    className="fw-form-input"
                    type="password"
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="fw-form-group">
                  <label className="fw-form-label">Confirm Password</label>
                  <input
                    className="fw-form-input"
                    type="password"
                    placeholder="Repeat password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    required
                  />
                </div>
                <button className="fw-btn-primary fw-btn-full" type="submit" disabled={regLoading}>
                  {regLoading ? "Creating account…" : "Create Account"}
                </button>
                <div className="fw-divider">or sign in with</div>
                <div className="fw-google-row">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setAuthError("Google sign-in failed. Please try again.")}
                  />
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
