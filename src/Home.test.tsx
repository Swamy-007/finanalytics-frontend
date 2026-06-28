import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './Home';
import axios from 'axios';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    isAxiosError: (err: unknown): boolean =>
      typeof err === 'object' && err !== null && (err as Record<string, unknown>)['isAxiosError'] === true,
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

const mockProfileData = {
  firstName: '', lastName: '', address: '', phone: '',
  email: 'test@example.com', ageRange: '',
  familyMembers: [], dependents: [],
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
  vi.mocked(axios.put).mockResolvedValue({ data: mockProfileData });
  vi.mocked(axios.post).mockImplementation((url: unknown) => {
    if (typeof url === 'string' && url.includes('/api/auth/sync')) {
      return Promise.resolve({ data: { ok: true, isAdmin: false } });
    }
    return Promise.resolve({ data: {
      assets: [], liabilities: [],
      primaryYearlyIncome: 0, familyYearlyIncome: 0,
      expenditures: [], savings: [],
    } });
  });
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
    expect(screen.getByTestId('desktop-logout-btn')).toBeInTheDocument();
  });

  it('calls onLogout when Logout is clicked', () => {
    const onLogout = vi.fn();
    render(<Home user={mockUser} onLogout={onLogout} />);
    fireEvent.click(screen.getByTestId('desktop-logout-btn'));
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

  it('clicking admin icon navigates to admin panel', async () => {
    vi.mocked(axios.post).mockImplementation((url: unknown) => {
      if (typeof url === 'string' && url.includes('/api/auth/sync')) {
        return Promise.resolve({ data: { ok: true, isAdmin: true } });
      }
      return Promise.resolve({ data: { assets: [], liabilities: [], primaryYearlyIncome: 0, familyYearlyIncome: 0, expenditures: [], savings: [] } });
    });
    render(<Home user={mockUser} />);
    await waitFor(() => expect(screen.getByTestId('desktop-admin-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('desktop-admin-btn'));
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

  it('Next button advances to step 2 (Financial Data)', async () => {
    render(<Home user={mockUser} />);
    startWizard();
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Asset & Liability Manager' })).toBeInTheDocument();
    });
  });

  it('Back button at step 2 returns to step 1', async () => {
    render(<Home user={mockUser} />);
    startWizard();
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Asset & Liability Manager' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /← Back/i }));
    expect(screen.getByRole('heading', { level: 2, name: 'Edit Personal Profile' })).toBeInTheDocument();
  });

  it('Next from step 2 goes to step 3 (AI Analysis)', async () => {
    render(<Home user={mockUser} />);
    startWizard();
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Asset & Liability Manager' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Financial AI Audit Dashboard' })).toBeInTheDocument();
    });
  });

  it('Next from step 3 goes to step 4 (Recommendations)', async () => {
    render(<Home user={mockUser} />);
    startWizard();
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Asset & Liability Manager' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Financial AI Audit Dashboard' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Personalized Financial Product Offers' })).toBeInTheDocument();
    });
  });

  it('shows Finish button at step 4 instead of Next', async () => {
    render(<Home user={mockUser} />);
    startWizard();
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Asset & Liability Manager' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Financial AI Audit Dashboard' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Next →/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Finish ✓/i })).toBeInTheDocument();
    });
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
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Asset & Liability Manager' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Financial AI Audit Dashboard' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Finish ✓/i })).toBeInTheDocument());
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

// ─── helpers shared by financial-data tests ────────────────────────────────
const goToStep2 = async () => {
  const btn = screen.getByRole('button', { name: /Financial AI Solutions/i });
  fireEvent.mouseEnter(btn.closest('div')!);
  fireEvent.click(screen.getByRole('button', { name: /Evaluate Financials/i }));
  fireEvent.click(screen.getByRole('button', { name: /Next →/i })); // step 1 → 2 (auto-saves profile)
  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 2, name: 'Asset & Liability Manager' })).toBeInTheDocument();
  });
};

