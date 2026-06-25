import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios, { AxiosError } from 'axios';
import Dashboard from './Dashboard';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    isAxiosError: vi.fn(),
  }
}));

vi.mock('./SpendingChart', () => ({
  default: ({ transactions }: { transactions: { category: string; amount: number }[] }) => (
    <div data-testid="spending-chart">Chart: {transactions.length} items</div>
  ),
}));

vi.mock('./InsightsPanel', () => ({
  default: ({ insights }: { insights: string }) => (
    <div data-testid="insights-panel">{insights}</div>
  ),
}));

beforeEach(() => {
  vi.mocked(axios.isAxiosError).mockReturnValue(false);
});

afterEach(() => {
  vi.clearAllMocks();
});

const makeFile = (name: string, sizeBytes: number, type = 'application/pdf'): File => {
  const file = new File(['x'.repeat(sizeBytes)], name, { type });
  return file;
};

const selectFile = (input: Element, file: File) => {
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
};

describe('Dashboard – initial render', () => {
  it('renders the Spendwise AI heading', () => {
    render(<Dashboard />);
    expect(screen.getByText('Spendwise AI')).toBeInTheDocument();
  });

  it('renders the upload prompt text', () => {
    render(<Dashboard />);
    expect(screen.getByText('Choose a PDF or CSV file')).toBeInTheDocument();
  });

  it('renders the file size hint', () => {
    render(<Dashboard />);
    expect(screen.getByText('Click to browse — max 10 MB')).toBeInTheDocument();
  });

  it('does not show loading state initially', () => {
    render(<Dashboard />);
    expect(screen.queryByText(/Analyzing your statement/i)).not.toBeInTheDocument();
  });

  it('does not show results section initially', () => {
    render(<Dashboard />);
    expect(screen.queryByTestId('spending-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('insights-panel')).not.toBeInTheDocument();
  });
});

describe('Dashboard – file selection', () => {
  it('shows the selected file name after choosing a file', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { transactions: [], insights: '' }
    });
    const { container } = render(<Dashboard />);
    const input = container.querySelector('input[type="file"]')!;
    selectFile(input, makeFile('statement.pdf', 1024));
    expect(screen.getByText('statement.pdf')).toBeInTheDocument();
  });

  it('shows error when file exceeds 10 MB', () => {
    const { container } = render(<Dashboard />);
    const input = container.querySelector('input[type="file"]')!;
    selectFile(input, makeFile('huge.pdf', 11 * 1024 * 1024));
    expect(screen.getByText(/File too large/i)).toBeInTheDocument();
  });

  it('does not start upload for oversized file', () => {
    const { container } = render(<Dashboard />);
    const input = container.querySelector('input[type="file"]')!;
    selectFile(input, makeFile('huge.pdf', 11 * 1024 * 1024));
    expect(axios.post).not.toHaveBeenCalled();
  });
});

describe('Dashboard – upload states', () => {
  it('shows loading indicator while upload is in progress', async () => {
    vi.mocked(axios.post).mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<Dashboard />);
    const input = container.querySelector('input[type="file"]')!;
    selectFile(input, makeFile('statement.pdf', 1024));
    await waitFor(() => {
      expect(screen.getByText(/Analyzing your statement with AI/i)).toBeInTheDocument();
    });
  });

  it('shows results after successful upload', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        transactions: [
          { date: '2024-01-01', description: 'Coffee', amount: 5, category: 'Dining' },
        ],
        insights: 'Good spending habits',
      }
    });
    const { container } = render(<Dashboard />);
    const input = container.querySelector('input[type="file"]')!;
    selectFile(input, makeFile('statement.pdf', 1024));
    await waitFor(() => {
      expect(screen.getByTestId('spending-chart')).toBeInTheDocument();
      expect(screen.getByTestId('insights-panel')).toBeInTheDocument();
    });
  });

  it('shows transaction count badge after successful upload', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        transactions: [
          { date: '2024-01-01', description: 'Coffee', amount: 5, category: 'Dining' },
          { date: '2024-01-02', description: 'Uber', amount: 12, category: 'Transport' },
        ],
        insights: '',
      }
    });
    const { container } = render(<Dashboard />);
    const input = container.querySelector('input[type="file"]')!;
    selectFile(input, makeFile('statement.pdf', 1024));
    await waitFor(() => {
      expect(screen.getByText(/2 transactions analyzed/i)).toBeInTheDocument();
    });
  });

  it('shows generic error when a non-axios error occurs', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('Network failure'));
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
    const { container } = render(<Dashboard />);
    const input = container.querySelector('input[type="file"]')!;
    selectFile(input, makeFile('statement.pdf', 1024));
    // UI renders the error as "⚠ <message>" so use a regex
    await waitFor(() => {
      expect(screen.getByText(/Network failure/)).toBeInTheDocument();
    });
  });

  it('shows API error message from axios error response', async () => {
    const axiosErr = {
      response: { data: { error: 'Invalid PDF format' } },
      message: 'Request failed',
      isAxiosError: true,
    } as unknown as AxiosError<{ error: string }>;
    vi.mocked(axios.post).mockRejectedValue(axiosErr);
    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    const { container } = render(<Dashboard />);
    const input = container.querySelector('input[type="file"]')!;
    selectFile(input, makeFile('statement.pdf', 1024));
    await waitFor(() => {
      expect(screen.getByText(/Invalid PDF format/)).toBeInTheDocument();
    });
  });

  it('shows fallback error text when axios error has no response body', async () => {
    const axiosErr = {
      response: undefined,
      message: 'timeout of 0ms exceeded',
      isAxiosError: true,
    } as unknown as AxiosError<{ error: string }>;
    vi.mocked(axios.post).mockRejectedValue(axiosErr);
    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    const { container } = render(<Dashboard />);
    const input = container.querySelector('input[type="file"]')!;
    selectFile(input, makeFile('statement.pdf', 1024));
    await waitFor(() => {
      expect(screen.getByText(/timeout of 0ms exceeded/)).toBeInTheDocument();
    });
  });

  it('hides loading indicator after upload completes', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { transactions: [], insights: '' }
    });
    const { container } = render(<Dashboard />);
    const input = container.querySelector('input[type="file"]')!;
    selectFile(input, makeFile('statement.pdf', 1024));
    await waitFor(() => {
      expect(screen.queryByText(/Analyzing your statement/i)).not.toBeInTheDocument();
    });
  });
});
