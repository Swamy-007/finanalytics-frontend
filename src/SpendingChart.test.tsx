import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SpendingChart from './SpendingChart';

// recharts uses ResizeObserver and SVG which jsdom doesn't fully support
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('SpendingChart – empty state', () => {
  it('shows "No spending data" message when given no transactions', () => {
    render(<SpendingChart transactions={[]} />);
    expect(screen.getByText('No spending data to display.')).toBeInTheDocument();
  });

  it('does not render the pie chart when there are no transactions', () => {
    render(<SpendingChart transactions={[]} />);
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });
});

describe('SpendingChart – with data', () => {
  const transactions = [
    { date: '2024-01-01', description: 'Starbucks', amount: 5.5, category: 'Dining' },
    { date: '2024-01-02', description: 'Uber Eats', amount: 20.0, category: 'Dining' },
    { date: '2024-01-03', description: 'Walmart', amount: 45.0, category: 'Groceries' },
    { date: '2024-01-04', description: 'Netflix', amount: 15.99, category: 'Subscriptions' },
  ];

  it('renders the pie chart', () => {
    render(<SpendingChart transactions={transactions} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('shows the Spending by Category heading', () => {
    render(<SpendingChart transactions={transactions} />);
    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });

  it('shows all unique categories in the legend', () => {
    render(<SpendingChart transactions={transactions} />);
    // Categories appear in both the legend and the top-3 summary bar → use getAllByText
    expect(screen.getAllByText('Dining').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Groceries').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Subscriptions').length).toBeGreaterThan(0);
  });

  it('shows the correct total amount', () => {
    render(<SpendingChart transactions={transactions} />);
    // Total = 5.5 + 20.0 + 45.0 + 15.99 = 86.49
    expect(screen.getByText('$86.49')).toBeInTheDocument();
  });

  it('shows category amounts in the top-3 bar', () => {
    render(<SpendingChart transactions={transactions} />);
    // Dining: $25.50, Groceries: $45.00, Subscriptions: $15.99
    expect(screen.getByText('$25.50')).toBeInTheDocument();
    expect(screen.getByText('$45.00')).toBeInTheDocument();
  });

  it('excludes zero-amount transactions from totals', () => {
    const withZero = [
      ...transactions,
      { date: '2024-01-05', description: 'Refund', amount: 0, category: 'Dining' },
    ];
    render(<SpendingChart transactions={withZero} />);
    // Total should still be 86.49
    expect(screen.getByText('$86.49')).toBeInTheDocument();
  });

  it('groups amounts by category (Dining = 5.50 + 20.00 = 25.50)', () => {
    render(<SpendingChart transactions={transactions} />);
    expect(screen.getByText('$25.50')).toBeInTheDocument();
  });

  it('shows percentage labels in the legend', () => {
    render(<SpendingChart transactions={transactions} />);
    // Groceries: 45/86.49 ≈ 52.0%
    expect(screen.getByText(/52\.\d%/)).toBeInTheDocument();
  });

  it('handles transactions with negative amounts by using absolute value', () => {
    const withNegative = [
      { date: '2024-01-01', description: 'Charge', amount: -30, category: 'Shopping' },
    ];
    render(<SpendingChart transactions={withNegative} />);
    // $30.00 appears in both the total span and the top-3 bar; either is acceptable
    expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0);
  });
});
