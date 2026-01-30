'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Meeting, MeetingFilters, MeetingStats } from '@/lib/api/meetings';
import { meetingsApi } from '@/lib/api/meetings';
import MeetingCard from '@/components/meetings/MeetingCard';
import MeetingForm from '@/components/meetings/MeetingForm';
import MeetingFiltersComponent from '@/components/meetings/MeetingFilters';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  FunnelIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'grid' | 'list';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMeetingFormOpen, setIsMeetingFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MeetingFilters>({
    page: 1,
    limit: 20,
    sortBy: 'startTime',
    sortOrder: 'asc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load meetings when filters change
  useEffect(() => {
    if (!isLoading) {
      loadMeetings();
    }
  }, [filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [meetingsData, statsData] = await Promise.all([
        meetingsApi.getMeetings(filters),
        meetingsApi.getMeetingsStats(),
      ]);

      setMeetings(meetingsData.meetings);
      setPagination(meetingsData.pagination);
      setStats(statsData);
    } catch (error: any) {
      toast.error('Failed to load meetings');
      console.error('Error loading meetings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMeetings = async () => {
    try {
      const meetingsData = await meetingsApi.getMeetings(filters);
      setMeetings(meetingsData.meetings);
      setPagination(meetingsData.pagination);
    } catch (error: any) {
      toast.error('Failed to load meetings');
      console.error('Error loading meetings:', error);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await meetingsApi.createMeeting(data);
      toast.success('Meeting scheduled successfully');
      setIsMeetingFormOpen(false);
      loadData();
    } catch (error: any) {
      if (error.response?.data?.conflicts) {
        toast.error('Meeting conflicts with existing meetings');
      } else {
        toast.error('Failed to schedule meeting');
      }
      console.error('Error creating meeting:', error);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await meetingsApi.updateMeeting(id, data);
      toast.success('Meeting updated successfully');
      setEditingMeeting(undefined);
      setIsMeetingFormOpen(false);
      loadData();
    } catch (error: any) {
      if (error.response?.data?.conflicts) {
        toast.error('Meeting conflicts with existing meetings');
      } else {
        toast.error('Failed to update meeting');
      }
      console.error('Error updating meeting:', error);
    }
  };

  const handleStatusChange = async (id: string, status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'SCHEDULED') => {
    try {
      await meetingsApi.updateMeeting(id, { status });
      toast.success(`Meeting ${status.toLowerCase().replace('_', ' ')}`);
      loadData();
    } catch (error: any) {
      toast.error('Failed to update meeting status');
      console.error('Error updating meeting status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    
    try {
      await meetingsApi.deleteMeeting(id);
      toast.success('Meeting deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error('Failed to delete meeting');
      console.error('Error deleting meeting:', error);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
      page: 1
    }));
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (!searchQuery) return true;
    return meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           meeting.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           meeting.location?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage meetings with agenda and notes</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' 
                ? 'bg-primary-50 text-primary-700 border-primary-200' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ViewColumnsIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' 
                ? 'bg-primary-50 text-primary-700 border-primary-200' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline"
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filters
          </button>

          {/* New Meeting */}
          <button
            onClick={() => setIsMeetingFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <MeetingFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalMeetings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayMeetings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <div className="w-6 h-6 text-orange-600">📅</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.upcomingMeetings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedMeetings}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meetings List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Meetings Found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'No meetings match your search criteria.' : 'Start organizing your schedule by scheduling your first meeting.'}
          </p>
          <button
            onClick={() => setIsMeetingFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Schedule First Meeting
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMeetings.map((meeting, index) => (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <MeetingCard
                    meeting={meeting}
                    onEdit={(meeting) => {
                      setEditingMeeting(meeting);
                      setIsMeetingFormOpen(true);
                    }}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Meetings List</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredMeetings.map((meeting) => {
                  const statusColors = meetingsApi.getStatusColor(meeting.status);
                  const timeRange = meetingsApi.formatTimeRange(meeting.startTime, meeting.endTime);
                  const isToday = meetingsApi.isToday(meeting.startTime);
                  const isUpcoming = meetingsApi.isUpcoming(meeting.startTime);
                  
                  return (
                    <div key={meeting.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{meeting.title}</h4>
                              {meeting.description && (
                                <p className="text-sm text-gray-600">{meeting.description}</p>
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors.bg} ${statusColors.text}`}
                            >
                              {meeting.status.replace('_', ' ')}
                            </span>
                            {isToday && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {timeRange}
                            </span>
                            {meeting.location && (
                              <span>📍 {meeting.location}</span>
                            )}
                            {meeting.meetingUrl && (
                              <span>💻 Online</span>
                            )}
                            {meeting.contact && (
                              <span>👤 {meeting.contact.firstName} {meeting.contact.lastName}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingMeeting(meeting);
                              setIsMeetingFormOpen(true);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(meeting.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="btn btn-outline btn-sm"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`btn btn-sm ${
                        page === pagination.page ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="btn btn-outline btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Meeting Form Modal */}
      {isMeetingFormOpen && (
        <MeetingForm
          meeting={editingMeeting}
          onSubmit={editingMeeting ? 
            (data) => handleEdit(editingMeeting.id, data) : 
            handleCreate
          }
          onCancel={() => {
            setIsMeetingFormOpen(false);
            setEditingMeeting(undefined);
          }}
        />
      )}
    </motion.div>
  );
}