/**
 * Authentication flow tests for LandingPage.
 *
 * Covers both sign-in methods:
 *  - Google (Gmail) OAuth via the GoogleLogin component
 *  - Email / password login (POST /api/users/login)
 *
 * Also covers registration and session-message display.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LandingPage from "./LandingPage";
import axios from "axios";

// ──────────────── mocks ────────────────

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: vi.fn().mockImplementation(
    ({
      onSuccess,
      onError,
    }: {
      onSuccess: (r: { credential?: string }) => void;
      onError: () => void;
    }) => (
      <>
        <button
          data-testid="google-success-btn"
          onClick={() => onSuccess({ credential: "mock-google-token" })}
        >
          Sign in with Google
        </button>
        <button
          data-testid="google-error-btn"
          onClick={() => onError()}
        >
          Google Error
        </button>
        <button
          data-testid="google-nocred-btn"
          onClick={() => onSuccess({})}
        >
          Google No Credential
        </button>
      </>
    )
  ),
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockImplementation((url: unknown) => {
      if (typeof url === "string" && url.includes("/api/auth/google-exchange")) {
        return Promise.resolve({
          data: { sessionToken: "google-session-tok", email: "gmail@example.com", name: "Gmail User", isAdmin: false },
        });
      }
      return Promise.resolve({ data: {} });
    }),
    isAxiosError: vi.fn().mockReturnValue(false),
    interceptors: {
      response: { use: vi.fn().mockReturnValue(1), eject: vi.fn() },
    },
  },
}));

afterEach(() => vi.clearAllMocks());

// ──────────────── helpers ────────────────

function openModal() {
  fireEvent.click(screen.getByRole("button", { name: /get started/i }));
}

function switchToRegister() {
  fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
}

// ──────────────── tests ────────────────

describe("LandingPage – Google Sign-In (Gmail)", () => {
  it("exchanges Google credential for a session token and calls onLogin", async () => {
    const onLogin = vi.fn();
    render(<LandingPage onLogin={onLogin} />);
    openModal();

    fireEvent.click(screen.getByTestId("google-success-btn"));

    await waitFor(() => expect(onLogin).toHaveBeenCalledOnce());
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Gmail User",
        email: "gmail@example.com",
        email_verified: true,
        token: "google-session-tok",
      })
    );
    expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/google-exchange"),
      { credential: "mock-google-token" }
    );
  });

  it("shows an error when the google-exchange API call fails", async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error("Network error"));
    const onLogin = vi.fn();
    render(<LandingPage onLogin={onLogin} />);
    openModal();

    fireEvent.click(screen.getByTestId("google-success-btn"));

    await waitFor(() =>
      expect(screen.getByText(/google sign-in failed/i)).toBeInTheDocument()
    );
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("shows an error message when Google sign-in fails", () => {
    const onLogin = vi.fn();
    render(<LandingPage onLogin={onLogin} />);
    openModal();

    fireEvent.click(screen.getByTestId("google-error-btn"));

    expect(screen.getByText(/google sign-in failed/i)).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("shows an error when Google returns no credential", () => {
    const onLogin = vi.fn();
    render(<LandingPage onLogin={onLogin} />);
    openModal();

    fireEvent.click(screen.getByTestId("google-nocred-btn"));

    expect(
      screen.getByText(/google did not return a credential/i)
    ).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("Google sign-in is also available in the Register tab", () => {
    render(<LandingPage onLogin={vi.fn()} />);
    openModal();
    switchToRegister();

    expect(screen.getByTestId("google-success-btn")).toBeInTheDocument();
  });

  it("Google sign-in from the Register tab also calls onLogin", async () => {
    const onLogin = vi.fn();
    render(<LandingPage onLogin={onLogin} />);
    openModal();
    switchToRegister();

    fireEvent.click(screen.getByTestId("google-success-btn"));

    await waitFor(() => expect(onLogin).toHaveBeenCalledOnce());
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Gmail User", token: "google-session-tok" })
    );
  });
});

describe("LandingPage – Email / Password Login", () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { name: "Email User", email: "user@test.com", sessionToken: "tok-abc" },
    });
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
  });

  it("shows Email Address and Password fields in the Sign In tab", () => {
    render(<LandingPage onLogin={vi.fn()} />);
    openModal();

    expect(screen.getByPlaceholderText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your password")).toBeInTheDocument();
  });

  it("calls onLogin with user data from API on successful login", async () => {
    const onLogin = vi.fn();
    render(<LandingPage onLogin={onLogin} />);
    openModal();

    const emailInput = screen.getByPlaceholderText("jane@example.com");
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "secret123" },
    });
    fireEvent.submit(emailInput.closest("form")!);

    await waitFor(() => expect(onLogin).toHaveBeenCalledOnce());
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Email User",
        email: "user@test.com",
        token: "tok-abc",
      })
    );
  });

  it("posts credentials to /api/users/login", async () => {
    render(<LandingPage onLogin={vi.fn()} />);
    openModal();

    const emailInput = screen.getByPlaceholderText("jane@example.com");
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "secret123" },
    });
    fireEvent.submit(emailInput.closest("form")!);

    await waitFor(() => expect(vi.mocked(axios.post)).toHaveBeenCalled());
    expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/login"),
      { email: "user@test.com", password: "secret123" }
    );
  });

  it("shows API error message when login fails with a server error", async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    vi.mocked(axios.post).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: "Invalid credentials." } },
    });

    render(<LandingPage onLogin={vi.fn()} />);
    openModal();

    const emailInput = screen.getByPlaceholderText("jane@example.com");
    fireEvent.change(emailInput, { target: { value: "bad@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "wrongpass" },
    });
    fireEvent.submit(emailInput.closest("form")!);

    await waitFor(() =>
      expect(screen.getByText("Invalid credentials.")).toBeInTheDocument()
    );
  });

  it("shows default error text when login fails with no server message", async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
    vi.mocked(axios.post).mockRejectedValue(new Error("Network Error"));

    render(<LandingPage onLogin={vi.fn()} />);
    openModal();

    const emailInput = screen.getByPlaceholderText("jane@example.com");
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "secret123" },
    });
    fireEvent.submit(emailInput.closest("form")!);

    await waitFor(() =>
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    );
  });
});

describe("LandingPage – Registration", () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { name: "New User", email: "new@test.com", sessionToken: "tok-reg" },
    });
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
  });

  it("shows Full Name, Email, Password, and Confirm Password fields", () => {
    render(<LandingPage onLogin={vi.fn()} />);
    openModal();
    switchToRegister();

    expect(screen.getByPlaceholderText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("At least 6 characters")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repeat password")).toBeInTheDocument();
  });

  it("shows validation error when passwords do not match (no API call made)", async () => {
    render(<LandingPage onLogin={vi.fn()} />);
    openModal();
    switchToRegister();

    fireEvent.change(screen.getByPlaceholderText("Jane Smith"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByPlaceholderText("jane@example.com"), { target: { value: "a@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), { target: { value: "pass123" } });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(vi.mocked(axios.post)).not.toHaveBeenCalled();
  });

  it("shows validation error when password is shorter than 6 characters (no API call made)", async () => {
    render(<LandingPage onLogin={vi.fn()} />);
    openModal();
    switchToRegister();

    fireEvent.change(screen.getByPlaceholderText("Jane Smith"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByPlaceholderText("jane@example.com"), { target: { value: "a@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), { target: { value: "abc" } });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    expect(vi.mocked(axios.post)).not.toHaveBeenCalled();
  });

  it("calls onLogin with user data after successful registration", async () => {
    const onLogin = vi.fn();
    render(<LandingPage onLogin={onLogin} />);
    openModal();
    switchToRegister();

    fireEvent.change(screen.getByPlaceholderText("Jane Smith"), { target: { value: "New User" } });
    fireEvent.change(screen.getByPlaceholderText("jane@example.com"), { target: { value: "new@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), { target: { value: "secure99" } });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), { target: { value: "secure99" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledOnce());
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New User",
        email: "new@test.com",
        token: "tok-reg",
      })
    );
  });

  it("posts to /api/users/register with name, email, and password", async () => {
    render(<LandingPage onLogin={vi.fn()} />);
    openModal();
    switchToRegister();

    fireEvent.change(screen.getByPlaceholderText("Jane Smith"), { target: { value: "New User" } });
    fireEvent.change(screen.getByPlaceholderText("jane@example.com"), { target: { value: "new@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), { target: { value: "secure99" } });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), { target: { value: "secure99" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(vi.mocked(axios.post)).toHaveBeenCalled());
    expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/register"),
      { name: "New User", email: "new@test.com", password: "secure99" }
    );
  });

  it("shows API error message when registration fails", async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    vi.mocked(axios.post).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: "Email already registered." } },
    });

    render(<LandingPage onLogin={vi.fn()} />);
    openModal();
    switchToRegister();

    fireEvent.change(screen.getByPlaceholderText("Jane Smith"), { target: { value: "Dup User" } });
    fireEvent.change(screen.getByPlaceholderText("jane@example.com"), { target: { value: "dup@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), { target: { value: "pass123" } });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), { target: { value: "pass123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText("Email already registered.")).toBeInTheDocument()
    );
  });
});

describe("LandingPage – Session Message Banner", () => {
  it("shows the session banner when sessionMsg is provided", () => {
    render(
      <LandingPage
        onLogin={vi.fn()}
        sessionMsg="You were signed out after 30 minutes of inactivity."
      />
    );

    expect(
      screen.getByText(/you were signed out after 30 minutes/i)
    ).toBeInTheDocument();
  });

  it("includes the inactivity reason in the banner", () => {
    render(
      <LandingPage
        onLogin={vi.fn()}
        sessionMsg="You were signed out after 30 minutes of inactivity."
      />
    );
    const banner = document.querySelector(".fw-session-banner");
    expect(banner).toBeInTheDocument();
    expect(banner?.textContent).toMatch(/30 minutes of inactivity/i);
  });

  it("shows the token-expired reason when signed out via 401", () => {
    render(
      <LandingPage
        onLogin={vi.fn()}
        sessionMsg="Your session has expired. Please sign in again."
      />
    );

    expect(
      screen.getByText(/your session has expired/i)
    ).toBeInTheDocument();
  });

  it("does not show the session banner when sessionMsg is null", () => {
    render(<LandingPage onLogin={vi.fn()} sessionMsg={null} />);

    expect(document.querySelector(".fw-session-banner")).not.toBeInTheDocument();
  });

  it("does not show the session banner when sessionMsg is not provided", () => {
    render(<LandingPage onLogin={vi.fn()} />);

    expect(document.querySelector(".fw-session-banner")).not.toBeInTheDocument();
  });
});
