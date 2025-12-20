'use client';

import React, { useState, useEffect } from 'react';
import { UserWithHierarchy, CreateUserRelationRequest, userHierarchyApi } from '@/lib/api/userHierarchy';
import { toast } from 'react-hot-toast';
import {
  XMarkIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface CreateUserRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  onSuccess: (relation: any) => void;
}

const relationTypes = [
  { value: 'MANAGES', label: 'Zarządza', description: 'Bezpośrednie zarządzanie pracownikiem', icon: '👑', color: 'red' },
  { value: 'LEADS', label: 'Przewodzi', description: 'Przewodzenie zespołowi lub projektowi', icon: '⚡', color: 'blue' },
  { value: 'SUPERVISES', label: 'Nadzoruje', description: 'Nadzór nad pracą lub projektem', icon: '👀', color: 'green' },
  { value: 'MENTORS', label: 'Mentoruje', description: 'Mentoring i rozwój pracownika', icon: '🎓', color: 'purple' },
  { value: 'COLLABORATES', label: 'Współpracuje', description: 'Współpraca między równorzędnymi', icon: '🤝', color: 'orange' },
  { value: 'SUPPORTS', label: 'Wspiera', description: 'Wsparcie w realizacji zadań', icon: '🛠️', color: 'cyan' },
  { value: 'REPORTS_TO', label: 'Raportuje do', description: 'Raportowanie wyników pracy', icon: '📊', color: 'gray' }
];

const inheritanceRules = [
  { value: 'NO_INHERITANCE', label: 'Brak dziedziczenia', description: 'Uprawnienia nie są dziedziczone' },
  { value: 'INHERIT_DOWN', label: 'Dziedziczenie w dół', description: 'Manager dziedziczy uprawnienia do podwładnych' },
  { value: 'INHERIT_UP', label: 'Dziedziczenie w górę', description: 'Podwładny dziedziczy uprawnienia do managera' },
  { value: 'INHERIT_BIDIRECTIONAL', label: 'Dziedziczenie obustronne', description: 'Uprawnienia dziedziczone w obie strony' }
];

