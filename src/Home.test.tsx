import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from './Home';
import axios from 'axios';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  }
}));

vi.mock('./Dashboard', () => ({
  default: () => <div data-testid="dashboard-mock">Dashboard</div>,
}));

const mockUser = {
  name: 'Test User',
  email: 'test@example.com',
  picture: '',
  email_verified: true,
  exp: 9999999999,
  iat: 1700000000,
  token: 'mock-token',
};

beforeEach(() => {
  vi.mocked(axios.get).mockImplementation((url: unknown) => {
    if (typeof url === 'string' && url.includes('/api/cases')) {
      return Promise.resolve({ data: [] });
    }
    if (typeof url === 'string' && url.includes('/api/admin')) {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: null });
  });
  vi.mocked(axios.put).mockResolvedValue({ data: {} });
  vi.mocked(axios.post).mockResolvedValue({ data: {} });
});

afterEach(() => {
  vi.clearAllMocks();
});

// Helper: hover over Financial AI Solutions to open dropdown
const openDropdown = () => {
  const btn = screen.getByRole('button', { name: /Financial AI Solutions/i });
  const wrapper = btn.closest('div')!;
  fireEvent.mouseEnter(wrapper);
  return wrapper;
};

describe('Home – top navbar', () => {
  it('renders Home nav link', () => {
    render(<Home user={mockUser} />);
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders Financial AI Solutions nav link', () => {
    render(<Home user={mockUser} />);
    expect(screen.getByRole('button', { name: /Financial AI Solutions/i })).toBeInTheDocument();
  });

  it('renders Contact Us nav link', () => {
    render(<Home user={mockUser} />);
    expect(screen.getByRole('button', { name: 'Contact Us' })).toBeInTheDocument();
  });

  it('renders user name in navbar', () => {
    render(<Home user={mockUser} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders Logout button', () => {
    render(<Home user={mockUser} />);
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('calls onLogout when Logout is clicked', () => {
    const onLogout = vi.fn();
    render(<Home user={mockUser} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('default view shows Financial AI Audit Dashboard heading', () => {
    render(<Home user={mockUser} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Financial AI Audit Dashboard' })).toBeInTheDocument();
  });

  it('clicking Home navigates to AI Audit Dashboard', () => {
    render(<Home user={mockUser} />);
    fireEvent.click(screen.getByRole('button', { name: 'Contact Us' }));
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Financial AI Audit Dashboard' })).toBeInTheDocument();
  });

  it('clicking Contact Us shows contact page', () => {
    render(<Home user={mockUser} />);
    fireEvent.click(screen.getByRole('button', { name: 'Contact Us' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Contact Us' })).toBeInTheDocument();
    expect(screen.getByText('support@finwiseai.com')).toBeInTheDocument();
  });

  it('clicking admin icon navigates to admin panel', () => {
    render(<Home user={mockUser} />);
    fireEvent.click(screen.getByTitle('Admin Panel'));
    expect(screen.getByRole('heading', { level: 2, name: 'Administrative System Analytics' })).toBeInTheDocument();
  });
});

describe('Home – Financial AI Solutions dropdown', () => {
  it('dropdown is hidden by default', () => {
    render(<Home user={mockUser} />);
    expect(screen.queryByRole('button', { name: /Evaluate Financials/i })).not.toBeInTheDocument();
  });

  it('shows dropdown items on mouse enter', () => {
    render(<Home user={mockUser} />);
    openDropdown();
    expect(screen.getByRole('button', { name: /Evaluate Financials/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Credit Card Analyzer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Your Stocks Analyzer/i })).toBeInTheDocument();
  });

  it('hides dropdown items on mouse leave', () => {
    render(<Home user={mockUser} />);
    const wrapper = openDropdown();
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole('button', { name: /Evaluate Financials/i })).not.toBeInTheDocument();
  });

  it('clicking Credit Card Analyzer opens upload tab', () => {
    render(<Home user={mockUser} />);
    openDropdown();
    fireEvent.click(screen.getByRole('button', { name: /Credit Card Analyzer/i }));
    expect(screen.getByTestId('dashboard-mock')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Credit Card Statement Analysis' })).toBeInTheDocument();
  });

  it('clicking Your Stocks Analyzer opens stocks placeholder', () => {
    render(<Home user={mockUser} />);
    openDropdown();
    fireEvent.click(screen.getByRole('button', { name: /Your Stocks Analyzer/i }));
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });
});

describe('Home – Evaluate Financials wizard', () => {
  const startWizard = () => {
    openDropdown();
    fireEvent.click(screen.getByRole('button', { name: /Evaluate Financials/i }));
  };

  it('shows all four wizard step labels after starting', () => {
    render(<Home user={mockUser} />);
    startWizard();
    expect(screen.getByText('Personal Profile')).toBeInTheDocument();
    expect(screen.getByText('Financial Data')).toBeInTheDocument();
    expect(screen.getByText('AI Analysis')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('step 1 shows Edit Personal Profile content', () => {
    render(<Home user={mockUser} />);
    startWizard();
    expect(screen.getByRole('heading', { level: 2, name: 'Edit Personal Profile' })).toBeInTheDocument();
  });

  it('does not show Back button at step 1', () => {
    render(<Home user={mockUser} />);
    startWizard();
    expect(screen.queryByRole('button', { name: /← Back/i })).not.toBeInTheDocument();
  });

  it('Next button advances to step 2 (Financial Data)', () => {
    render(<Home user={mockUser} />);
    startWizard();
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    expect(screen.getByRole('heading', { level: 2, name: 'Asset & Liability Manager' })).toBeInTheDocument();
  });

  it('Back button at step 2 returns to step 1', () => {
    render(<Home user={mockUser} />);
    startWizard();
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    fireEvent.click(screen.getByRole('button', { name: /← Back/i }));
    expect(screen.getByRole('heading', { level: 2, name: 'Edit Personal Profile' })).toBeInTheDocument();
  });

  it('Next from step 2 goes to step 3 (AI Analysis)', () => {
    render(<Home user={mockUser} />);
    startWizard();
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    expect(screen.getByRole('heading', { level: 2, name: 'Financial AI Audit Dashboard' })).toBeInTheDocument();
  });

  it('Next from step 3 goes to step 4 (Recommendations)', () => {
    render(<Home user={mockUser} />);
    startWizard();
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    expect(screen.getByRole('heading', { level: 2, name: 'Personalized Financial Product Offers' })).toBeInTheDocument();
  });

  it('shows Finish button at step 4 instead of Next', () => {
    render(<Home user={mockUser} />);
    startWizard();
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    }
    expect(screen.queryByRole('button', { name: /Next →/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finish ✓/i })).toBeInTheDocument();
  });

  it('Exit Wizard button dismisses the wizard stepper', () => {
    render(<Home user={mockUser} />);
    startWizard();
    fireEvent.click(screen.getByRole('button', { name: 'Exit Wizard' }));
    expect(screen.queryByRole('button', { name: 'Exit Wizard' })).not.toBeInTheDocument();
  });

  it('Finish button exits wizard and returns to home', async () => {
    render(<Home user={mockUser} />);
    startWizard();
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Finish ✓/i }));
    expect(screen.queryByRole('button', { name: 'Exit Wizard' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Financial AI Audit Dashboard' })).toBeInTheDocument();
  });

  it('wizard stepper hides when Home nav is clicked', () => {
    render(<Home user={mockUser} />);
    startWizard();
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.queryByRole('button', { name: 'Exit Wizard' })).not.toBeInTheDocument();
  });
});
