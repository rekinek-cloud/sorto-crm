/**
 * Analytics Tracker for Voice Response User Satisfaction
 * Comprehensive tracking system for voice interaction analytics and user satisfaction metrics
 */

class AnalyticsTracker {
    constructor() {
        this.events = [];
        this.sessions = new Map();
        this.userMetrics = new Map();
        this.satisfactionScores = new Map();
        this.heatmapData = new Map();
        
        this.config = {
            batchSize: 50,
            flushInterval: 30000, // 30 seconds
            retentionDays: 30,
            maxEvents: 10000,
            anonymizeData: true
        };
        
        this.initializeTracker();
    }

    async initializeTracker() {
        try {
            await this.loadStoredData();
            this.setupEventListeners();
            this.startPeriodicFlush();
            this.initializeSessionTracking();
            
            console.log('Analytics Tracker initialized');
        } catch (error) {
            console.error('Analytics Tracker initialization failed:', error);
        }
    }

    async loadStoredData() {
        try {
            // Load events
            const eventsData = localStorage.getItem('voiceAnalyticsEvents');
            if (eventsData) {
                this.events = JSON.parse(eventsData);
            }

            // Load user metrics
            const metricsData = localStorage.getItem('voiceAnalyticsMetrics');
            if (metricsData) {
                const data = JSON.parse(metricsData);
                this.userMetrics = new Map(data.userMetrics || []);
                this.satisfactionScores = new Map(data.satisfactionScores || []);
            }

            // Clean old data
            this.cleanOldData();
            
        } catch (error) {
            console.error('Failed to load stored analytics data:', error);
        }
    }

