'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import Cookies from 'js-cookie';
import { nextActionsApi } from '@/lib/api/nextActions';
import { toast } from 'react-hot-toast';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Kanban, List, Plus, Check, Pencil, Zap, Monitor, Phone, Building2, Home, PersonStanding, ClipboardList, Clock, Sun, HelpCircle, Target, X } from 'lucide-react';

interface NextAction {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  context?: string;
  energy?: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedTime?: string;
  stream?: {
    name: string;
    color: string;
  };
  project?: {
    name: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  status: string;
}

interface GTDContext {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const gtdContexts: GTDContext[] = [
  { name: '@computer', icon: <Monitor className="w-5 h-5" />, color: '#3B82F6', description: 'Tasks requiring a computer' },
  { name: '@phone', icon: <Phone className="w-5 h-5" />, color: '#10B981', description: 'Phone calls to make' },
  { name: '@office', icon: <Building2 className="w-5 h-5" />, color: '#EF4444', description: 'Tasks to do at the office' },
  { name: '@home', icon: <Home className="w-5 h-5" />, color: '#8B5CF6', description: 'Tasks to do at home' },
  { name: '@errands', icon: <PersonStanding className="w-5 h-5" />, color: '#F59E0B', description: 'Tasks to do while out' },
  { name: '@agenda', icon: <ClipboardList className="w-5 h-5" />, color: '#6B7280', description: 'Items for meetings/discussions' },
  { name: '@waiting', icon: <Clock className="w-5 h-5" />, color: '#F97316', description: 'Waiting for someone else' },
  { name: '@someday', icon: <Sun className="w-5 h-5" />, color: '#84CC16', description: 'Someday/maybe items' }
];

export default function NextActionsKanbanPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !Cookies.get('access_token'))) {
      window.location.href = '/auth/login/';
    }
  }, [isLoading, isAuthenticated]);

  const [actions, setActions] = useState<NextAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedEnergy, setSelectedEnergy] = useState<string>('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [draggedAction, setDraggedAction] = useState<NextAction | null>(null);
  const [contexts, setContexts] = useState<string[]>([]);

  useEffect(() => {
    loadActions();
    loadContexts();
  }, [selectedPriority, selectedEnergy]);

  const loadActions = async () => {
    if (!isAuthenticated || !Cookies.get('access_token')) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await nextActionsApi.getNextActions({
        priority: selectedPriority || undefined,
        energy: selectedEnergy || undefined,
      });
      setActions(data);
    } catch (error: any) {
      console.error('Error loading next actions:', error);
      toast.error('Failed to load next actions');
    } finally {
      setLoading(false);
    }
  };

  const loadContexts = async () => {
    if (!isAuthenticated || !Cookies.get('access_token')) {
      return;
    }

    try {
      const data = await nextActionsApi.getContextsList();
      setContexts(data);
    } catch (error: any) {
      console.error('Error loading contexts:', error);
    }
  };

  const handleCreateAction = async (actionData: {
    title: string;
    description?: string;
    context: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    energy: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedTime?: string;
  }) => {
    try {
      await nextActionsApi.createNextAction(actionData);
      toast.success('Next Action created successfully!');
      setShowActionModal(false);
      await loadActions();
    } catch (error: any) {
      console.error('Error creating action:', error);
      toast.error('Failed to create action');
    }
  };

  const handleCompleteTask = async (actionId: string) => {
    try {
      await nextActionsApi.completeNextAction(actionId);
      toast.success('Next Action completed!');
      await loadActions();
    } catch (error: any) {
      console.error('Error completing next action:', error);
      toast.error('Failed to complete next action');
    }
  };

  const handleUpdateContext = async (actionId: string, newContext: string) => {
    try {
      await nextActionsApi.updateContext(actionId, newContext);
      toast.success('Context updated');
      await loadActions();
    } catch (error: any) {
      console.error('Error updating context:', error);
      toast.error('Failed to update context');
    }
  };

  const handleDragStart = (e: React.DragEvent, action: NextAction) => {
    setDraggedAction(action);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetContext: string) => {
    e.preventDefault();
    if (!draggedAction) return;

    if (draggedAction.context !== targetContext) {
      await handleUpdateContext(draggedAction.id, targetContext);
    }
    setDraggedAction(null);
  };

  const getActionsByContext = (context: string) => {
    return actions.filter(action => action.context === context);
  };

  const getUncontextualizedActions = () => {
    const knownContexts = gtdContexts.map(ctx => ctx.name);
    return actions.filter(action => !action.context || !knownContexts.includes(action.context));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'HIGH': return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'MEDIUM': return 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'LOW': return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-l-4 border-slate-500 bg-slate-50 dark:bg-slate-800/40';
    }
  };

  const getEnergyIcon = (energy?: string) => {
    switch (energy) {
      case 'HIGH': return <><Zap className="w-3 h-3 inline" /><Zap className="w-3 h-3 inline" /><Zap className="w-3 h-3 inline" /></>;
      case 'MEDIUM': return <><Zap className="w-3 h-3 inline" /><Zap className="w-3 h-3 inline" /></>;
      case 'LOW': return <Zap className="w-3 h-3 inline" />;
      default: return <><Zap className="w-3 h-3 inline" /><Zap className="w-3 h-3 inline" /></>;
    }
  };

  const formatDueDate = (date?: string) => {
    if (!date) return null;
    const dueDate = new Date(date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-red-600 dark:text-red-400 text-xs">Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-600 dark:text-orange-400 text-xs">Today</span>;
    } else if (diffDays === 1) {
      return <span className="text-yellow-600 dark:text-yellow-400 text-xs">Tomorrow</span>;
    }
    return null;
  };

  const ActionCard = ({ action }: { action: NextAction }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, action)}
      className={`p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move mb-3 ${getPriorityColor(action.priority)}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex-1">{action.title}</h4>
        <div className="flex items-center space-x-1">
          {action.energy && (
            <span className="text-xs text-amber-500 dark:text-amber-400" title={`${action.energy} energy`}>
              {getEnergyIcon(action.energy)}
            </span>
          )}
          {formatDueDate(action.dueDate)}
        </div>
      </div>

      {action.description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">{action.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-2">
          {action.estimatedTime && (
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded">{action.estimatedTime}</span>
          )}
          {action.project && (
            <span className="text-slate-600 dark:text-slate-400">{action.project.name}</span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleCompleteTask(action.id)}
            className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
            title="Complete"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={() => router.push(`/dashboard/tasks/${action.id}/edit`)}
            className="p-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            title="Edit"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Next Actions Kanban"
          subtitle="Organizuj akcje wedlug kontekstow"
          icon={Kanban}
          iconColor="text-indigo-600"
          actions={
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/gtd/next-actions')}
                className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
              >
                <List className="w-4 h-4" />
                List View
              </button>
              <button
                onClick={() => setShowActionModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Action
              </button>
            </div>
          }
        />

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Energy</label>
              <select
                value={selectedEnergy}
                onChange={(e) => setSelectedEnergy(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="">All Energy Levels</option>
                <option value="HIGH">High Energy</option>
                <option value="MEDIUM">Medium Energy</option>
                <option value="LOW">Low Energy</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSelectedPriority('');
                setSelectedEnergy('');
              }}
              className="mt-6 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md"
            >
              Clear
            </button>
            <div className="ml-auto text-sm text-slate-600 dark:text-slate-400">
              {actions.length} actions total
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {/* GTD Context Columns */}
          {gtdContexts.map((context) => {
            const contextActions = getActionsByContext(context.name);
            return (
              <div
                key={context.name}
                className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 rounded-2xl shadow-sm border-2 border-dashed border-slate-200 dark:border-slate-700 min-h-[400px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, context.name)}
              >
                {/* Column Header */}
                <div
                  className="p-4 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl"
                  style={{ backgroundColor: `${context.color}10` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg text-slate-700 dark:text-slate-300">{context.icon}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{context.name}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{context.description}</p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: context.color, color: 'white' }}
                    >
                      {contextActions.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="p-3">
                  {contextActions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                      <div className="mb-2 opacity-50">{context.icon}</div>
                      <p className="text-xs">Drop actions here</p>
                    </div>
                  ) : (
                    contextActions.map((action) => (
                      <ActionCard key={action.id} action={action} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Uncontextualized Actions */}
        {getUncontextualizedActions().length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 rounded-2xl shadow-sm border-2 border-dashed border-yellow-300 dark:border-yellow-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No Context</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Akcje bez kontekstu - przypisz je!</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-yellow-500 text-white rounded-full">
                  {getUncontextualizedActions().length}
                </span>
              </div>
            </div>
            <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {getUncontextualizedActions().map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {actions.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm text-center py-12">
            <Target className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Next Actions</h3>
            <p className="text-slate-600 dark:text-slate-400">Create your first action to see it on the board</p>
          </div>
        )}

        {/* Create Action Modal */}
        {showActionModal && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border border-slate-200 dark:border-slate-700 w-full max-w-lg shadow-lg rounded-2xl bg-white dark:bg-slate-800">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    Create Next Action
                  </h3>
                  <button
                    onClick={() => setShowActionModal(false)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleCreateAction({
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    context: formData.get('context') as string,
                    priority: formData.get('priority') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
                    energy: formData.get('energy') as 'LOW' | 'MEDIUM' | 'HIGH',
                    estimatedTime: formData.get('estimatedTime') as string,
                  });
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Action Title</label>
                      <input
                        name="title"
                        type="text"
                        required
                        placeholder="e.g. Call John about pricing proposal"
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kontekst</label>
                      <select
                        name="context"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Select context...</option>
                        {gtdContexts.map(context => (
                          <option key={context.name} value={context.name}>{context.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
                        <select
                          name="priority"
                          defaultValue="MEDIUM"
                          className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Energy</label>
                        <select
                          name="energy"
                          defaultValue="MEDIUM"
                          className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Estimated Time</label>
                      <select
                        name="estimatedTime"
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Select time...</option>
                        <option value="5min">5 minutes</option>
                        <option value="15min">15 minutes</option>
                        <option value="30min">30 minutes</option>
                        <option value="1h">1 hour</option>
                        <option value="2h">2 hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes (optional)</label>
                      <textarea
                        name="description"
                        rows={2}
                        placeholder="Additional details..."
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowActionModal(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      Create Action
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
