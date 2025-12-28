'use client';

/**
 * ConversationalAIHub - Main container for AI Dashboard
 * Combines all AI components into a unified interface
 *
 * Layout:
 * +------------------------------------------------------------------+
 * |  [Search: Zapytaj o cokolwiek...]              [Stats Strip]      |
 * +------------------------------------------------------------------+
 * |                                          |                        |
 * |        CENTRALNY AI CHAT                 |   AI INSIGHTS CARDS    |
 * |        (65% width)                       |   (35% width)          |
 * |                                          |                        |
 * +------------------------------------------+------------------------+
 * |                    SMART SUGGESTIONS PANEL                        |
 * +------------------------------------------------------------------+
 */

import React, { useEffect } from 'react';
import { useAIHub } from '@/hooks/useAIHub';
import { AIChatPanel } from './AIChatPanel';
import { NaturalLanguageSearch } from './NaturalLanguageSearch';
import { QuickStatsStrip } from './QuickStatsStrip';
import { AIInsightsCards } from './AIInsightsCards';
import { SmartSuggestionsPanel } from './SmartSuggestionsPanel';

export function ConversationalAIHub() {
  const {
    // Chat
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearConversation,
    executeAction,

    // Insights
    insights,
    insightsLoading,
    refreshInsights,
    dismissInsight,

    // Suggestions
    suggestions,
    suggestionsLoading,
    acceptSuggestion,
    dismissSuggestion,

    // Stats
    stats,
    statsLoading,
    refreshStats,

    // Search
    searchResults,
    searchLoading,
    search,
    clearSearch
  } = useAIHub();

  // Handle search query submit (sends to chat)
  const handleQuerySubmit = async (query: string) => {
    await sendMessage(query);
    clearSearch();
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top Bar: Search + Stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <NaturalLanguageSearch
          onSearch={search}
          onQuerySubmit={handleQuerySubmit}
          results={searchResults}
          isLoading={searchLoading}
          onClear={clearSearch}
          placeholder="Zapytaj AI o cokolwiek... (naciśnij /)"
        />
        <div className="hidden lg:block">
          <QuickStatsStrip
            stats={stats}
            isLoading={statsLoading}
            onRefresh={refreshStats}
          />
        </div>
      </div>

      {/* Mobile Stats Strip */}
      <div className="lg:hidden">
        <QuickStatsStrip
          stats={stats}
          isLoading={statsLoading}
          onRefresh={refreshStats}
        />
      </div>

      {/* Main Content: Chat + Insights */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Chat Panel - 65% on desktop */}
        <div className="flex-1 lg:w-[65%] min-h-[400px] lg:min-h-0">
          <AIChatPanel
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            error={error}
            onSendMessage={sendMessage}
            onClearConversation={clearConversation}
            onExecuteAction={executeAction}
            className="h-full"
          />
        </div>

        {/* Insights Panel - 35% on desktop */}
        <div className="lg:w-[35%] overflow-y-auto">
          <AIInsightsCards
            insights={insights}
            isLoading={insightsLoading}
            onDismiss={dismissInsight}
            onRefresh={refreshInsights}
          />
        </div>
      </div>

      {/* Bottom: Smart Suggestions */}
      <SmartSuggestionsPanel
        suggestions={suggestions}
        isLoading={suggestionsLoading}
        onAccept={acceptSuggestion}
        onDismiss={dismissSuggestion}
      />
    </div>
  );
}

export default ConversationalAIHub;