    setupEventListeners() {
        // Listen for voice interaction events
        document.addEventListener('voiceResponseGenerated', (e) => {
            this.track('voice_response_generated', e.detail);
        });

        document.addEventListener('voiceResponsePlayed', (e) => {
            this.track('voice_response_played', e.detail);
        });

        document.addEventListener('voiceResponseInterrupted', (e) => {
            this.track('voice_response_interrupted', e.detail);
        });

        document.addEventListener('voiceCommandRecognized', (e) => {
            this.track('voice_command_recognized', e.detail);
        });

        document.addEventListener('voiceUserFeedback', (e) => {
            this.track('voice_user_feedback', e.detail);
        });

        // Page visibility for session tracking
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.endSession();
            } else {
                this.startSession();
            }
        });

        // Before unload cleanup
        window.addEventListener('beforeunload', () => {
            this.flush();
        });
    }

    initializeSessionTracking() {
        this.currentSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            lastActivity: Date.now(),
            events: [],
            userId: this.getUserId(),
            deviceType: this.getDeviceType(),
            browserInfo: this.getBrowserInfo()
        };

        this.sessions.set(this.currentSession.id, this.currentSession);
    }

    // Main Tracking Methods

    track(eventName, eventData = {}) {
        try {
            const event = this.createEvent(eventName, eventData);
            this.events.push(event);
            
            // Add to current session
            if (this.currentSession) {
                this.currentSession.events.push(event.id);
                this.currentSession.lastActivity = Date.now();
            }

            // Update real-time metrics
            this.updateRealTimeMetrics(event);

            // Auto-flush if batch size reached
            if (this.events.length >= this.config.batchSize) {
                this.flush();
            }

            // Dispatch custom event for real-time listeners
            this.dispatchAnalyticsEvent(eventName, event);
            
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    }

    createEvent(eventName, eventData) {
        const event = {
            id: this.generateEventId(),
            name: eventName,
            timestamp: Date.now(),
            sessionId: this.currentSession?.id,
            userId: this.getUserId(),
            data: this.sanitizeEventData(eventData),
            context: this.getEventContext(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer
        };

        // Add specific metadata based on event type
        switch (eventName) {
            case 'voice_response_generated':
                event.metadata = this.getResponseMetadata(eventData);
                break;
            case 'voice_response_played':
                event.metadata = this.getPlaybackMetadata(eventData);
                break;
            case 'voice_user_feedback':
                event.metadata = this.getFeedbackMetadata(eventData);
                break;
        }

        return event;
    }

    sanitizeEventData(data) {
        if (!this.config.anonymizeData) {
            return data;
        }

        // Remove or anonymize sensitive data
        const sanitized = { ...data };
        
        // Remove personal information
        delete sanitized.email;
        delete sanitized.phone;
        delete sanitized.fullName;
        
        // Hash user identifiers
        if (sanitized.userId) {
            sanitized.userId = this.hashUserId(sanitized.userId);
        }
        
        // Truncate long text content
        if (sanitized.content && sanitized.content.length > 500) {
            sanitized.content = sanitized.content.substring(0, 500) + '...';
        }

        return sanitized;
    }

    getEventContext() {
        return {
            timeOfDay: this.getTimeOfDay(),
            dayOfWeek: new Date().getDay(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            connectionType: this.getConnectionType(),
            battery: this.getBatteryInfo()
        };
    }

    // Specific Event Metadata Generators

    getResponseMetadata(data) {
        return {
            responseType: data.responseType,
            responseLength: data.text?.length || 0,
            ssmlLength: data.ssml?.length || 0,
            generationTime: data.generationTime || 0,
            variant: data.variant?.id,
            testId: data.testId,
            emotionalContext: data.emotionalContext?.primaryEmotion,
            followUpCount: data.followUpSuggestions?.length || 0
        };
    }

    getPlaybackMetadata(data) {
        return {
            playbackDuration: data.duration || 0,
            playbackRate: data.rate || 1.0,
            voice: data.voice || 'default',
            volume: data.volume || 1.0,
            interrupted: data.interrupted || false,
            interruptionPoint: data.interruptionPoint || null,
            completionPercentage: data.completionPercentage || 0
        };
    }

    getFeedbackMetadata(data) {
        return {
            feedbackType: data.feedbackType,
            rating: data.rating,
            responseTime: data.responseTime || 0,
            sentiment: this.analyzeSentiment(data.comments),
            categories: this.categorizeFeedback(data.comments),
            contextRelevant: data.contextRelevant || false
        };
    }

    // User Satisfaction Tracking

    async trackUserFeedback(responseId, feedback) {
        try {
            const feedbackEvent = {
                responseId,
                rating: feedback.rating,
                feedbackType: feedback.feedbackType,
                comments: feedback.comments,
                timestamp: Date.now(),
                responseTime: feedback.responseTime || 0
            };

            this.track('voice_user_feedback', feedbackEvent);
            
            // Update satisfaction scores
            await this.updateSatisfactionScores(feedback);
            
            // Update user metrics
            await this.updateUserMetrics(feedback);
            
            // Generate insights
            this.generateFeedbackInsights(feedback);
            
        } catch (error) {
            console.error('Failed to track user feedback:', error);
        }
    }

    async updateSatisfactionScores(feedback) {
        const userId = this.getUserId();
        const today = new Date().toISOString().split('T')[0];
        const scoreKey = `${userId}_${today}`;
        
        let dailyScore = this.satisfactionScores.get(scoreKey) || {
            userId,
            date: today,
            ratings: [],
            averageRating: 0,
            totalFeedback: 0,
            positiveCount: 0,
            negativeCount: 0
        };

        dailyScore.ratings.push(feedback.rating);
        dailyScore.totalFeedback++;
        
        if (feedback.rating >= 4) {
            dailyScore.positiveCount++;
        } else if (feedback.rating <= 2) {
            dailyScore.negativeCount++;
        }

        dailyScore.averageRating = dailyScore.ratings.reduce((sum, r) => sum + r, 0) / dailyScore.ratings.length;
        
        this.satisfactionScores.set(scoreKey, dailyScore);
        await this.saveSatisfactionScores();
    }

    async updateUserMetrics(feedback) {
        const userId = this.getUserId();
        let metrics = this.userMetrics.get(userId) || {
            userId,
            totalInteractions: 0,
            totalFeedback: 0,
            averageSatisfaction: 0,
            preferredResponseTypes: {},
            commonIssues: {},
            satisfactionTrend: [],
            lastInteraction: Date.now(),
            engagementScore: 0
        };

        metrics.totalInteractions++;
        metrics.totalFeedback++;
        metrics.lastInteraction = Date.now();
        
        // Update satisfaction trend
        metrics.satisfactionTrend.push({
            timestamp: Date.now(),
            rating: feedback.rating,
            responseType: feedback.responseType
        });
        
        // Keep only last 50 ratings for trend
        if (metrics.satisfactionTrend.length > 50) {
            metrics.satisfactionTrend = metrics.satisfactionTrend.slice(-50);
        }
        
        // Calculate average satisfaction
        const ratings = metrics.satisfactionTrend.map(t => t.rating);
        metrics.averageSatisfaction = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        
        // Update response type preferences
        const responseType = feedback.responseType || 'general';
        if (!metrics.preferredResponseTypes[responseType]) {
            metrics.preferredResponseTypes[responseType] = { count: 0, avgRating: 0, ratings: [] };
        }
        
        const typeMetrics = metrics.preferredResponseTypes[responseType];
        typeMetrics.count++;
        typeMetrics.ratings.push(feedback.rating);
        typeMetrics.avgRating = typeMetrics.ratings.reduce((sum, r) => sum + r, 0) / typeMetrics.ratings.length;
        
        // Track common issues
        if (feedback.rating <= 2 && feedback.comments) {
            const issues = this.extractIssues(feedback.comments);
            issues.forEach(issue => {
                metrics.commonIssues[issue] = (metrics.commonIssues[issue] || 0) + 1;
            });
        }
        
        // Calculate engagement score
        metrics.engagementScore = this.calculateEngagementScore(metrics);
        
        this.userMetrics.set(userId, metrics);
        await this.saveUserMetrics();
    }

    // Analytics and Insights

    async getVoiceResponseAnalytics(timeRange = '7d') {
        try {
            const endTime = Date.now();
            const startTime = this.getStartTime(timeRange);
            
            const relevantEvents = this.events.filter(event => 
                event.timestamp >= startTime && event.timestamp <= endTime
            );

            const analytics = {
                timeRange,
                totalEvents: relevantEvents.length,
                uniqueUsers: this.getUniqueUsers(relevantEvents),
                totalSessions: this.getSessionCount(relevantEvents),
                responseTypes: this.analyzeResponseTypes(relevantEvents),
                satisfactionMetrics: await this.getSatisfactionMetrics(timeRange),
                usagePatterns: this.analyzeUsagePatterns(relevantEvents),
                performanceMetrics: this.analyzePerformanceMetrics(relevantEvents),
                errorAnalysis: this.analyzeErrors(relevantEvents),
                trendAnalysis: this.analyzeTrends(relevantEvents),
                userEngagement: this.analyzeUserEngagement(relevantEvents),
                conversionMetrics: this.analyzeConversions(relevantEvents)
            };

            return analytics;
            
        } catch (error) {
            console.error('Failed to get voice response analytics:', error);
            return null;
        }
    }

    async getSatisfactionMetrics(timeRange = '7d') {
        const endTime = Date.now();
        const startTime = this.getStartTime(timeRange);
        
        const relevantScores = Array.from(this.satisfactionScores.values())
            .filter(score => {
                const scoreTime = new Date(score.date).getTime();
                return scoreTime >= startTime && scoreTime <= endTime;
            });

        if (relevantScores.length === 0) {
            return {
                averageRating: 0,
                totalFeedback: 0,
                satisfactionRate: 0,
                nps: 0,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }

        const allRatings = relevantScores.flatMap(score => score.ratings);
        const averageRating = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
        const satisfactionRate = (allRatings.filter(r => r >= 4).length / allRatings.length) * 100;
        
        // Calculate Net Promoter Score (NPS)
        const promoters = allRatings.filter(r => r >= 4).length;
        const detractors = allRatings.filter(r => r <= 2).length;
        const nps = ((promoters - detractors) / allRatings.length) * 100;
        
        // Rating distribution
        const distribution = {};
        for (let i = 1; i <= 5; i++) {
            distribution[i] = allRatings.filter(r => r === i).length;
        }

        return {
            averageRating: Number(averageRating.toFixed(2)),
            totalFeedback: allRatings.length,
            satisfactionRate: Number(satisfactionRate.toFixed(2)),
            nps: Number(nps.toFixed(2)),
            distribution,
            trendData: this.getSatisfactionTrend(relevantScores)
        };
    }

    analyzeResponseTypes(events) {
        const responseEvents = events.filter(e => e.name === 'voice_response_generated');
        const typeAnalysis = {};

        responseEvents.forEach(event => {
            const responseType = event.metadata?.responseType || 'unknown';
            
            if (!typeAnalysis[responseType]) {
                typeAnalysis[responseType] = {
                    count: 0,
                    averageLength: 0,
                    averageGenerationTime: 0,
                    lengths: [],
                    generationTimes: []
                };
            }

            const analysis = typeAnalysis[responseType];
            analysis.count++;
            
            if (event.metadata?.responseLength) {
                analysis.lengths.push(event.metadata.responseLength);
                analysis.averageLength = analysis.lengths.reduce((sum, l) => sum + l, 0) / analysis.lengths.length;
            }
            
            if (event.metadata?.generationTime) {
                analysis.generationTimes.push(event.metadata.generationTime);
                analysis.averageGenerationTime = analysis.generationTimes.reduce((sum, t) => sum + t, 0) / analysis.generationTimes.length;
            }
        });

        return typeAnalysis;
    }

    analyzeUsagePatterns(events) {
        const patterns = {
            hourlyDistribution: {},
            dailyDistribution: {},
            sessionLengths: [],
            popularCommands: {},
            deviceTypes: {},
            peakUsageHours: []
        };

        events.forEach(event => {
            const date = new Date(event.timestamp);
            const hour = date.getHours();
            const day = date.getDay();

            // Hourly distribution
            patterns.hourlyDistribution[hour] = (patterns.hourlyDistribution[hour] || 0) + 1;
            
            // Daily distribution
            patterns.dailyDistribution[day] = (patterns.dailyDistribution[day] || 0) + 1;
            
            // Device types
            const deviceType = event.context?.deviceType || 'unknown';
            patterns.deviceTypes[deviceType] = (patterns.deviceTypes[deviceType] || 0) + 1;
            
            // Commands
            if (event.name === 'voice_command_recognized' && event.data?.command) {
                const command = event.data.command;
                patterns.popularCommands[command] = (patterns.popularCommands[command] || 0) + 1;
            }
        });

        // Calculate peak usage hours
        const hourlyEntries = Object.entries(patterns.hourlyDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        patterns.peakUsageHours = hourlyEntries.map(([hour, count]) => ({ hour: parseInt(hour), count }));

        return patterns;
    }

    analyzePerformanceMetrics(events) {
        const responseEvents = events.filter(e => e.name === 'voice_response_generated');
        const playbackEvents = events.filter(e => e.name === 'voice_response_played');
        
        const generationTimes = responseEvents
            .map(e => e.metadata?.generationTime)
            .filter(t => t != null);
            
        const playbackDurations = playbackEvents
            .map(e => e.metadata?.playbackDuration)
            .filter(d => d != null);
            
        const completionRates = playbackEvents
            .map(e => e.metadata?.completionPercentage)
            .filter(c => c != null);

        return {
            averageGenerationTime: generationTimes.length > 0 ? 
                generationTimes.reduce((sum, t) => sum + t, 0) / generationTimes.length : 0,
            medianGenerationTime: this.calculateMedian(generationTimes),
            averagePlaybackDuration: playbackDurations.length > 0 ?
                playbackDurations.reduce((sum, d) => sum + d, 0) / playbackDurations.length : 0,
            averageCompletionRate: completionRates.length > 0 ?
                completionRates.reduce((sum, c) => sum + c, 0) / completionRates.length : 0,
            interruptionRate: this.calculateInterruptionRate(playbackEvents),
            errorRate: this.calculateErrorRate(events)
        };
    }

    analyzeErrors(events) {
        const errorEvents = events.filter(e => 
            e.name.includes('error') || 
            e.data?.error || 
            e.data?.status === 'error'
        );

        const errorAnalysis = {
            totalErrors: errorEvents.length,
            errorTypes: {},
            errorRate: events.length > 0 ? (errorEvents.length / events.length) * 100 : 0,
            commonErrors: {},
            errorTrend: []
        };

        errorEvents.forEach(event => {
            const errorType = event.data?.errorType || event.data?.error?.type || 'unknown';
            errorAnalysis.errorTypes[errorType] = (errorAnalysis.errorTypes[errorType] || 0) + 1;
            
            const errorMessage = event.data?.error?.message || event.data?.message || 'Unknown error';
            errorAnalysis.commonErrors[errorMessage] = (errorAnalysis.commonErrors[errorMessage] || 0) + 1;
            
            errorAnalysis.errorTrend.push({
                timestamp: event.timestamp,
                type: errorType,
                message: errorMessage
            });
        });

        return errorAnalysis;
    }

    analyzeTrends(events) {
        const timeSlots = this.groupEventsByTimeSlots(events, '1h');
        
        return {
            usageTrend: timeSlots.map(slot => ({
                timestamp: slot.timestamp,
                eventCount: slot.events.length,
                uniqueUsers: this.getUniqueUsers(slot.events)
            })),
            responseTypeTrends: this.analyzeResponseTypeTrends(timeSlots),
            satisfactionTrend: this.getSatisfactionTrendFromEvents(events)
        };
    }

    analyzeUserEngagement(events) {
        const sessionEvents = this.groupEventsBySessions(events);
        const sessionMetrics = sessionEvents.map(session => ({
            sessionId: session.sessionId,
            duration: session.duration,
            eventCount: session.events.length,
            interactionDepth: this.calculateInteractionDepth(session.events),
            bounceRate: session.events.length <= 1 ? 1 : 0
        }));

        return {
            totalSessions: sessionMetrics.length,
            averageSessionDuration: sessionMetrics.reduce((sum, s) => sum + s.duration, 0) / sessionMetrics.length,
            averageEventsPerSession: sessionMetrics.reduce((sum, s) => sum + s.eventCount, 0) / sessionMetrics.length,
            bounceRate: (sessionMetrics.filter(s => s.bounceRate === 1).length / sessionMetrics.length) * 100,
            engagementScore: this.calculateOverallEngagementScore(sessionMetrics),
            returnUserRate: this.calculateReturnUserRate(events)
        };
    }

    // Utility Methods

    getStartTime(timeRange) {
        const now = Date.now();
        const ranges = {
            '1h': 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        
        return now - (ranges[timeRange] || ranges['7d']);
    }

    getUniqueUsers(events) {
        const userIds = new Set(events.map(e => e.userId).filter(Boolean));
        return userIds.size;
    }

    getSessionCount(events) {
        const sessionIds = new Set(events.map(e => e.sessionId).filter(Boolean));
        return sessionIds.size;
    }

    calculateMedian(values) {
        if (values.length === 0) return 0;
        
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        return sorted.length % 2 !== 0 ? 
            sorted[mid] : 
            (sorted[mid - 1] + sorted[mid]) / 2;
    }

    calculateInterruptionRate(playbackEvents) {
        if (playbackEvents.length === 0) return 0;
        
        const interrupted = playbackEvents.filter(e => e.metadata?.interrupted).length;
        return (interrupted / playbackEvents.length) * 100;
    }

    calculateErrorRate(events) {
        if (events.length === 0) return 0;
        
        const errors = events.filter(e => 
            e.name.includes('error') || 
            e.data?.error || 
            e.data?.status === 'error'
        ).length;
        
        return (errors / events.length) * 100;
    }

    calculateEngagementScore(metrics) {
        // Engagement score based on multiple factors
        const factors = {
            interactionFrequency: Math.min(metrics.totalInteractions / 100, 1) * 0.3,
            satisfactionLevel: (metrics.averageSatisfaction / 5) * 0.4,
            feedbackParticipation: Math.min(metrics.totalFeedback / metrics.totalInteractions, 1) * 0.2,
            recency: this.calculateRecencyScore(metrics.lastInteraction) * 0.1
        };
        
        return Object.values(factors).reduce((sum, factor) => sum + factor, 0) * 100;
    }

    calculateRecencyScore(lastInteraction) {
        const daysSince = (Date.now() - lastInteraction) / (24 * 60 * 60 * 1000);
        return Math.max(0, 1 - (daysSince / 30)); // Decay over 30 days
    }

    // Advanced Analytics Methods

    generateFeedbackInsights(feedback) {
        const insights = {
            sentiment: this.analyzeSentiment(feedback.comments),
            categories: this.categorizeFeedback(feedback.comments),
            actionItems: this.extractActionItems(feedback),
            urgency: this.assessFeedbackUrgency(feedback)
        };

        // Store insights for reporting
        this.track('feedback_insights', insights);
        
        return insights;
    }

    analyzeSentiment(text) {
        if (!text) return 'neutral';
        
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'helpful', 'clear', 'fast'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'slow', 'confusing', 'unclear', 'broken', 'wrong'];
        
        const words = text.toLowerCase().split(/\W+/);
        let positiveScore = 0;
        let negativeScore = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveScore++;
            if (negativeWords.includes(word)) negativeScore++;
        });
        
        if (positiveScore > negativeScore) return 'positive';
        if (negativeScore > positiveScore) return 'negative';
        return 'neutral';
    }

    categorizeFeedback(text) {
        if (!text) return [];
        
        const categories = {
            performance: ['slow', 'fast', 'lag', 'quick', 'responsive'],
            accuracy: ['wrong', 'correct', 'accurate', 'mistake', 'error'],
            clarity: ['clear', 'unclear', 'confusing', 'understand', 'explain'],
            helpfulness: ['helpful', 'useless', 'useful', 'relevant', 'irrelevant'],
            voice: ['voice', 'sound', 'pronunciation', 'accent', 'volume']
        };
        
        const foundCategories = [];
        const words = text.toLowerCase().split(/\W+/);
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => words.includes(keyword))) {
                foundCategories.push(category);
            }
        }
        
        return foundCategories;
    }

    extractIssues(text) {
        if (!text) return [];
        
        const issuePatterns = {
            'too_slow': /slow|lag|delay/i,
            'too_fast': /fast|quick|speed/i,
            'unclear': /unclear|confusing|understand/i,
            'wrong_info': /wrong|incorrect|mistake/i,
            'voice_quality': /voice|sound|pronunciation/i,
            'interruption': /interrupt|cut|stop/i
        };
        
        const issues = [];
        for (const [issue, pattern] of Object.entries(issuePatterns)) {
            if (pattern.test(text)) {
                issues.push(issue);
            }
        }
        
        return issues;
    }

    extractActionItems(feedback) {
        const actionItems = [];
        
        if (feedback.rating <= 2) {
            actionItems.push('investigate_negative_feedback');
        }
        
        if (feedback.comments) {
            const issues = this.extractIssues(feedback.comments);
            issues.forEach(issue => {
                actionItems.push(`address_${issue}`);
            });
        }
        
        return actionItems;
    }

    assessFeedbackUrgency(feedback) {
        let urgencyScore = 0;
        
        if (feedback.rating === 1) urgencyScore += 3;
        else if (feedback.rating === 2) urgencyScore += 2;
        else if (feedback.rating >= 4) urgencyScore -= 1;
        
        if (feedback.comments) {
            const urgentWords = ['urgent', 'critical', 'broken', 'terrible', 'unusable'];
            const words = feedback.comments.toLowerCase().split(/\W+/);
            urgentWords.forEach(word => {
                if (words.includes(word)) urgencyScore += 2;
            });
        }
        
        if (urgencyScore >= 4) return 'high';
        if (urgencyScore >= 2) return 'medium';
        return 'low';
    }

    // Session Management

    startSession() {
        if (!this.currentSession || this.isSessionExpired()) {
            this.initializeSessionTracking();
        }
    }

    endSession() {
        if (this.currentSession) {
            this.currentSession.endTime = Date.now();
            this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
            
            // Track session end
            this.track('session_ended', {
                sessionId: this.currentSession.id,
                duration: this.currentSession.duration,
                eventCount: this.currentSession.events.length
            });
        }
    }

    isSessionExpired() {
        if (!this.currentSession) return true;
        
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes
        return (Date.now() - this.currentSession.lastActivity) > sessionTimeout;
    }

    startPeriodicFlush() {
        setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    }

    // Data Persistence

    async flush() {
        try {
            await this.saveEvents();
            await this.saveUserMetrics();
            await this.saveSatisfactionScores();
            
            console.log(`Flushed ${this.events.length} analytics events`);
        } catch (error) {
            console.error('Failed to flush analytics data:', error);
        }
    }

    async saveEvents() {
        try {
            // Keep only recent events to prevent storage overflow
            if (this.events.length > this.config.maxEvents) {
                this.events = this.events.slice(-this.config.maxEvents);
            }
            
            localStorage.setItem('voiceAnalyticsEvents', JSON.stringify(this.events));
        } catch (error) {
            console.error('Failed to save analytics events:', error);
        }
    }

    async saveUserMetrics() {
        try {
            localStorage.setItem('voiceAnalyticsMetrics', JSON.stringify({
                userMetrics: Array.from(this.userMetrics.entries()),
                lastSaved: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save user metrics:', error);
        }
    }

    async saveSatisfactionScores() {
        try {
            localStorage.setItem('voiceAnalyticsSatisfaction', JSON.stringify({
                satisfactionScores: Array.from(this.satisfactionScores.entries()),
                lastSaved: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save satisfaction scores:', error);
        }
    }

    cleanOldData() {
        const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
        
        // Clean old events
        this.events = this.events.filter(event => event.timestamp > cutoffTime);
        
        // Clean old satisfaction scores
        for (const [key, score] of this.satisfactionScores) {
            const scoreTime = new Date(score.date).getTime();
            if (scoreTime < cutoffTime) {
                this.satisfactionScores.delete(key);
            }
        }
    }

    // Utility ID Generators

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateEventId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserId() {
        // In a real implementation, this would get the actual user ID
        let userId = localStorage.getItem('voiceAnalyticsUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('voiceAnalyticsUserId', userId);
        }
        return userId;
    }

    hashUserId(userId) {
        // Simple hash for anonymization
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Context Helpers

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }

    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mobile')) return 'mobile';
        if (userAgent.includes('tablet')) return 'tablet';
        return 'desktop';
    }

    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };
    }

    getConnectionType() {
        return navigator.connection?.effectiveType || 'unknown';
    }

    getBatteryInfo() {
        return navigator.getBattery ? 'available' : 'unavailable';
    }

    dispatchAnalyticsEvent(eventName, event) {
        const customEvent = new CustomEvent('analyticsEvent', {
            detail: { eventName, event }
        });
        document.dispatchEvent(customEvent);
    }
}

// Export for use in voice response engine
window.AnalyticsTracker = AnalyticsTracker;