const mockFinancialData = {
  assets: [], liabilities: [],
  primaryYearlyIncome: 0, familyYearlyIncome: 0,
  expenditures: [{ type: 'credit_card', description: 'Credit Card Bill', monthlyAmount: 0 }],
  savings: [{ type: '401k', description: '401(k) / Employer Plan', monthlyContribution: 0 }],
};

describe('Home – Financial Data step (step 2)', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockImplementation((url: unknown) => {
      if (typeof url === 'string' && url.includes('/api/cases')) return Promise.resolve({ data: [] });
      if (typeof url === 'string' && url.includes('/api/admin')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: null });
    });
    vi.mocked(axios.put).mockResolvedValue({ data: mockProfileData });
    vi.mocked(axios.post).mockResolvedValue({ data: mockFinancialData });
  });
  afterEach(() => vi.clearAllMocks());

  // ── Page presence ──────────────────────────────────────────────────────────
  it('navigating to step 2 shows Asset & Liability Manager heading', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    expect(screen.getByRole('heading', { level: 2, name: 'Asset & Liability Manager' })).toBeInTheDocument();
  });

  it('step 2 shows Income section heading', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    expect(screen.getByRole('heading', { level: 3, name: 'Income' })).toBeInTheDocument();
  });

  it('step 2 shows Monthly Expenditures section heading', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    expect(screen.getByRole('heading', { level: 3, name: 'Monthly Expenditures' })).toBeInTheDocument();
  });

  it('step 2 shows Monthly Savings section heading', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    expect(screen.getByRole('heading', { level: 3, name: 'Monthly Savings' })).toBeInTheDocument();
  });

  it('Primary Yearly Income input is present', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    expect(screen.getByLabelText(/Primary Yearly Income/i)).toBeInTheDocument();
  });

  it('Family Yearly Income input is present', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    expect(screen.getByLabelText(/Family \/ Household Yearly Income/i)).toBeInTheDocument();
  });

  // ── Income fields ──────────────────────────────────────────────────────────
  it('entering primary yearly income updates the value', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    const input = screen.getByLabelText(/Primary Yearly Income/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '80000' } });
    expect(input.value).toBe('80000');
  });

  it('shows combined yearly income when both income fields are filled', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    fireEvent.change(screen.getByLabelText(/Primary Yearly Income/i), { target: { value: '80000' } });
    fireEvent.change(screen.getByLabelText(/Family \/ Household Yearly Income/i), { target: { value: '40000' } });
    expect(screen.getByText(/\$120,000/)).toBeInTheDocument();
  });

  // ── Expenditure table ──────────────────────────────────────────────────────
  it('shows one expenditure row by default (credit card bill)', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    const selects = screen.getAllByDisplayValue('Credit Card Bill');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it('Add Expenditure button appends a new expenditure row', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    const before = screen.getAllByDisplayValue('Credit Card Bill').length;
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Expenditure/i }));
    expect(screen.getAllByDisplayValue('Credit Card Bill').length).toBe(before + 1);
  });

  it('expenditure type dropdown can be changed to Insurance Bill', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    const select = screen.getAllByDisplayValue('Credit Card Bill')[0] as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'insurance' } });
    expect((select as HTMLSelectElement).value).toBe('insurance');
  });

  it('remove button (×) is absent when only one expenditure row exists', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    const removeButtons = screen.queryAllByRole('button', { name: '×' });
    expect(removeButtons.length).toBe(0);
  });

  it('remove button (×) appears after adding a second expenditure row', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Expenditure/i }));
    const removeButtons = screen.getAllByRole('button', { name: '×' });
    expect(removeButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('clicking × on expenditure row removes it', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Expenditure/i }));
    const before = screen.getAllByDisplayValue('Credit Card Bill').length;
    const firstRemove = screen.getAllByRole('button', { name: '×' })[0]!;
    fireEvent.click(firstRemove);
    expect(screen.getAllByDisplayValue('Credit Card Bill').length).toBe(before - 1);
  });

  // ── Savings table ──────────────────────────────────────────────────────────
  it('shows one savings row by default (401k)', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    expect(screen.getByDisplayValue('401(k) / Employer Plan')).toBeInTheDocument();
  });

  it('Add Saving button appends a new savings row', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    const before = screen.getAllByDisplayValue('401(k) / Employer Plan').length;
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Saving/i }));
    expect(screen.getAllByDisplayValue('401(k) / Employer Plan').length).toBe(before + 1);
  });

  it('savings type dropdown can be changed to IRA', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    const select = screen.getByDisplayValue('401(k) / Employer Plan') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'ira' } });
    expect(select.value).toBe('ira');
  });

  it('clicking × on savings row removes it', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Saving/i }));
    const removeButtons = screen.getAllByRole('button', { name: '×' });
    const before = screen.getAllByDisplayValue('401(k) / Employer Plan').length;
    fireEvent.click(removeButtons[removeButtons.length - 1]!);
    expect(screen.getAllByDisplayValue('401(k) / Employer Plan').length).toBe(before - 1);
  });

  // ── Next button navigation ─────────────────────────────────────────────────
  it('Next → button is present on step 2', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    expect(screen.getByRole('button', { name: /Next →/i })).toBeInTheDocument();
  });

  it('Next → from step 2 navigates to step 3 (AI Analysis / health tab)', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Financial AI Audit Dashboard' })).toBeInTheDocument();
    });
  });

  it('Next → from step 2 works even when income fields are 0 (not required to fill before advancing)', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    const incomeInput = screen.getByLabelText(/Primary Yearly Income/i) as HTMLInputElement;
    expect(incomeInput.value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Financial AI Audit Dashboard' })).toBeInTheDocument();
    });
  });

  it('← Back from step 3 returns to step 2 (financial data)', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    fireEvent.click(screen.getByRole('button', { name: /Next →/i })); // step 2 → 3 (auto-saves financial)
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Financial AI Audit Dashboard' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /← Back/i })); // step 3 → 2 (sync)
    expect(screen.getByRole('heading', { level: 2, name: 'Asset & Liability Manager' })).toBeInTheDocument();
  });

  // ── Save Financial Portfolio ────────────────────────────────────────────────
  it('Save Financial Portfolio button is present on step 2', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    expect(screen.getByRole('button', { name: /Save Financial Portfolio/i })).toBeInTheDocument();
  });

  it('Save Financial Portfolio posts data to /api/financial-data', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        assets: [], liabilities: [],
        primaryYearlyIncome: 80000, familyYearlyIncome: 0,
        expenditures: [{ type: 'credit_card', description: '', monthlyAmount: 500 }],
        savings: [{ type: '401k', description: '', monthlyContribution: 200 }],
      }
    });
    render(<Home user={mockUser} />);
    await goToStep2();
    fireEvent.change(screen.getByLabelText(/Primary Yearly Income/i), { target: { value: '80000' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Financial Portfolio/i }));
    await waitFor(() => {
      expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
        expect.stringContaining('/api/financial-data'),
        expect.objectContaining({ primaryYearlyIncome: 80000 }),
        expect.any(Object)
      );
    });
  });

  it('shows success message after saving financial data', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { assets: [], liabilities: [], primaryYearlyIncome: 0, familyYearlyIncome: 0, expenditures: [], savings: [] }
    });
    render(<Home user={mockUser} />);
    await goToStep2();
    fireEvent.click(screen.getByRole('button', { name: /Save Financial Portfolio/i }));
    await waitFor(() => {
      expect(screen.getByText(/Financial profile saved successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error message when saving financial data fails', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    vi.mocked(axios.post).mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Server error' } } });
    fireEvent.click(screen.getByRole('button', { name: /Save Financial Portfolio/i }));
    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    });
  });

  // ── Total summaries ────────────────────────────────────────────────────────
  it('shows total monthly expenditure sum at bottom of expenditure section', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    expect(screen.getByText(/Total Monthly Expenditure/i)).toBeInTheDocument();
  });

  it('shows total monthly savings sum at bottom of savings section', async () => {
    render(<Home user={mockUser} />);
    await goToStep2();
    expect(screen.getByText(/Total Monthly Savings/i)).toBeInTheDocument();
  });
});

