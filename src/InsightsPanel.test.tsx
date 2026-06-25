import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsightsPanel from './InsightsPanel';

describe('InsightsPanel – rendering', () => {
  it('renders without crashing given an empty string', () => {
    render(<InsightsPanel insights="" />);
    expect(screen.getByText('Spending Insights')).toBeInTheDocument();
  });

  it('renders the AI Analysis label', () => {
    render(<InsightsPanel insights="" />);
    expect(screen.getByText('AI Analysis')).toBeInTheDocument();
  });

  it('renders a parsed ### section heading as a card', () => {
    const insights = `### Top Categories\n* Dining $200\n* Groceries $100`;
    render(<InsightsPanel insights={insights} />);
    expect(screen.getByText('Top Categories')).toBeInTheDocument();
  });

  it('renders multiple sections', () => {
    const insights = `### Saving Tips\n* Reduce dining\n### Recommendations\n* Open savings account`;
    render(<InsightsPanel insights={insights} />);
    expect(screen.getByText('Saving Tips')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('renders bold text (**text**) as <strong>', () => {
    const insights = `### Section\n**Important tip** about spending`;
    render(<InsightsPanel insights={insights} />);
    const bold = screen.getByText('Important tip');
    expect(bold.tagName).toBe('STRONG');
  });

  it('renders italic text (*text*) as <em>', () => {
    const insights = `### Section\n*Note* something here`;
    render(<InsightsPanel insights={insights} />);
    const em = screen.getByText('Note');
    expect(em.tagName).toBe('EM');
  });

  it('renders bullet points starting with *', () => {
    const insights = `### Section\n* Buy less coffee\n* Save more each month`;
    render(<InsightsPanel insights={insights} />);
    expect(screen.getByText('Buy less coffee')).toBeInTheDocument();
    expect(screen.getByText('Save more each month')).toBeInTheDocument();
  });

  it('renders a summary line that appears before any ### heading', () => {
    const insights = `Based on your statement, total spend is $500.\n### Top Categories\n* Dining $200`;
    render(<InsightsPanel insights={insights} />);
    expect(screen.getByText(/Based on your statement/)).toBeInTheDocument();
  });

  it('does not show a summary section when text starts with ###', () => {
    const insights = `### Top Categories\n* Dining $200`;
    const { container } = render(<InsightsPanel insights={insights} />);
    // The summary summary block should not appear
    const summaryBox = container.querySelector('[style*="1E1E35"]');
    expect(summaryBox).toBeNull();
  });

  it('renders a markdown table', () => {
    const insights = `### Top Categories\n| Category | Amount |\n| --- | --- |\n| Dining | $200 |\n| Groceries | $100 |`;
    render(<InsightsPanel insights={insights} />);
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Dining')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
  });

  it('uses the 📊 icon for Top Categories section', () => {
    const insights = `### Top Categories\n* Dining $200`;
    render(<InsightsPanel insights={insights} />);
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('uses the 💡 icon for Saving Tips section', () => {
    const insights = `### Saving Tips\n* Reduce coffee`;
    render(<InsightsPanel insights={insights} />);
    expect(screen.getByText('💡')).toBeInTheDocument();
  });

  it('uses the 🔍 icon for Unusual Spending section', () => {
    const insights = `### Unusual Spending\n* Large purchase at casino`;
    render(<InsightsPanel insights={insights} />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('uses a fallback icon for unknown section names', () => {
    const insights = `### My Custom Section\n* Some info`;
    render(<InsightsPanel insights={insights} />);
    // Fallback icons cycle: 📋 💰 📌 📈 🧾
    expect(screen.getByText('📋')).toBeInTheDocument();
  });
});
