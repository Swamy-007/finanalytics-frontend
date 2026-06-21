import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the GoogleLogin component from @react-oauth/google
vi.mock('@react-oauth/google', () => {
  return {
    GoogleLogin: vi.fn().mockImplementation(({ onSuccess, onError }) => {
      return (
        <div data-testid="google-login-mock">
          <button onClick={() => onSuccess({ credential: 'mock-google-token' })}>
            Mock Success Login
          </button>
          <button onClick={onError}>Mock Fail Login</button>
        </div>
      );
    }),
  };
});

describe('App Component', () => {
  it('should render the login page header', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /login with google/i })).toBeInTheDocument();
  });

  it('should render the mocked google login button', () => {
    render(<App />);
    expect(screen.getByTestId('google-login-mock')).toBeInTheDocument();
  });
});
