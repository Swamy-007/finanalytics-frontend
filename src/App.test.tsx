import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

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
  },
}));

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
