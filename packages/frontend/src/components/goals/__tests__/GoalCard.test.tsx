import { render, screen, fireEvent } from '@testing-library/react';
import GoalCard from '../GoalCard';
import { PreciseGoal } from '@/types/streams';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Pencil: () => <span data-testid="pencil-icon">Edit</span>,
  Trash2: () => <span data-testid="trash-icon">Delete</span>,
  CheckCircle: () => <span data-testid="check-icon">Check</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  XCircle: () => <span data-testid="x-icon">X</span>,
  PauseCircle: () => <span data-testid="pause-icon">Pause</span>,
  Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
  BarChart3: () => <span data-testid="chart-icon">Chart</span>,
}));

const mockGoal: PreciseGoal = {
  id: 'goal-1',
  result: 'Ukończyć migrację STREAMS',
  measurement: 'Wszystkie moduły działają poprawnie',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // za 7 dni
  background: 'Unifikacja metodologii produktywności',
  currentValue: 75,
  targetValue: 100,
  unit: '%',
  status: 'active',
  organizationId: 'org-1',
  createdById: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  stream: {
    id: 'stream-1',
    name: 'Rozwój produktu',
    color: '#3B82F6',
  },
};

describe('GoalCard Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnUpdateProgress = jest.fn();
  const mockOnAchieve = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders RZUT elements correctly', () => {
    render(
      <GoalCard
        goal={mockGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    // R - Rezultat
    expect(screen.getByText('R')).toBeInTheDocument();
    expect(screen.getByText('Rezultat')).toBeInTheDocument();
    expect(screen.getByText('Ukończyć migrację STREAMS')).toBeInTheDocument();

    // Z - Zmierzalność
    expect(screen.getByText('Z')).toBeInTheDocument();
    expect(screen.getByText('Zmierzalność')).toBeInTheDocument();
    expect(screen.getByText('Wszystkie moduły działają poprawnie')).toBeInTheDocument();
  });

  it('displays progress correctly', () => {
    render(
      <GoalCard
        goal={mockGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.getByText('75 / 100 %')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows active status badge', () => {
    render(
      <GoalCard
        goal={mockGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.getByText('Aktywny')).toBeInTheDocument();
  });

  it('shows achieved status badge', () => {
    const achievedGoal: PreciseGoal = {
      ...mockGoal,
      status: 'achieved',
      currentValue: 100,
    };

    render(
      <GoalCard
        goal={achievedGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.getByText('Osiągnięty')).toBeInTheDocument();
  });

  it('shows failed status badge', () => {
    const failedGoal: PreciseGoal = {
      ...mockGoal,
      status: 'failed',
    };

    render(
      <GoalCard
        goal={failedGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.getByText('Nieosiągnięty')).toBeInTheDocument();
  });

  it('shows paused status badge', () => {
    const pausedGoal: PreciseGoal = {
      ...mockGoal,
      status: 'paused',
    };

    render(
      <GoalCard
        goal={pausedGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.getByText('Wstrzymany')).toBeInTheDocument();
  });

  it('displays stream information', () => {
    render(
      <GoalCard
        goal={mockGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.getByText('Rozwój produktu')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    render(
      <GoalCard
        goal={mockGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    const editButton = screen.getByTitle('Edytuj');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockGoal);
  });

  it('calls onDelete when delete button clicked', () => {
    render(
      <GoalCard
        goal={mockGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    const deleteButton = screen.getByTitle('Usuń');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('goal-1');
  });

  it('shows update progress button for active goals', () => {
    render(
      <GoalCard
        goal={mockGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.getByText('Aktualizuj postęp')).toBeInTheDocument();
  });

  it('opens progress update form when clicked', () => {
    render(
      <GoalCard
        goal={mockGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    fireEvent.click(screen.getByText('Aktualizuj postęp'));

    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(screen.getByText('Zapisz')).toBeInTheDocument();
    expect(screen.getByText('Anuluj')).toBeInTheDocument();
  });

  it('calls onUpdateProgress with new value', () => {
    render(
      <GoalCard
        goal={mockGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    fireEvent.click(screen.getByText('Aktualizuj postęp'));

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '90' } });
    fireEvent.click(screen.getByText('Zapisz'));

    expect(mockOnUpdateProgress).toHaveBeenCalledWith('goal-1', 90);
  });

  it('shows achieve button when progress is 100%', () => {
    const completedGoal: PreciseGoal = {
      ...mockGoal,
      currentValue: 100,
      status: 'active',
    };

    render(
      <GoalCard
        goal={completedGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.getByText('Oznacz jako osiągnięty')).toBeInTheDocument();
  });

  it('calls onAchieve when achieve button clicked', () => {
    const completedGoal: PreciseGoal = {
      ...mockGoal,
      currentValue: 100,
      status: 'active',
    };

    render(
      <GoalCard
        goal={completedGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    fireEvent.click(screen.getByText('Oznacz jako osiągnięty'));

    expect(mockOnAchieve).toHaveBeenCalledWith('goal-1');
  });

  it('displays background (T - Tło) when provided', () => {
    render(
      <GoalCard
        goal={mockGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.getByText('Unifikacja metodologii produktywności')).toBeInTheDocument();
  });

  it('shows days remaining for active goals', () => {
    render(
      <GoalCard
        goal={mockGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.getByText(/za \d+ dni/)).toBeInTheDocument();
  });

  it('shows overdue styling for overdue goals', () => {
    const overdueGoal: PreciseGoal = {
      ...mockGoal,
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // wczoraj
    };

    render(
      <GoalCard
        goal={overdueGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.getByText(/po terminie/)).toBeInTheDocument();
  });

  it('does not show update progress for non-active goals', () => {
    const achievedGoal: PreciseGoal = {
      ...mockGoal,
      status: 'achieved',
    };

    render(
      <GoalCard
        goal={achievedGoal}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onUpdateProgress={mockOnUpdateProgress}
        onAchieve={mockOnAchieve}
      />
    );

    expect(screen.queryByText('Aktualizuj postęp')).not.toBeInTheDocument();
  });
});
