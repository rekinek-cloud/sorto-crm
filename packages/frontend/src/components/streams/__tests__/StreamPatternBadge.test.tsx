import { render, screen } from '@testing-library/react';
import StreamPatternBadge, {
  getStreamPatternIcon,
  getStreamPatternLabel,
  getStreamPatternDescription,
} from '../StreamPatternBadge';

// Mock phosphor-react
jest.mock('phosphor-react', () => ({
  Folder: ({ size }: { size: number }) => <span data-testid="folder-icon" data-size={size}>Folder</span>,
  ArrowsClockwise: ({ size }: { size: number }) => <span data-testid="arrows-icon" data-size={size}>Arrows</span>,
  BookBookmark: ({ size }: { size: number }) => <span data-testid="book-icon" data-size={size}>Book</span>,
  Buildings: ({ size }: { size: number }) => <span data-testid="buildings-icon" data-size={size}>Buildings</span>,
  Funnel: ({ size }: { size: number }) => <span data-testid="funnel-icon" data-size={size}>Funnel</span>,
  House: ({ size }: { size: number }) => <span data-testid="house-icon" data-size={size}>House</span>,
  Sparkle: ({ size }: { size: number }) => <span data-testid="sparkle-icon" data-size={size}>Sparkle</span>,
}));

// Mock Badge component
jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, className, title }: { children: React.ReactNode; className: string; title?: string }) => (
    <span data-testid="badge" className={className} title={title}>
      {children}
    </span>
  ),
}));

describe('StreamPatternBadge Component', () => {
  describe('Pattern types', () => {
    it('renders project pattern', () => {
      render(<StreamPatternBadge pattern="project" />);

      expect(screen.getByText('Projektowy')).toBeInTheDocument();
      expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
    });

    it('renders continuous pattern', () => {
      render(<StreamPatternBadge pattern="continuous" />);

      expect(screen.getByText('Ciągły')).toBeInTheDocument();
      expect(screen.getByTestId('arrows-icon')).toBeInTheDocument();
    });

    it('renders reference pattern', () => {
      render(<StreamPatternBadge pattern="reference" />);

      expect(screen.getByText('Referencyjny')).toBeInTheDocument();
      expect(screen.getByTestId('book-icon')).toBeInTheDocument();
    });

    it('renders client pattern', () => {
      render(<StreamPatternBadge pattern="client" />);

      expect(screen.getByText('Klient')).toBeInTheDocument();
      expect(screen.getByTestId('buildings-icon')).toBeInTheDocument();
    });

    it('renders pipeline pattern', () => {
      render(<StreamPatternBadge pattern="pipeline" />);

      expect(screen.getByText('Pipeline')).toBeInTheDocument();
      expect(screen.getByTestId('funnel-icon')).toBeInTheDocument();
    });

    it('renders workspace pattern', () => {
      render(<StreamPatternBadge pattern="workspace" />);

      expect(screen.getByText('Przestrzeń')).toBeInTheDocument();
      expect(screen.getByTestId('house-icon')).toBeInTheDocument();
    });

    it('renders custom pattern', () => {
      render(<StreamPatternBadge pattern="custom" />);

      expect(screen.getByText('Własny')).toBeInTheDocument();
      expect(screen.getByTestId('sparkle-icon')).toBeInTheDocument();
    });
  });

  describe('Colors', () => {
    it('applies purple colors for project pattern', () => {
      render(<StreamPatternBadge pattern="project" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-purple-100');
      expect(badge).toHaveClass('text-purple-600');
    });

    it('applies green colors for continuous pattern', () => {
      render(<StreamPatternBadge pattern="continuous" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-600');
    });

    it('applies amber colors for reference pattern', () => {
      render(<StreamPatternBadge pattern="reference" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-amber-100');
      expect(badge).toHaveClass('text-amber-600');
    });
  });

  describe('showLabel prop', () => {
    it('shows label by default', () => {
      render(<StreamPatternBadge pattern="project" />);
      expect(screen.getByText('Projektowy')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<StreamPatternBadge pattern="project" showLabel={false} />);
      expect(screen.queryByText('Projektowy')).not.toBeInTheDocument();
    });
  });

  describe('size prop', () => {
    it('renders small size', () => {
      render(<StreamPatternBadge pattern="project" size="sm" />);

      const icon = screen.getByTestId('folder-icon');
      expect(icon).toHaveAttribute('data-size', '14');
    });

    it('renders medium size by default', () => {
      render(<StreamPatternBadge pattern="project" />);

      const icon = screen.getByTestId('folder-icon');
      expect(icon).toHaveAttribute('data-size', '16');
    });

    it('renders large size', () => {
      render(<StreamPatternBadge pattern="project" size="lg" />);

      const icon = screen.getByTestId('folder-icon');
      expect(icon).toHaveAttribute('data-size', '20');
    });
  });

  describe('description tooltip', () => {
    it('shows description as title attribute', () => {
      render(<StreamPatternBadge pattern="project" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('title', 'Strumień z określonym końcem i rezultatem');
    });
  });

  describe('helper functions', () => {
    it('getStreamPatternLabel returns Polish label by default', () => {
      expect(getStreamPatternLabel('project')).toBe('Projektowy');
      expect(getStreamPatternLabel('continuous')).toBe('Ciągły');
      expect(getStreamPatternLabel('reference')).toBe('Referencyjny');
      expect(getStreamPatternLabel('client')).toBe('Klient');
      expect(getStreamPatternLabel('pipeline')).toBe('Pipeline');
      expect(getStreamPatternLabel('workspace')).toBe('Przestrzeń');
      expect(getStreamPatternLabel('custom')).toBe('Własny');
    });

    it('getStreamPatternLabel returns English label when specified', () => {
      expect(getStreamPatternLabel('project', 'en')).toBe('Project');
      expect(getStreamPatternLabel('continuous', 'en')).toBe('Continuous');
      expect(getStreamPatternLabel('reference', 'en')).toBe('Reference');
    });

    it('getStreamPatternDescription returns correct descriptions', () => {
      expect(getStreamPatternDescription('project')).toBe('Strumień z określonym końcem i rezultatem');
      expect(getStreamPatternDescription('continuous')).toBe('Strumień bez określonego końca (obszar życia)');
      expect(getStreamPatternDescription('reference')).toBe('Baza wiedzy i materiały referencyjne');
    });

    it('getStreamPatternIcon returns correct component', () => {
      const ProjectIcon = getStreamPatternIcon('project');
      const ContinuousIcon = getStreamPatternIcon('continuous');

      expect(typeof ProjectIcon).toBe('function');
      expect(typeof ContinuousIcon).toBe('function');
    });

    it('handles unknown pattern gracefully', () => {
      // @ts-ignore - testing invalid pattern
      render(<StreamPatternBadge pattern="unknown" />);

      // Should fallback to custom
      expect(screen.getByText('Własny')).toBeInTheDocument();
    });
  });
});
