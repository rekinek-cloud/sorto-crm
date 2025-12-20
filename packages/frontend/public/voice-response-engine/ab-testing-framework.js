/**
 * A/B Testing Framework for Voice Response Optimization
 * Advanced testing system for response variants and user satisfaction tracking
 */

class ABTestingFramework {
    constructor() {
        this.activeTests = new Map();
        this.testResults = new Map();
        this.userAssignments = new Map();
        this.responseTracking = new Map();
        this.conversionMetrics = new Map();
        
        this.config = {
            minSampleSize: 50,
            confidenceLevel: 0.95,
            testDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
            maxConcurrentTests: 5,
            autoPromoteThreshold: 0.95
        };
        
        this.initializeFramework();
    }

    async initializeFramework() {
        try {
            await this.loadActiveTests();
            await this.loadUserAssignments();
            await this.loadTestResults();
            this.setupAnalyticsTracking();
            
            console.log('A/B Testing Framework initialized');
        } catch (error) {
            console.error('A/B Testing Framework initialization failed:', error);
        }
    }

    async loadActiveTests() {
        try {
            const saved = localStorage.getItem('abTestingActiveTests');
            if (saved) {
                const data = JSON.parse(saved);
                this.activeTests = new Map(data.tests || []);
            }
        } catch (error) {
            console.error('Failed to load active tests:', error);
        }
    }

    async loadUserAssignments() {
        try {
            const saved = localStorage.getItem('abTestingUserAssignments');
            if (saved) {
                const data = JSON.parse(saved);
                this.userAssignments = new Map(data.assignments || []);
            }
        } catch (error) {
            console.error('Failed to load user assignments:', error);
        }
    }

    async loadTestResults() {
        try {
            const saved = localStorage.getItem('abTestingResults');
            if (saved) {
                const data = JSON.parse(saved);
                this.testResults = new Map(data.results || []);
            }
        } catch (error) {
            console.error('Failed to load test results:', error);
        }
    }

    setupAnalyticsTracking() {
        // Setup event listeners for response tracking
        this.trackingEvents = [
            'response_generated',
            'response_played',
            'response_interrupted',
            'response_replayed',
            'user_feedback',
            'conversion_completed'
        ];
    }

    // Main A/B Testing Methods

    async createTest(testConfig) {
        try {
            const test = this.validateAndCreateTest(testConfig);
            
            if (this.activeTests.size >= this.config.maxConcurrentTests) {
                throw new Error('Maximum concurrent tests limit reached');
            }
            
            this.activeTests.set(test.id, test);
            await this.saveActiveTests();
            
            console.log('A/B test created:', test.id);
            return test;
            
        } catch (error) {
            console.error('Failed to create A/B test:', error);
            throw error;
        }
    }

