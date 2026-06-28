import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Home from "./Home";
import LandingPage from "./LandingPage";

type User = {
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
  exp: number;
  iat: number;
  token?: string;
};

const IDLE_TIMEOUT_MS  = 30 * 60 * 1000; // 30 min → auto logout
const IDLE_WARNING_MS  = 25 * 60 * 1000; // 25 min → show warning
const ACTIVITY_EVENTS  = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;

const App: React.FC = () => {
  const [user, setUser]             = useState<User | null>(null);
  const [idleWarning, setIdleWarning] = useState(false);
  const [sessionMsg, setSessionMsg]  = useState<string | null>(null);

  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = useCallback((reason?: string) => {
    setUser(null);
    setIdleWarning(false);
    if (reason) setSessionMsg(reason);
  }, []);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleWarning(false);
  }, []);

  // Idle timer — only active while logged in
  useEffect(() => {
    if (!user) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    lastActivityRef.current = Date.now();

    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, resetActivity, { passive: true }));

    intervalRef.current = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= IDLE_TIMEOUT_MS) {
        logout("You were signed out after 30 minutes of inactivity.");
      } else if (idle >= IDLE_WARNING_MS) {
        setIdleWarning(true);
      }
    }, 60_000); // check every minute

    return () => {
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetActivity));
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, resetActivity, logout]);

  // Axios 401 interceptor — catch expired/invalid token from any API call
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      res => res,
      err => {
        if (axios.isAxiosError(err) && err.response?.status === 401 && user) {
          // auth/sync is fire-and-forget; its failure must never trigger logout.
          const url = (err.config?.url ?? "") as string;
          if (!url.includes("/auth/sync")) {
            logout("Your session has expired. Please sign in again.");
          }
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [user, logout]);

  if (user) {
    return (
      <>
        {idleWarning && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
            background: "#B45309", color: "#fff",
            padding: "10px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif"
          }}>
            <span>⏱ Your session will expire in 5 minutes due to inactivity.</span>
            <button
              type="button"
              onClick={resetActivity}
              style={{
                background: "#fff", color: "#B45309", border: "none",
                borderRadius: 6, padding: "5px 14px", fontWeight: 600,
                fontSize: 13, cursor: "pointer"
              }}
            >
              Stay Signed In
            </button>
          </div>
        )}
        <div style={{ paddingTop: idleWarning ? 44 : 0 }}>
          <Home user={user} onLogout={() => logout()} />
        </div>
      </>
    );
  }

  return <LandingPage onLogin={(u) => { setUser(u); setSessionMsg(null); }} sessionMsg={sessionMsg} />;
};

export default App;