// ── Recommendations tab ────────────────────────────────────────────────────────

describe('Home – Recommendations tab', () => {
  const mockCases = [
    {
      id: 'case_1',
      productId: 'prod_1',
      status: 'Recommended',
      reasoning: 'You would benefit from this product.',
      applicationDetails: null,
      updatedAt: new Date().toISOString(),
      product: {
        id: 'prod_1',
        name: 'Test Credit Card',
        category: 'Credit Card',
        description: 'A great card',
        features: [],
        benefits: [],
        eligibility: {},
        interestRate: '',
        creditLimit: '',
      },
    },
  ];

  // Navigate to the Recommendations tab via wizard steps 1→2→3→4
  const goToRecommendations = async () => {
    const btn = screen.getByRole('button', { name: /Financial AI Solutions/i });
    fireEvent.mouseEnter(btn.closest('div')!);
    fireEvent.click(screen.getByRole('button', { name: /Evaluate Financials/i }));

    // Step 1 → 2
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Asset & Liability Manager' })).toBeInTheDocument();
    });

    // Step 2 → 3
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Financial AI Audit Dashboard/i })).toBeInTheDocument();
    });

    // Step 3 → 4 (sync)
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Personalized Financial Product Offers/i })).toBeInTheDocument();
    });
  };

  it('Refresh Offers button is present on the recommendations tab', async () => {
    render(<Home user={mockUser} />);
    await goToRecommendations();
    expect(screen.getByRole('button', { name: /Refresh Offers/i })).toBeInTheDocument();
  });

  it('clicking Refresh Offers calls GET /api/cases', async () => {
    vi.mocked(axios.get).mockImplementation((url: unknown) => {
      if (typeof url === 'string' && url.includes('/api/cases')) {
        return Promise.resolve({ data: mockCases });
      }
      return Promise.resolve({ data: null });
    });
    render(<Home user={mockUser} />);
    await goToRecommendations();

    vi.mocked(axios.get).mockClear();
    fireEvent.click(screen.getByRole('button', { name: /Refresh Offers/i }));

    await waitFor(() => {
      expect(vi.mocked(axios.get)).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.anything()
      );
    });
  });

  it('Refresh Offers button shows "Refreshing…" while loading then reverts', async () => {
    let resolveCases!: (v: unknown) => void;
    vi.mocked(axios.get).mockImplementation((url: unknown) => {
      if (typeof url === 'string' && url.includes('/api/cases')) {
        return new Promise(resolve => { resolveCases = resolve; });
      }
      return Promise.resolve({ data: null });
    });
    render(<Home user={mockUser} />);
    await goToRecommendations();

    fireEvent.click(screen.getByRole('button', { name: /Refresh Offers/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refreshing…/i })).toBeInTheDocument();
    });

    resolveCases({ data: [] });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh Offers/i })).toBeInTheDocument();
    });
  });

  it('renders case cards after a successful refresh', async () => {
    vi.mocked(axios.get).mockImplementation((url: unknown) => {
      if (typeof url === 'string' && url.includes('/api/cases')) {
        return Promise.resolve({ data: mockCases });
      }
      return Promise.resolve({ data: null });
    });
    render(<Home user={mockUser} />);
    await goToRecommendations();

    fireEvent.click(screen.getByRole('button', { name: /Refresh Offers/i }));
    await waitFor(() => {
      expect(screen.getByText('Test Credit Card')).toBeInTheDocument();
    });
  });

  it('shows an error message when Refresh Offers fails', async () => {
    vi.mocked(axios.get).mockImplementation((url: unknown) => {
      if (typeof url === 'string' && url.includes('/api/cases')) {
        return Promise.reject({ isAxiosError: true, response: { data: { error: 'Server unavailable' } } });
      }
      return Promise.resolve({ data: null });
    });
    render(<Home user={mockUser} />);
    await goToRecommendations();

    // Clear call count from initial mount, then trigger refresh
    vi.mocked(axios.get).mockClear();
    vi.mocked(axios.get).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Server unavailable' } },
    });
    fireEvent.click(screen.getByRole('button', { name: /Refresh Offers/i }));
    await waitFor(() => {
      expect(screen.getByText(/Server unavailable/i)).toBeInTheDocument();
    });
  });
});
