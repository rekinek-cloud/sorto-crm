/**
 * Intelligent Voice Response Engine for Sorto CRM
 * Provides natural, conversational responses with A/B testing and analytics
 */

class VoiceResponseEngine {
    constructor(apiClient, analyticsTracker) {
        this.apiClient = apiClient;
        this.analytics = analyticsTracker;
        this.abTesting = new ABTestingFramework();
        this.contextManager = new ContextManager();
        this.nlpProcessor = new NLPProcessor();
        this.ssmlBuilder = new SSMLBuilder();
        this.userPreferences = new UserPreferences();
        
        this.responseTypes = {
            TASK: new TaskResponseHandler(),
            CLIENT: new ClientResponseHandler(),
            CALENDAR: new CalendarResponseHandler(),
            GOAL: new GoalResponseHandler(),
            ERROR: new ErrorResponseHandler()
        };
        
        this.initializeEngine();
    }

    async initializeEngine() {
        try {
            // Load user preferences and context
            await this.userPreferences.load();
            await this.contextManager.initialize();
            
            // Initialize A/B testing variants
            await this.abTesting.loadActiveTests();
            
            // Setup analytics tracking
            this.analytics.track('voice_engine_initialized', {
                timestamp: Date.now(),
                version: '1.0.0'
            });
            
            console.log('Voice Response Engine initialized successfully');
        } catch (error) {
            console.error('Voice Response Engine initialization failed:', error);
        }
    }

    /**
     * Main method to generate voice responses
     */
    async generateResponse(requestType, data, context = {}) {
        const startTime = performance.now();
        
        try {
            // Update context with current request
            const enrichedContext = await this.contextManager.updateContext(context, data);
            
            // Get A/B testing variant for this response
            const variant = await this.abTesting.getVariant(requestType, enrichedContext.userId);
            
            // Get appropriate response handler
            const handler = this.responseTypes[requestType];
            if (!handler) {
                throw new Error(`Unknown response type: ${requestType}`);
            }
            
            // Generate base response
            const baseResponse = await handler.generateResponse(data, enrichedContext, variant);
            
            // Apply natural language processing
            const naturalResponse = await this.nlpProcessor.enhance(baseResponse, enrichedContext);
            
            // Convert to SSML for optimized speech
            const ssmlResponse = await this.ssmlBuilder.build(naturalResponse, enrichedContext);
            
            // Track response generation
            const duration = performance.now() - startTime;
            await this.trackResponseGeneration(requestType, variant, duration, ssmlResponse);
            
            return {
                text: naturalResponse.text,
                ssml: ssmlResponse,
                followUpSuggestions: naturalResponse.followUpSuggestions,
                metadata: {
                    variant: variant.id,
                    duration,
                    context: enrichedContext,
                    responseLength: naturalResponse.text.length
                }
            };
            
        } catch (error) {
            console.error('Response generation failed:', error);
            
            // Generate error response
            const errorResponse = await this.responseTypes.ERROR.generateResponse(error, context);
            
            // Track error
            this.analytics.track('response_generation_error', {
                requestType,
                error: error.message,
                context
            });
            
            return {
                text: errorResponse.text,
                ssml: await this.ssmlBuilder.build(errorResponse, context),
                isError: true
            };
        }
    }

    /**
     * Handle user feedback for response optimization
     */
    async handleUserFeedback(responseId, feedbackType, rating, comments = null) {
        try {
            const feedback = {
                responseId,
                feedbackType, // 'thumbs_up', 'thumbs_down', 'rating', 'interruption'
                rating, // 1-5 scale
                comments,
                timestamp: Date.now(),
                userId: this.contextManager.getCurrentUserId()
            };
            
            // Track feedback
            await this.analytics.track('voice_response_feedback', feedback);
            
            // Update A/B testing results
            await this.abTesting.recordFeedback(responseId, feedback);
            
            // Update user preferences based on feedback
            await this.userPreferences.updateFromFeedback(feedback);
            
            console.log('User feedback recorded:', feedback);
            
        } catch (error) {
            console.error('Failed to handle user feedback:', error);
        }
    }

