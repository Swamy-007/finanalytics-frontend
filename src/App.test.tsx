import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: vi.fn().mockImplementation(({ onSuccess, onError }: {
    onSuccess: (resp: { credential: string }) => void;
    onError: () => void;
  }) => (
    <div data-testid="google-login-mock">
      <button onClick={() => onSuccess({ credential: 'mock-google-token' })}>
        Mock Success Login
      </button>
      <button onClick={onError}>Mock Fail Login</button>
    </div>
  )),
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({
    name: 'Test User',
    email: 'test@example.com',
    picture: '',
    email_verified: true,
    exp: 9999999999,
    iat: 1700000000,
  }),
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    isAxiosError: vi.fn().mockReturnValue(false),
    interceptors: {
      response: { use: vi.fn().mockReturnValue(1), eject: vi.fn() },
    },
  },
}));

// Home's financial-data fetch returns empty — safe with defensive ?? [] guards
function setupHomeApiMocks() {
  vi.mocked(axios.get).mockResolvedValue({ data: {} });
}

describe('App – completed login flows', () => {
  it('renders Home after successful Google sign-in', async () => {
    setupHomeApiMocks();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /mock success login/i }));

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /financial ai audit dashboard/i })
      ).toBeInTheDocument()
    );
    expect(screen.queryByTestId('google-login-mock')).not.toBeInTheDocument();
  });

  it('renders Home after successful email / password login', async () => {
    setupHomeApiMocks();
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { name: 'Email User', email: 'email@test.com', sessionToken: 'tok-email' },
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    const emailInput = screen.getByPlaceholderText('jane@example.com');
    fireEvent.change(emailInput, { target: { value: 'email@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Your password'), {
      target: { value: 'password123' },
    });
    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /financial ai audit dashboard/i })
      ).toBeInTheDocument()
    );
  });
});

describe('App – landing page', () => {
  it('renders the hero heading on the landing page', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /your smartest financial decisions start here/i })
    ).toBeInTheDocument();
  });

  it('shows AI Solutions nav button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /AI Solutions/i })).toBeInTheDocument();
  });

  it('shows the auth modal with Google login when Get Started is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    expect(screen.getByTestId('google-login-mock')).toBeInTheDocument();
  });

  it('shows Register tab in auth modal', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('closes auth modal when close button is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(screen.queryByTestId('google-login-mock')).not.toBeInTheDocument();
  });
});
