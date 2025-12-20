import { render, screen } from '@testing-library/react';
import StreamStatusBadge, {
  getStreamStatusIcon,
  getStreamStatusLabel,
} from '../StreamStatusBadge';

// Mock phosphor-react
jest.mock('phosphor-react', () => ({
  Waves: ({ size }: { size: number }) => <span data-testid="waves-icon" data-size={size}>Waves</span>,
  Snowflake: ({ size }: { size: number }) => <span data-testid="snowflake-icon" data-size={size}>Snowflake</span>,
  FileText: ({ size }: { size: number }) => <span data-testid="filetext-icon" data-size={size}>FileText</span>,
}));

// Mock Badge component
jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className: string }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

describe('StreamStatusBadge Component', () => {
  describe('FLOWING status', () => {
    it('renders flowing status with Polish label', () => {
      render(<StreamStatusBadge status="FLOWING" />);

      expect(screen.getByText('Płynie')).toBeInTheDocument();
      expect(screen.getByTestId('waves-icon')).toBeInTheDocument();
    });

    it('applies correct colors for flowing', () => {
      render(<StreamStatusBadge status="FLOWING" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('text-blue-600');
    });
  });

  describe('FROZEN status', () => {
    it('renders frozen status with Polish label', () => {
      render(<StreamStatusBadge status="FROZEN" />);

      expect(screen.getByText('Zamrożony')).toBeInTheDocument();
      expect(screen.getByTestId('snowflake-icon')).toBeInTheDocument();
    });

    it('applies correct colors for frozen', () => {
      render(<StreamStatusBadge status="FROZEN" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-slate-100');
      expect(badge).toHaveClass('text-slate-500');
    });
  });

  describe('TEMPLATE status', () => {
    it('renders template status with Polish label', () => {
      render(<StreamStatusBadge status="TEMPLATE" />);

      expect(screen.getByText('Szablon')).toBeInTheDocument();
      expect(screen.getByTestId('filetext-icon')).toBeInTheDocument();
    });

    it('applies correct colors for template', () => {
      render(<StreamStatusBadge status="TEMPLATE" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-purple-100');
      expect(badge).toHaveClass('text-purple-600');
    });
  });

  describe('showLabel prop', () => {
    it('shows label by default', () => {
      render(<StreamStatusBadge status="FLOWING" />);
      expect(screen.getByText('Płynie')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<StreamStatusBadge status="FLOWING" showLabel={false} />);
      expect(screen.queryByText('Płynie')).not.toBeInTheDocument();
    });
  });

  describe('size prop', () => {
    it('renders small size', () => {
      render(<StreamStatusBadge status="FLOWING" size="sm" />);

      const icon = screen.getByTestId('waves-icon');
      expect(icon).toHaveAttribute('data-size', '14');
    });

    it('renders medium size by default', () => {
      render(<StreamStatusBadge status="FLOWING" />);

      const icon = screen.getByTestId('waves-icon');
      expect(icon).toHaveAttribute('data-size', '16');
    });

    it('renders large size', () => {
      render(<StreamStatusBadge status="FLOWING" size="lg" />);

      const icon = screen.getByTestId('waves-icon');
      expect(icon).toHaveAttribute('data-size', '20');
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      render(<StreamStatusBadge status="FLOWING" className="custom-class" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('helper functions', () => {
    it('getStreamStatusLabel returns Polish label by default', () => {
      expect(getStreamStatusLabel('FLOWING')).toBe('Płynie');
      expect(getStreamStatusLabel('FROZEN')).toBe('Zamrożony');
      expect(getStreamStatusLabel('TEMPLATE')).toBe('Szablon');
    });

    it('getStreamStatusLabel returns English label when specified', () => {
      expect(getStreamStatusLabel('FLOWING', 'en')).toBe('Flowing');
      expect(getStreamStatusLabel('FROZEN', 'en')).toBe('Frozen');
      expect(getStreamStatusLabel('TEMPLATE', 'en')).toBe('Template');
    });

    it('getStreamStatusIcon returns correct component', () => {
      const FlowingIcon = getStreamStatusIcon('FLOWING');
      const FrozenIcon = getStreamStatusIcon('FROZEN');
      const TemplateIcon = getStreamStatusIcon('TEMPLATE');

      // They should be functions (React components)
      expect(typeof FlowingIcon).toBe('function');
      expect(typeof FrozenIcon).toBe('function');
      expect(typeof TemplateIcon).toBe('function');
    });
  });
});