    validateAndCreateTest(config) {
        const requiredFields = ['name', 'responseType', 'variants', 'metrics'];
        
        for (const field of requiredFields) {
            if (!config[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (config.variants.length < 2) {
            throw new Error('At least 2 variants required for A/B test');
        }

        const test = {
            id: this.generateTestId(),
            name: config.name,
            description: config.description || '',
            responseType: config.responseType,
            variants: config.variants.map((variant, index) => ({
                id: `${config.name}_variant_${index}`,
                name: variant.name || `Variant ${index + 1}`,
                weight: variant.weight || 1 / config.variants.length,
                config: variant.config || {},
                templateOverride: variant.templateOverride,
                ssmlSettings: variant.ssmlSettings,
                nlpSettings: variant.nlpSettings
            })),
            metrics: config.metrics,
            targetAudience: config.targetAudience || {},
            createdAt: Date.now(),
            startDate: config.startDate || Date.now(),
            endDate: config.endDate || (Date.now() + this.config.testDuration),
            status: 'active',
            minSampleSize: config.minSampleSize || this.config.minSampleSize,
            confidenceLevel: config.confidenceLevel || this.config.confidenceLevel
        };

        return test;
    }

    async getVariant(responseType, userId) {
        try {
            // Find active tests for this response type
            const relevantTests = Array.from(this.activeTests.values())
                .filter(test => 
                    test.status === 'active' && 
                    test.responseType === responseType &&
                    this.isUserEligible(test, userId)
                );

            if (relevantTests.length === 0) {
                return this.getDefaultVariant(responseType);
            }

            // For multiple tests, select the highest priority one
            const test = relevantTests.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
            
            // Get or assign user to variant
            let assignment = this.getUserAssignment(test.id, userId);
            
            if (!assignment) {
                assignment = await this.assignUserToVariant(test, userId);
            }

            const variant = test.variants.find(v => v.id === assignment.variantId);
            
            // Track variant exposure
            await this.trackVariantExposure(test.id, assignment.variantId, userId);
            
            return {
                ...variant,
                testId: test.id,
                testName: test.name
            };
            
        } catch (error) {
            console.error('Failed to get A/B test variant:', error);
            return this.getDefaultVariant(responseType);
        }
    }

    isUserEligible(test, userId) {
        const { targetAudience } = test;
        
        if (!targetAudience || Object.keys(targetAudience).length === 0) {
            return true; // No targeting criteria
        }

        // Check user segment eligibility
        if (targetAudience.userSegment) {
            const userSegment = this.getUserSegment(userId);
            if (!targetAudience.userSegment.includes(userSegment)) {
                return false;
            }
        }

        // Check device type eligibility
        if (targetAudience.deviceType) {
            const deviceType = this.getDeviceType();
            if (!targetAudience.deviceType.includes(deviceType)) {
                return false;
            }
        }

        // Check time-based eligibility
        if (targetAudience.timeSlot) {
            const hour = new Date().getHours();
            const isInTimeSlot = targetAudience.timeSlot.some(slot => 
                hour >= slot.start && hour <= slot.end
            );
            if (!isInTimeSlot) {
                return false;
            }
        }

        return true;
    }

    async assignUserToVariant(test, userId) {
        try {
            // Use deterministic assignment based on user ID and test ID
            const hash = this.hashUserId(userId + test.id);
            const variants = test.variants;
            
            // Calculate cumulative weights
            let totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
            const normalizedPosition = hash / 2**32 * totalWeight;
            
            let cumulativeWeight = 0;
            let selectedVariant = variants[0]; // fallback
            
            for (const variant of variants) {
                cumulativeWeight += variant.weight;
                if (normalizedPosition <= cumulativeWeight) {
                    selectedVariant = variant;
                    break;
                }
            }

            const assignment = {
                testId: test.id,
                userId,
                variantId: selectedVariant.id,
                assignedAt: Date.now(),
                exposureCount: 0
            };

            // Store assignment
            const userKey = `${test.id}_${userId}`;
            this.userAssignments.set(userKey, assignment);
            await this.saveUserAssignments();

            return assignment;
            
        } catch (error) {
            console.error('Failed to assign user to variant:', error);
            return {
                testId: test.id,
                userId,
                variantId: test.variants[0].id,
                assignedAt: Date.now(),
                exposureCount: 0
            };
        }
    }

    getUserAssignment(testId, userId) {
        const userKey = `${testId}_${userId}`;
        return this.userAssignments.get(userKey);
    }

    getDefaultVariant(responseType) {
        return {
            id: 'default',
            name: 'Default',
            testId: null,
            testName: 'No active test',
            config: {},
            templateOverride: null
        };
    }

    // Response and Event Tracking

    async trackVariantExposure(testId, variantId, userId) {
        try {
            const exposure = {
                testId,
                variantId,
                userId,
                timestamp: Date.now(),
                eventType: 'variant_exposure'
            };

            // Update exposure count
            const userKey = `${testId}_${userId}`;
            const assignment = this.userAssignments.get(userKey);
            if (assignment) {
                assignment.exposureCount = (assignment.exposureCount || 0) + 1;
                assignment.lastExposure = Date.now();
                this.userAssignments.set(userKey, assignment);
            }

            // Track in results
            await this.recordTestEvent(testId, variantId, 'exposure', exposure);
            
        } catch (error) {
            console.error('Failed to track variant exposure:', error);
        }
    }

    async recordFeedback(responseId, feedback) {
        try {
            const tracking = this.responseTracking.get(responseId);
            if (!tracking) {
                console.warn('No tracking data found for response:', responseId);
                return;
            }

            const event = {
                responseId,
                testId: tracking.testId,
                variantId: tracking.variantId,
                userId: tracking.userId,
                feedback,
                timestamp: Date.now(),
                eventType: 'user_feedback'
            };

            await this.recordTestEvent(tracking.testId, tracking.variantId, 'feedback', event);
            
            // Update conversion metrics if feedback indicates success
            if (feedback.rating >= 4 || feedback.feedbackType === 'thumbs_up') {
                await this.recordConversion(tracking.testId, tracking.variantId, tracking.userId, 'positive_feedback');
            }

        } catch (error) {
            console.error('Failed to record feedback:', error);
        }
    }

    async recordTestEvent(testId, variantId, eventType, eventData) {
        try {
            const resultKey = `${testId}_${variantId}`;
            let result = this.testResults.get(resultKey);
            
            if (!result) {
                result = {
                    testId,
                    variantId,
                    events: [],
                    metrics: {
                        exposures: 0,
                        conversions: 0,
                        positiveRatings: 0,
                        negativeRatings: 0,
                        averageRating: 0,
                        interruptionRate: 0,
                        completionRate: 0
                    },
                    samples: 0,
                    lastUpdated: Date.now()
                };
            }

            result.events.push(eventData);
            result.lastUpdated = Date.now();
            
            // Update metrics based on event type
            this.updateMetrics(result, eventType, eventData);
            
            this.testResults.set(resultKey, result);
            await this.saveTestResults();
            
        } catch (error) {
            console.error('Failed to record test event:', error);
        }
    }

    updateMetrics(result, eventType, eventData) {
        const { metrics } = result;
        
        switch (eventType) {
            case 'exposure':
                metrics.exposures++;
                result.samples = metrics.exposures;
                break;
                
            case 'feedback':
                const { feedback } = eventData;
                if (feedback.rating) {
                    const currentTotal = metrics.averageRating * (metrics.positiveRatings + metrics.negativeRatings);
                    const newCount = metrics.positiveRatings + metrics.negativeRatings + 1;
                    metrics.averageRating = (currentTotal + feedback.rating) / newCount;
                    
                    if (feedback.rating >= 4) {
                        metrics.positiveRatings++;
                    } else if (feedback.rating <= 2) {
                        metrics.negativeRatings++;
                    }
                }
                break;
                
            case 'conversion':
                metrics.conversions++;
                break;
                
            case 'interruption':
                // Calculate interruption rate
                const totalPlays = result.events.filter(e => e.eventType === 'response_played').length;
                const interruptions = result.events.filter(e => e.eventType === 'interruption').length + 1;
                metrics.interruptionRate = interruptions / Math.max(totalPlays, 1);
                break;
                
            case 'completion':
                // Calculate completion rate
                const totalStarts = result.events.filter(e => e.eventType === 'response_played').length;
                const completions = result.events.filter(e => e.eventType === 'completion').length + 1;
                metrics.completionRate = completions / Math.max(totalStarts, 1);
                break;
        }
    }

    async recordConversion(testId, variantId, userId, conversionType) {
        try {
            const conversion = {
                testId,
                variantId,
                userId,
                conversionType,
                timestamp: Date.now(),
                eventType: 'conversion'
            };

            await this.recordTestEvent(testId, variantId, 'conversion', conversion);
            
        } catch (error) {
            console.error('Failed to record conversion:', error);
        }
    }

    // Statistical Analysis

    async analyzeResults() {
        try {
            const analyses = [];
            
            for (const test of this.activeTests.values()) {
                if (this.shouldAnalyzeTest(test)) {
                    const analysis = await this.performStatisticalAnalysis(test);
                    analyses.push(analysis);
                }
            }
            
            return analyses;
            
        } catch (error) {
            console.error('Failed to analyze A/B test results:', error);
            return [];
        }
    }

    shouldAnalyzeTest(test) {
        const now = Date.now();
        const testAge = now - test.startDate;
        const minTestDuration = 24 * 60 * 60 * 1000; // 24 hours minimum
        
        return testAge >= minTestDuration && test.status === 'active';
    }

    async performStatisticalAnalysis(test) {
        try {
            const variantResults = test.variants.map(variant => {
                const resultKey = `${test.id}_${variant.id}`;
                return this.testResults.get(resultKey) || {
                    variantId: variant.id,
                    metrics: { exposures: 0, conversions: 0, averageRating: 0 },
                    samples: 0
                };
            });

            // Primary metric analysis (conversion rate)
            const conversionAnalysis = this.analyzeConversionRates(variantResults);
            
            // Secondary metrics analysis
            const ratingAnalysis = this.analyzeRatings(variantResults);
            const completionAnalysis = this.analyzeCompletionRates(variantResults);
            
            // Statistical significance
            const significance = this.calculateStatisticalSignificance(variantResults, test.confidenceLevel);
            
            // Determine winning variant
            const winner = this.determineWinner(variantResults, significance);
            
            const analysis = {
                testId: test.id,
                testName: test.name,
                status: test.status,
                variants: variantResults,
                conversionAnalysis,
                ratingAnalysis,
                completionAnalysis,
                significance,
                winner,
                recommendation: this.generateRecommendation(significance, winner, test),
                confidence: significance.confidence,
                improvement: winner.improvement || 0,
                sampleSize: variantResults.reduce((sum, v) => sum + v.samples, 0),
                testDuration: Date.now() - test.startDate
            };

            return analysis;
            
        } catch (error) {
            console.error('Statistical analysis failed:', error);
            return null;
        }
    }

    analyzeConversionRates(variantResults) {
        return variantResults.map(result => {
            const { metrics, samples } = result;
            const conversionRate = samples > 0 ? metrics.conversions / samples : 0;
            const standardError = this.calculateStandardError(conversionRate, samples);
            
            return {
                variantId: result.variantId,
                conversionRate,
                standardError,
                confidenceInterval: this.calculateConfidenceInterval(conversionRate, standardError),
                samples
            };
        });
    }

    analyzeRatings(variantResults) {
        return variantResults.map(result => {
            const { metrics, samples } = result;
            return {
                variantId: result.variantId,
                averageRating: metrics.averageRating || 0,
                positiveRatings: metrics.positiveRatings || 0,
                negativeRatings: metrics.negativeRatings || 0,
                ratingCount: (metrics.positiveRatings || 0) + (metrics.negativeRatings || 0),
                samples
            };
        });
    }

    analyzeCompletionRates(variantResults) {
        return variantResults.map(result => {
            const { metrics, samples } = result;
            return {
                variantId: result.variantId,
                completionRate: metrics.completionRate || 0,
                interruptionRate: metrics.interruptionRate || 0,
                samples
            };
        });
    }

    calculateStatisticalSignificance(variantResults, confidenceLevel) {
        if (variantResults.length < 2) {
            return { significant: false, confidence: 0 };
        }

        // Use t-test for comparison
        const controlVariant = variantResults[0];
        const testVariant = variantResults[1];
        
        const controlRate = controlVariant.samples > 0 ? 
            controlVariant.metrics.conversions / controlVariant.samples : 0;
        const testRate = testVariant.samples > 0 ? 
            testVariant.metrics.conversions / testVariant.samples : 0;
            
        const pooledStandardError = this.calculatePooledStandardError(
            controlRate, controlVariant.samples,
            testRate, testVariant.samples
        );
        
        const zScore = Math.abs(testRate - controlRate) / pooledStandardError;
        const pValue = this.calculatePValue(zScore);
        const confidence = 1 - pValue;
        
        return {
            significant: confidence >= confidenceLevel,
            confidence,
            pValue,
            zScore,
            controlRate,
            testRate,
            lift: controlRate > 0 ? ((testRate - controlRate) / controlRate) * 100 : 0
        };
    }

    determineWinner(variantResults, significance) {
        if (!significance.significant) {
            return {
                variantId: null,
                reason: 'No statistically significant difference',
                improvement: 0
            };
        }

        // Find variant with highest conversion rate
        const winner = variantResults.reduce((best, current) => {
            const currentRate = current.samples > 0 ? current.metrics.conversions / current.samples : 0;
            const bestRate = best.samples > 0 ? best.metrics.conversions / best.samples : 0;
            
            return currentRate > bestRate ? current : best;
        });

        const controlVariant = variantResults[0];
        const controlRate = controlVariant.samples > 0 ? 
            controlVariant.metrics.conversions / controlVariant.samples : 0;
        const winnerRate = winner.samples > 0 ? winner.metrics.conversions / winner.samples : 0;
        
        const improvement = controlRate > 0 ? ((winnerRate - controlRate) / controlRate) * 100 : 0;

        return {
            variantId: winner.variantId,
            reason: 'Highest conversion rate with statistical significance',
            improvement,
            rate: winnerRate
        };
    }

    generateRecommendation(significance, winner, test) {
        const { samples } = test;
        const minSamples = test.minSampleSize;
        
        if (samples < minSamples) {
            return {
                action: 'continue',
                reason: `Need more samples (${samples}/${minSamples})`,
                confidence: 'low'
            };
        }

        if (!significance.significant) {
            return {
                action: 'continue_or_stop',
                reason: 'No significant difference detected',
                confidence: 'medium'
            };
        }

        if (winner.improvement > 10 && significance.confidence > 0.95) {
            return {
                action: 'promote_winner',
                reason: `Significant improvement (${winner.improvement.toFixed(1)}%)`,
                confidence: 'high'
            };
        }

        return {
            action: 'continue',
            reason: 'Results are promising but need more confirmation',
            confidence: 'medium'
        };
    }

    // Statistical Utility Methods

    calculateStandardError(rate, samples) {
        if (samples === 0) return 0;
        return Math.sqrt((rate * (1 - rate)) / samples);
    }

    calculateConfidenceInterval(rate, standardError, zScore = 1.96) {
        const margin = zScore * standardError;
        return {
            lower: Math.max(0, rate - margin),
            upper: Math.min(1, rate + margin)
        };
    }

    calculatePooledStandardError(rate1, samples1, rate2, samples2) {
        if (samples1 === 0 || samples2 === 0) return 0;
        
        const pooledRate = (rate1 * samples1 + rate2 * samples2) / (samples1 + samples2);
        const pooledVariance = pooledRate * (1 - pooledRate) * (1/samples1 + 1/samples2);
        
        return Math.sqrt(pooledVariance);
    }

    calculatePValue(zScore) {
        // Approximation of p-value from z-score (two-tailed test)
        return 2 * (1 - this.normalCDF(Math.abs(zScore)));
    }

    normalCDF(x) {
        // Approximation of standard normal cumulative distribution function
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    erf(x) {
        // Approximation of error function
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    // Test Management

    async promoteWinningVariant(testId, winningVariantId) {
        try {
            const test = this.activeTests.get(testId);
            if (!test) {
                throw new Error('Test not found');
            }

            const winningVariant = test.variants.find(v => v.id === winningVariantId);
            if (!winningVariant) {
                throw new Error('Winning variant not found');
            }

            // Mark test as completed
            test.status = 'completed';
            test.winningVariant = winningVariantId;
            test.completedAt = Date.now();

            // Store winning configuration for future use
            await this.storeWinningConfiguration(test, winningVariant);

            this.activeTests.set(testId, test);
            await this.saveActiveTests();

            console.log('Winning variant promoted:', winningVariantId);
            return true;
            
        } catch (error) {
            console.error('Failed to promote winning variant:', error);
            return false;
        }
    }

    async storeWinningConfiguration(test, winningVariant) {
        // Store winning configuration for response type
        const winningConfig = {
            responseType: test.responseType,
            variant: winningVariant,
            testId: test.id,
            promotedAt: Date.now(),
            performance: this.getVariantPerformance(test.id, winningVariant.id)
        };

        const saved = localStorage.getItem('abTestingWinningConfigs') || '{}';
        const configs = JSON.parse(saved);
        configs[test.responseType] = winningConfig;
        
        localStorage.setItem('abTestingWinningConfigs', JSON.stringify(configs));
    }

    getVariantPerformance(testId, variantId) {
        const resultKey = `${testId}_${variantId}`;
        const result = this.testResults.get(resultKey);
        
        if (!result) return null;

        const { metrics, samples } = result;
        return {
            conversionRate: samples > 0 ? metrics.conversions / samples : 0,
            averageRating: metrics.averageRating || 0,
            completionRate: metrics.completionRate || 0,
            samples
        };
    }

    async stopTest(testId, reason = 'Manual stop') {
        try {
            const test = this.activeTests.get(testId);
            if (!test) {
                throw new Error('Test not found');
            }

            test.status = 'stopped';
            test.stoppedAt = Date.now();
            test.stopReason = reason;

            this.activeTests.set(testId, test);
            await this.saveActiveTests();

            console.log('Test stopped:', testId, reason);
            return true;
            
        } catch (error) {
            console.error('Failed to stop test:', error);
            return false;
        }
    }

    // Utility Methods

    generateTestId() {
        return 'abtest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    hashUserId(input) {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    getUserSegment(userId) {
        // Simplified user segmentation
        // In real implementation, this would connect to user analytics
        const hash = this.hashUserId(userId);
        const segments = ['power_user', 'casual_user', 'new_user', 'enterprise_user'];
        return segments[hash % segments.length];
    }

    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mobile')) return 'mobile';
        if (userAgent.includes('tablet')) return 'tablet';
        return 'desktop';
    }

    // Persistence Methods

    async saveActiveTests() {
        try {
            localStorage.setItem('abTestingActiveTests', JSON.stringify({
                tests: Array.from(this.activeTests.entries()),
                lastSaved: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save active tests:', error);
        }
    }

    async saveUserAssignments() {
        try {
            localStorage.setItem('abTestingUserAssignments', JSON.stringify({
                assignments: Array.from(this.userAssignments.entries()),
                lastSaved: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save user assignments:', error);
        }
    }

    async saveTestResults() {
        try {
            localStorage.setItem('abTestingResults', JSON.stringify({
                results: Array.from(this.testResults.entries()),
                lastSaved: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save test results:', error);
        }
    }

    // Public API Methods

    getTestStatus(testId) {
        const test = this.activeTests.get(testId);
        if (!test) return null;

        const variantResults = test.variants.map(variant => {
            const resultKey = `${testId}_${variant.id}`;
            return this.testResults.get(resultKey) || { samples: 0 };
        });

        const totalSamples = variantResults.reduce((sum, v) => sum + v.samples, 0);

        return {
            testId,
            name: test.name,
            status: test.status,
            variants: test.variants.length,
            totalSamples,
            progress: Math.min(totalSamples / test.minSampleSize * 100, 100),
            timeRemaining: Math.max(test.endDate - Date.now(), 0)
        };
    }

    getAllTestStatuses() {
        return Array.from(this.activeTests.keys()).map(testId => this.getTestStatus(testId));
    }

    cleanup() {
        // Clean up old test data
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        for (const [testId, test] of this.activeTests) {
            if (test.completedAt && test.completedAt < oneMonthAgo) {
                this.activeTests.delete(testId);
                
                // Clean up related data
                for (const variant of test.variants) {
                    const resultKey = `${testId}_${variant.id}`;
                    this.testResults.delete(resultKey);
                }
            }
        }

        // Clean up old user assignments
        for (const [userKey, assignment] of this.userAssignments) {
            if (assignment.assignedAt < oneMonthAgo) {
                this.userAssignments.delete(userKey);
            }
        }

        // Save cleaned up data
        this.saveActiveTests();
        this.saveUserAssignments();
        this.saveTestResults();
    }
}

// Export for use in voice response engine
window.ABTestingFramework = ABTestingFramework;