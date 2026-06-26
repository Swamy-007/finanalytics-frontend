/**
 * Mobile view tests for LandingPage.
 *
 * These tests verify DOM behaviour (hamburger toggle, menu open/close, modal
 * triggers) that must work on narrow viewports.  CSS visibility (display:none
 * vs display:flex) is not evaluated by jsdom, so we assert on class names and
 * aria attributes instead — that is the correct layer to test in unit tests.
 * End-to-end Playwright tests are needed to verify the visual CSS on real mobile.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: vi.fn().mockImplementation(
    ({ onSuccess }: { onSuccess: (r: { credential: string }) => void }) => (
      <button onClick={() => onSuccess({ credential: "mock-token" })}>
        Google Login
      </button>
    )
  ),
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: () => ({
    name: "Mobile User",
    email: "mobile@example.com",
    picture: "",
    email_verified: true,
    exp: 9999999999,
    iat: 1700000000,
  }),
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: { name: "Mobile User", email: "mobile@example.com", sessionToken: "tok" } }),
    isAxiosError: vi.fn().mockReturnValue(false),
  },
}));

function hamburger() {
  return screen.getByRole("button", { name: /toggle navigation menu/i });
}

function navLinks() {
  // The div wrapping all nav link buttons
  return document.querySelector(".fw-nav-links") as HTMLElement;
}

beforeEach(() => {
  render(<App />);
});

// ── Hamburger presence ──────────────────────────────────────────────────────

describe("Mobile nav — hamburger button", () => {
  it("renders a hamburger button in the DOM", () => {
    expect(hamburger()).toBeInTheDocument();
  });

  it("hamburger shows ☰ when menu is closed", () => {
    expect(hamburger().textContent).toBe("☰");
  });

  it("hamburger has aria-expanded=false when menu is closed", () => {
    expect(hamburger()).toHaveAttribute("aria-expanded", "false");
  });

  it("hamburger shows ✕ after being clicked", () => {
    fireEvent.click(hamburger());
    expect(hamburger().textContent).toBe("✕");
  });

  it("hamburger has aria-expanded=true after being clicked", () => {
    fireEvent.click(hamburger());
    expect(hamburger()).toHaveAttribute("aria-expanded", "true");
  });
});

// ── Menu open / close ───────────────────────────────────────────────────────

describe("Mobile nav — menu open/close", () => {
  it("nav links do NOT have class 'open' initially", () => {
    expect(navLinks().classList.contains("open")).toBe(false);
  });

  it("nav links gain class 'open' when hamburger is clicked", () => {
    fireEvent.click(hamburger());
    expect(navLinks().classList.contains("open")).toBe(true);
  });

  it("nav links lose class 'open' when hamburger is clicked again (toggle)", () => {
    fireEvent.click(hamburger());
    fireEvent.click(hamburger());
    expect(navLinks().classList.contains("open")).toBe(false);
  });

  it("clicking Home nav button closes the mobile menu", () => {
    fireEvent.click(hamburger());
    fireEvent.click(screen.getByRole("button", { name: /^Home$/i }));
    expect(navLinks().classList.contains("open")).toBe(false);
  });

  it("clicking Contact Us nav button closes the mobile menu", () => {
    fireEvent.click(hamburger());
    fireEvent.click(screen.getByRole("button", { name: /contact us/i }));
    expect(navLinks().classList.contains("open")).toBe(false);
  });
});

// ── Auth modal from mobile nav ──────────────────────────────────────────────

describe("Mobile nav — auth modal triggers", () => {
  it("clicking AI Solutions from mobile menu opens the auth modal", () => {
    fireEvent.click(hamburger());
    fireEvent.click(screen.getByRole("button", { name: /AI Solutions/i }));
    // Modal is open when the close button is present
    expect(screen.getByRole("button", { name: "✕" })).toBeInTheDocument();
  });

  it("clicking AI Solutions closes the mobile menu", () => {
    fireEvent.click(hamburger());
    fireEvent.click(screen.getByRole("button", { name: /AI Solutions/i }));
    expect(navLinks().classList.contains("open")).toBe(false);
  });

  it("clicking Get Started CTA opens the auth modal on mobile", () => {
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(screen.getByRole("button", { name: "✕" })).toBeInTheDocument();
  });

  it("auth modal can be closed via the ✕ button on mobile", () => {
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    fireEvent.click(screen.getByRole("button", { name: "✕" }));
    expect(screen.queryByRole("button", { name: "✕" })).not.toBeInTheDocument();
  });
});

// ── Theme toggle from mobile nav ────────────────────────────────────────────

describe("Mobile nav — theme toggle", () => {
  it("theme toggle button is present in the mobile nav", () => {
    expect(screen.getByTitle(/toggle theme/i)).toBeInTheDocument();
  });

  it("theme toggle button is reachable after opening the mobile menu", () => {
    fireEvent.click(hamburger());
    expect(screen.getByTitle(/toggle theme/i)).toBeInTheDocument();
  });
});

// ── Section navigation from mobile ─────────────────────────────────────────

describe("Mobile nav — section navigation", () => {
  it("clicking Home shows the hero section", () => {
    fireEvent.click(hamburger());
    fireEvent.click(screen.getByRole("button", { name: /^Home$/i }));
    expect(
      screen.getByRole("heading", { name: /your smartest financial decisions start here/i })
    ).toBeInTheDocument();
  });

  it("clicking Contact Us shows the contact section heading", () => {
    fireEvent.click(hamburger());
    fireEvent.click(screen.getByRole("button", { name: /contact us/i }));
    expect(screen.getByRole("heading", { name: /contact us/i })).toBeInTheDocument();
  });
});
