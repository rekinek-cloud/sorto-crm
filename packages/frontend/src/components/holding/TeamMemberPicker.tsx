'use client';

import { useState, useMemo } from 'react';
import { Search, Check, Bot, User } from 'lucide-react';
import { TeamMember } from '@/types/holding';

interface Props {
  members: TeamMember[];
  selected: string[];
  onChange: (ids: string[]) => void;
  allowMultiple?: boolean;
  showAIAgents?: boolean;
}

export default function TeamMemberPicker({
  members,
  selected,
  onChange,
  allowMultiple = true,
  showAIAgents = true,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const humans = useMemo(
    () =>
      members.filter(
        (m) =>
          m.type === 'human' &&
          m.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [members, searchQuery]
  );

  const aiAgents = useMemo(
    () =>
      members.filter(
        (m) =>
          m.type === 'ai_agent' &&
          m.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [members, searchQuery]
  );

  const toggleMember = (id: string) => {
    if (!allowMultiple) {
      onChange(selected.includes(id) ? [] : [id]);
      return;
    }
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const renderMember = (member: TeamMember) => {
    const isSelected = selected.includes(member.id);
    const isAI = member.type === 'ai_agent';

    return (
      <button
        key={member.id}
        onClick={() => toggleMember(member.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
          isSelected
            ? 'bg-indigo-50 border border-indigo-200'
            : 'hover:bg-gray-50 border border-transparent'
        }`}
      >
        {isAI ? (
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-lg">
              {member.avatar || '\u{1F916}'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 bg-purple-600 text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none">
              AI
            </span>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {member.avatar || getInitials(member.name)}
          </div>
        )}

        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 truncate w-full text-left">
            {member.name}
          </span>
          <span className="text-xs text-gray-400 truncate w-full text-left">
            {member.position || member.role || (isAI ? 'Agent AI' : 'Pracownik')}
          </span>
        </div>

        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${
            isSelected
              ? 'bg-indigo-600 border-indigo-600'
              : 'border-gray-300'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      </button>
    );
  };

  return (
    <div className="w-full">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Szukaj członka zespołu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        />
      </div>

      {/* Humans section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <User className="w-4 h-4 text-blue-500" />
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Ludzie
          </h4>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {humans.length}
          </span>
        </div>
        <div className="space-y-1">
          {humans.map(renderMember)}
          {humans.length === 0 && (
            <p className="text-xs text-gray-400 px-3 py-2">
              {searchQuery ? 'Nie znaleziono pracowników' : 'Brak pracowników'}
            </p>
          )}
        </div>
      </div>

      {/* AI Agents section */}
      {showAIAgents && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Bot className="w-4 h-4 text-purple-500" />
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              AI Agenci
            </h4>
            <span className="text-xs text-gray-400 bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">
              {aiAgents.length}
            </span>
          </div>
          <div className="space-y-1">
            {aiAgents.map(renderMember)}
            {aiAgents.length === 0 && (
              <p className="text-xs text-gray-400 px-3 py-2">
                {searchQuery ? 'Nie znaleziono agentów' : 'Brak agentów AI'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Selection summary */}
      {selected.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Wybrano: <span className="font-semibold text-indigo-600">{selected.length}</span>{' '}
            {selected.length === 1 ? 'osobę' : selected.length < 5 ? 'osoby' : 'osób'}
          </p>
        </div>
      )}
    </div>
  );
}