    /**
     * Get personalized greeting based on time and context
     */
    async getPersonalizedGreeting(context = {}) {
        const hour = new Date().getHours();
        const userName = this.userPreferences.get('preferredName') || 'there';
        const productivity = await this.getProductivityContext();
        
        let greeting = '';
        let timeBasedGreeting = '';
        
        // Time-based greetings
        if (hour < 12) {
            timeBasedGreeting = `Dzień dobry, ${userName}`;
        } else if (hour < 17) {
            timeBasedGreeting = `Witaj, ${userName}`;
        } else {
            timeBasedGreeting = `Dobry wieczór, ${userName}`;
        }
        
        // Add productivity context
        if (productivity.streak > 0) {
            greeting = `${timeBasedGreeting}! Widzę, że masz ${productivity.streak} dni z rzędu produktywnej pracy. Świetnie!`;
        } else if (productivity.tasksCompleted > 0) {
            greeting = `${timeBasedGreeting}! Już ukończyłeś ${productivity.tasksCompleted} zadań dzisiaj.`;
        } else {
            greeting = `${timeBasedGreeting}! Gotowy na produktywny dzień?`;
        }
        
        return this.generateResponse('GREETING', { greeting, productivity }, context);
    }

    /**
     * Generate task-related responses
     */
    async generateTaskResponse(tasks, queryType, context = {}) {
        return this.generateResponse('TASK', {
            tasks,
            queryType, // 'list', 'status', 'completion', 'priority'
            context
        }, context);
    }

    /**
     * Generate client information responses
     */
    async generateClientResponse(clientData, queryType, context = {}) {
        return this.generateResponse('CLIENT', {
            clientData,
            queryType, // 'info', 'history', 'meetings', 'deals'
            context
        }, context);
    }

    /**
     * Generate calendar responses
     */
    async generateCalendarResponse(meetings, queryType, context = {}) {
        return this.generateResponse('CALENDAR', {
            meetings,
            queryType, // 'today', 'upcoming', 'summary', 'conflicts'
            context
        }, context);
    }

    /**
     * Generate goal progress responses
     */
    async generateGoalResponse(goals, queryType, context = {}) {
        return this.generateResponse('GOAL', {
            goals,
            queryType, // 'progress', 'achievement', 'summary', 'motivation'
            context
        }, context);
    }

    /**
     * Private helper methods
     */
    async getProductivityContext() {
        try {
            const stats = await this.apiClient.getDashboardStats();
            const streak = await this.calculateProductivityStreak();
            
            return {
                tasksCompleted: stats.stats?.completedTasks || 0,
                tasksActive: stats.stats?.activeTasks || 0,
                streak,
                efficiency: this.calculateEfficiencyScore(stats)
            };
        } catch (error) {
            console.error('Failed to get productivity context:', error);
            return { tasksCompleted: 0, tasksActive: 0, streak: 0, efficiency: 0 };
        }
    }

    async calculateProductivityStreak() {
        // Implementation would check daily task completion history
        // For now, return a simulated value
        return Math.floor(Math.random() * 7) + 1;
    }

    calculateEfficiencyScore(stats) {
        const total = (stats.stats?.totalTasks || 0);
        const completed = (stats.stats?.completedTasks || 0);
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    async trackResponseGeneration(responseType, variant, duration, ssml) {
        this.analytics.track('voice_response_generated', {
            responseType,
            variantId: variant.id,
            duration,
            ssmlLength: ssml.length,
            timestamp: Date.now()
        });
    }

    /**
     * Public API for response management
     */
    async optimizeResponses() {
        try {
            // Analyze A/B testing results
            const results = await this.abTesting.analyzeResults();
            
            // Update winning variants
            for (const result of results) {
                if (result.confidence > 0.95 && result.improvement > 0.1) {
                    await this.abTesting.promoteWinningVariant(result.testId, result.winningVariant);
                }
            }
            
            // Generate optimization report
            return {
                testsAnalyzed: results.length,
                variantsPromoted: results.filter(r => r.promoted).length,
                averageImprovement: results.reduce((sum, r) => sum + r.improvement, 0) / results.length
            };
            
        } catch (error) {
            console.error('Response optimization failed:', error);
            return null;
        }
    }

    async getAnalytics(timeRange = '7d') {
        try {
            return await this.analytics.getVoiceResponseAnalytics(timeRange);
        } catch (error) {
            console.error('Failed to get analytics:', error);
            return null;
        }
    }

    async getUserSatisfactionMetrics() {
        try {
            return await this.analytics.getUserSatisfactionMetrics();
        } catch (error) {
            console.error('Failed to get satisfaction metrics:', error);
            return null;
        }
    }

    // Cleanup method
    destroy() {
        this.abTesting.cleanup();
        this.analytics.flush();
        this.contextManager.cleanup();
    }
}

// Export for use in applications
window.VoiceResponseEngine = VoiceResponseEngine;