export default function CreateUserRelationModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  onSuccess
}: CreateUserRelationModalProps) {
  const [formData, setFormData] = useState<CreateUserRelationRequest>({
    managerId: '',
    employeeId: '',
    relationType: 'MANAGES',
    description: '',
    inheritanceRule: 'INHERIT_DOWN',
    canDelegate: true,
    canApprove: false
  });

  const [users, setUsers] = useState<UserWithHierarchy[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithHierarchy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [relationDirection, setRelationDirection] = useState<'manager' | 'employee'>('manager');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users, relationDirection]);

  const resetForm = () => {
    setFormData({
      managerId: '',
      employeeId: '',
      relationType: 'MANAGES',
      description: '',
      inheritanceRule: 'INHERIT_DOWN',
      canDelegate: true,
      canApprove: false
    });
    setSearchTerm('');
    setRelationDirection('manager');
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await userHierarchyApi.getUsers({ limit: 100 });
      setUsers(response.users.filter(user => user.id !== currentUserId));
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Nie udało się załadować użytkowników');
    } finally {
      setUsersLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = users.filter(user => 
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRelationDirectionChange = (direction: 'manager' | 'employee') => {
    setRelationDirection(direction);
    
    // Automatically set manager/employee based on direction
    if (direction === 'manager') {
      // Current user will be the employee, selected user will be manager
      setFormData(prev => ({
        ...prev,
        managerId: '', // Will be set when user selects someone
        employeeId: currentUserId
      }));
    } else {
      // Current user will be the manager, selected user will be employee
      setFormData(prev => ({
        ...prev,
        managerId: currentUserId,
        employeeId: '' // Will be set when user selects someone
      }));
    }
  };

  const handleUserSelect = (selectedUser: UserWithHierarchy) => {
    if (relationDirection === 'manager') {
      setFormData(prev => ({ ...prev, managerId: selectedUser.id }));
    } else {
      setFormData(prev => ({ ...prev, employeeId: selectedUser.id }));
    }
  };

  const getSelectedUser = () => {
    const selectedId = relationDirection === 'manager' ? formData.managerId : formData.employeeId;
    return users.find(user => user.id === selectedId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.managerId || !formData.employeeId) {
      toast.error('Proszę wybrać użytkownika do utworzenia relacji');
      return;
    }

    try {
      setLoading(true);
      const relation = await userHierarchyApi.createRelation(formData);
      toast.success('Relacja została utworzona pomyślnie');
      onSuccess(relation);
      onClose();
    } catch (error: any) {
      console.error('Error creating relation:', error);
      toast.error(error.response?.data?.error || 'Nie udało się utworzyć relacji');
    } finally {
      setLoading(false);
    }
  };

  const getRelationTypeConfig = (type: string) => {
    return relationTypes.find(rt => rt.value === type) || relationTypes[0];
  };

  if (!isOpen) return null;

  const selectedUser = getSelectedUser();
  const relationTypeConfig = getRelationTypeConfig(formData.relationType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserGroupIcon className="h-6 w-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Utwórz relację hierarchiczną
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Dodaj nową relację zarządczą dla: {currentUserName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
            
            {/* Relation Direction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Kierunek relacji
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleRelationDirectionChange('manager')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    relationDirection === 'manager'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">👆</span>
                    <span className="font-medium">Dodaj managera</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Wybierz osobę, która będzie zarządzać użytkownikiem <strong>{currentUserName}</strong>
                  </p>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleRelationDirectionChange('employee')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    relationDirection === 'employee'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">👇</span>
                    <span className="font-medium">Dodaj podwładnego</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Wybierz osobę, którą będzie zarządzać użytkownik <strong>{currentUserName}</strong>
                  </p>
                </button>
              </div>
            </div>

            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {relationDirection === 'manager' ? 'Wybierz managera' : 'Wybierz podwładnego'}
              </label>
              
              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj użytkowników..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Selected User Display */}
              {selectedUser && (
                <div className="mb-4 p-3 border border-indigo-200 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {userHierarchyApi.formatUserName(selectedUser).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{userHierarchyApi.formatUserName(selectedUser)}</p>
                      <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    </div>
                    <CheckCircleIcon className="h-5 w-5 text-green-500 ml-auto" />
                  </div>
                </div>
              )}

              {/* Users List */}
              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {usersLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Ładowanie użytkowników...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'Nie znaleziono użytkowników' : 'Brak dostępnych użytkowników'}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleUserSelect(user)}
                      className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                        selectedUser?.id === user.id ? 'bg-indigo-50 border-indigo-200' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold text-sm">
                          {userHierarchyApi.formatUserName(user).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{userHierarchyApi.formatUserName(user)}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">{userHierarchyApi.formatUserRole(user.role)}</p>
                        </div>
                        {selectedUser?.id === user.id && (
                          <CheckCircleIcon className="h-5 w-5 text-indigo-500" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Relation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Typ relacji
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {relationTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, relationType: type.value as any }))}
                    className={`p-3 border-2 rounded-lg text-left transition-colors ${
                      formData.relationType === type.value
                        ? `border-${type.color}-500 bg-${type.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{type.icon}</span>
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Opis relacji (opcjonalny)
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Dodaj opis tej relacji..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Advanced Options */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Opcje zaawansowane</h3>
              
              {/* Inheritance Rule */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reguła dziedziczenia uprawnień
                </label>
                <select
                  value={formData.inheritanceRule}
                  onChange={(e) => setFormData(prev => ({ ...prev, inheritanceRule: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {inheritanceRules.map((rule) => (
                    <option key={rule.value} value={rule.value}>
                      {rule.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {inheritanceRules.find(r => r.value === formData.inheritanceRule)?.description}
                </p>
              </div>

              {/* Permissions */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.canDelegate}
                    onChange={(e) => setFormData(prev => ({ ...prev, canDelegate: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Może delegować zadania</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.canApprove}
                    onChange={(e) => setFormData(prev => ({ ...prev, canApprove: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Może zatwierdzać</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div>
              {selectedUser && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{relationTypeConfig.label}:</span>{' '}
                  {relationDirection === 'manager' 
                    ? `${userHierarchyApi.formatUserName(selectedUser)} ${relationTypeConfig.label.toLowerCase()} ${currentUserName}`
                    : `${currentUserName} ${relationTypeConfig.label.toLowerCase()} ${userHierarchyApi.formatUserName(selectedUser)}`
                  }
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading || !selectedUser}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Tworzenie...' : 'Utwórz relację'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}