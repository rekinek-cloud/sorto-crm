/**
 * Natural Language Processing Engine
 * Enhances responses with context-aware language and personalization
 */

class NLPProcessor {
    constructor() {
        this.contextPatterns = new Map();
        this.personalizationRules = new Map();
        this.languageEnhancers = new Map();
        this.emotionalIntelligence = new EmotionalIntelligence();
        
        this.initializeProcessors();
    }

    initializeProcessors() {
        this.setupContextPatterns();
        this.setupPersonalizationRules();
        this.setupLanguageEnhancers();
    }

    async enhance(baseResponse, context) {
        try {
            let enhancedResponse = { ...baseResponse };

            // Apply context-aware enhancements
            enhancedResponse = await this.applyContextEnhancements(enhancedResponse, context);

            // Apply personalization
            enhancedResponse = await this.applyPersonalization(enhancedResponse, context);

            // Apply emotional intelligence
            enhancedResponse = await this.applyEmotionalIntelligence(enhancedResponse, context);

            // Apply language polishing
            enhancedResponse = await this.applyLanguagePolishing(enhancedResponse, context);

            // Generate follow-up suggestions
            enhancedResponse.followUpSuggestions = await this.generateFollowUpSuggestions(
                enhancedResponse, context
            );

            return enhancedResponse;

        } catch (error) {
            console.error('NLP enhancement failed:', error);
            return baseResponse; // Return original if enhancement fails
        }
    }

    setupContextPatterns() {
        // Time-based context patterns
        this.contextPatterns.set('time_morning', {
            patterns: [/rano|ranek|wczesn/i],
            enhancements: {
                greeting: 'Dzień dobry',
                energy: 'energii na cały dzień',
                motivation: 'Świetny start dnia!'
            }
        });

        this.contextPatterns.set('time_afternoon', {
            patterns: [/południ|po\s+południ/i],
            enhancements: {
                greeting: 'Witaj',
                energy: 'kontynuuj dobrą pracę',
                motivation: 'Połowa dnia za Tobą!'
            }
        });

        this.contextPatterns.set('time_evening', {
            patterns: [/wieczór|późn/i],
            enhancements: {
                greeting: 'Dobry wieczór',
                energy: 'dobij dzień sukcesem',
                motivation: 'Końcówka dnia!'
            }
        });

        // Productivity context patterns
        this.contextPatterns.set('high_productivity', {
            patterns: [/produktywn|efektywn|sukces/i],
            enhancements: {
                tone: 'celebratory',
                encouragement: 'Fantastyczna robota!',
                momentum: 'Trzymaj tempo!'
            }
        });

        this.contextPatterns.set('low_productivity', {
            patterns: [/wolno|opóźnien|problem/i],
            enhancements: {
                tone: 'supportive',
                encouragement: 'Nie martw się, każdy ma gorsze dni.',
                motivation: 'Jutro będzie lepiej!'
            }
        });

        // Stress level patterns
        this.contextPatterns.set('high_stress', {
            patterns: [/pilne|terminy|stres|dużo/i],
            enhancements: {
                tone: 'calming',
                advice: 'Weź głęboki oddech i podziel zadania na mniejsze części.',
                support: 'Poradzisz sobie!'
            }
        });
    }

    setupPersonalizationRules() {
        // Communication style preferences
        this.personalizationRules.set('formal', {
            pronouns: ['Pan', 'Pani'],
            tone: 'professional',
            vocabulary: 'business',
            formality: 'high'
        });

        this.personalizationRules.set('casual', {
            pronouns: ['Ty'],
            tone: 'friendly',
            vocabulary: 'everyday',
            formality: 'low'
        });

        this.personalizationRules.set('motivational', {
            encouragement: 'high',
            energy: 'enthusiastic',
            achievements: 'highlighted',
            challenges: 'reframed_positively'
        });

        this.personalizationRules.set('analytical', {
            details: 'high',
            numbers: 'precise',
            explanations: 'thorough',
            context: 'technical'
        });
    }

    setupLanguageEnhancers() {
        // Polish language specific enhancements
        this.languageEnhancers.set('pluralization', {
            processor: (text, count) => this.enhancePluralization(text, count)
        });

        this.languageEnhancers.set('formality', {
            processor: (text, context) => this.adjustFormality(text, context)
        });

        this.languageEnhancers.set('flow', {
            processor: (text) => this.improveFlow(text)
        });

        this.languageEnhancers.set('clarity', {
            processor: (text) => this.improveClarity(text)
        });
    }

    async applyContextEnhancements(response, context) {
        const hour = new Date().getHours();
        const timeContext = this.getTimeContext(hour);
        const productivityContext = this.getProductivityContext(context);
        const stressContext = this.getStressContext(context);

        let enhancedText = response.text;

        // Apply time-based enhancements
        if (timeContext) {
            const pattern = this.contextPatterns.get(timeContext);
            if (pattern) {
                enhancedText = this.applyPatternEnhancements(enhancedText, pattern.enhancements);
            }
        }

        // Apply productivity context
        if (productivityContext) {
            const pattern = this.contextPatterns.get(productivityContext);
            if (pattern) {
                enhancedText = this.applyPatternEnhancements(enhancedText, pattern.enhancements);
            }
        }

        // Apply stress context
        if (stressContext) {
            const pattern = this.contextPatterns.get(stressContext);
            if (pattern) {
                enhancedText = this.applyPatternEnhancements(enhancedText, pattern.enhancements);
            }
        }

        return {
            ...response,
            text: enhancedText,
            contextApplied: {
                time: timeContext,
                productivity: productivityContext,
                stress: stressContext
            }
        };
    }

    async applyPersonalization(response, context) {
        const userPreferences = context.userPreferences || {};
        const communicationStyle = userPreferences.communicationStyle || 'casual';
        const preferredName = userPreferences.preferredName || '';

        let personalizedText = response.text;

        // Apply communication style
        const styleRules = this.personalizationRules.get(communicationStyle);
        if (styleRules) {
            personalizedText = this.applyStyleRules(personalizedText, styleRules);
        }

        // Insert preferred name
        if (preferredName) {
            personalizedText = this.insertPersonalName(personalizedText, preferredName);
        }

        // Apply user history context
        personalizedText = await this.applyHistoryContext(personalizedText, context);

        return {
            ...response,
            text: personalizedText,
            personalizationApplied: {
                style: communicationStyle,
                name: preferredName,
                historyContext: true
            }
        };
    }

    async applyEmotionalIntelligence(response, context) {
        const emotionalContext = await this.emotionalIntelligence.analyze(context);
        let emotionallyEnhancedText = response.text;

        // Adjust tone based on emotional context
        switch (emotionalContext.primaryEmotion) {
            case 'stress':
                emotionallyEnhancedText = this.addCalmingElements(emotionallyEnhancedText);
                break;
            case 'excitement':
                emotionallyEnhancedText = this.addEnthusiasm(emotionallyEnhancedText);
                break;
            case 'frustration':
                emotionallyEnhancedText = this.addEmpathy(emotionallyEnhancedText);
                break;
            case 'achievement':
                emotionallyEnhancedText = this.addCelebration(emotionallyEnhancedText);
                break;
            default:
                emotionallyEnhancedText = this.addPositiveReinforcement(emotionallyEnhancedText);
        }

        return {
            ...response,
            text: emotionallyEnhancedText,
            emotionalContext: emotionalContext
        };
    }

    async applyLanguagePolishing(response, context) {
        let polishedText = response.text;

        // Apply each language enhancer
        for (const [name, enhancer] of this.languageEnhancers) {
            try {
                polishedText = await enhancer.processor(polishedText, context);
            } catch (error) {
                console.warn(`Language enhancer ${name} failed:`, error);
            }
        }

        // Final polish pass
        polishedText = this.finalPolish(polishedText);

        return {
            ...response,
            text: polishedText
        };
    }

    async generateFollowUpSuggestions(response, context) {
        const suggestions = [];
        const responseType = context.responseType || 'general';
        const userBehavior = context.userBehavior || {};

        // Context-based suggestions
        const contextSuggestions = this.getContextualSuggestions(responseType, context);
        suggestions.push(...contextSuggestions);

        // Behavioral suggestions based on user patterns
        const behavioralSuggestions = this.getBehavioralSuggestions(userBehavior, context);
        suggestions.push(...behavioralSuggestions);

        // Smart suggestions based on response content
        const contentSuggestions = this.getContentBasedSuggestions(response.text, context);
        suggestions.push(...contentSuggestions);

        // Remove duplicates and limit to top 3
        const uniqueSuggestions = [...new Set(suggestions)];
        return uniqueSuggestions.slice(0, 3);
    }

    // Helper methods for context enhancement
    getTimeContext(hour) {
        if (hour >= 5 && hour < 12) return 'time_morning';
        if (hour >= 12 && hour < 18) return 'time_afternoon';
        if (hour >= 18 && hour < 22) return 'time_evening';
        return null;
    }

    getProductivityContext(context) {
        const efficiency = context.efficiency || 0;
        const tasksCompleted = context.tasksCompleted || 0;
        const streak = context.streak || 0;

        if (efficiency > 80 || tasksCompleted > 5 || streak > 3) {
            return 'high_productivity';
        }
        if (efficiency < 30 || tasksCompleted === 0) {
            return 'low_productivity';
        }
        return null;
    }

    getStressContext(context) {
        const urgentTasks = context.urgentTasks || 0;
        const overdueTasks = context.overdueTasks || 0;
        const meetingsToday = context.meetingsToday || 0;

        if (urgentTasks > 3 || overdueTasks > 0 || meetingsToday > 5) {
            return 'high_stress';
        }
        return null;
    }

    applyPatternEnhancements(text, enhancements) {
        let enhanced = text;

        // Apply greeting enhancement
        if (enhancements.greeting && !enhanced.includes('Dzień dobry') && !enhanced.includes('Witaj')) {
            enhanced = enhancements.greeting + '! ' + enhanced;
        }

        // Apply motivation boost
        if (enhancements.motivation) {
            enhanced += ' ' + enhancements.motivation;
        }

        // Apply energy adjustment
        if (enhancements.energy) {
            enhanced = enhanced.replace(/energia|siła|moc/gi, enhancements.energy);
        }

        return enhanced;
    }

    applyStyleRules(text, styleRules) {
        let styled = text;

        // Adjust formality
        if (styleRules.formality === 'high') {
            styled = styled.replace(/\bty\b/gi, 'Pan/Pani');
            styled = styled.replace(/masz/gi, 'ma Pan/Pani');
            styled = styled.replace(/jesteś/gi, 'jest Pan/Pani');
        }

        // Adjust tone
        if (styleRules.tone === 'enthusiastic') {
            styled = this.addEnthusiasm(styled);
        } else if (styleRules.tone === 'professional') {
            styled = this.makeProfessional(styled);
        }

        return styled;
    }

    insertPersonalName(text, name) {
        // Smart name insertion at natural points
        const nameInsertionPoints = [
            /^(Dzień dobry|Witaj|Dobry wieczór)/i,
            /(Gratulacje|Świetnie|Doskonale)/i,
            /(Masz|Posiadasz)/i
        ];

        for (const pattern of nameInsertionPoints) {
            if (pattern.test(text)) {
                text = text.replace(pattern, (match) => `${match}, ${name}`);
                break;
            }
        }

        return text;
    }

    async applyHistoryContext(text, context) {
        const userHistory = context.userHistory || {};
        
        // Reference past achievements
        if (userHistory.recentAchievements?.length > 0) {
            const achievement = userHistory.recentAchievements[0];
            text += ` Pamiętam, że niedawno ukończyłeś "${achievement}".`;
        }

        // Reference patterns
        if (userHistory.preferredTimeOfDay) {
            const timePreference = userHistory.preferredTimeOfDay;
            if (timePreference === 'morning' && new Date().getHours() < 12) {
                text += ' Jak zwykle, zaczynasz dzień wcześnie!';
            }
        }

        return text;
    }

    // Emotional enhancement methods
    addCalmingElements(text) {
        const calmingPhrases = [
            'Spokojnie,',
            'Weź głęboki oddech.',
            'Krok po kroku.',
            'Wszystko się ułoży.'
        ];
        
        const phrase = calmingPhrases[Math.floor(Math.random() * calmingPhrases.length)];
        return phrase + ' ' + text;
    }

    addEnthusiasm(text) {
        // Add exclamation marks and enthusiastic words
        text = text.replace(/\./g, '!');
        text = text.replace(/dobrze/gi, 'świetnie');
        text = text.replace(/ok/gi, 'fantastycznie');
        return text;
    }

    addEmpathy(text) {
        const empathyStarters = [
            'Rozumiem, że to może być frustrujące.',
            'Wiem, jak się czujesz.',
            'To naturalne, że się zirytowałeś.'
        ];
        
        const starter = empathyStarters[Math.floor(Math.random() * empathyStarters.length)];
        return starter + ' ' + text;
    }

    addCelebration(text) {
        const celebrations = [
            'Brawo!',
            'Wspaniale!',
            'Gratulacje!',
            'Fantastyczny wynik!'
        ];
        
        const celebration = celebrations[Math.floor(Math.random() * celebrations.length)];
        return celebration + ' ' + text;
    }

    addPositiveReinforcement(text) {
        const reinforcements = [
            'Świetnie sobie radzisz.',
            'Jesteś na dobrej drodze.',
            'Trzymaj tempo!'
        ];
        
        const reinforcement = reinforcements[Math.floor(Math.random() * reinforcements.length)];
        return text + ' ' + reinforcement;
    }

    makeProfessional(text) {
        // Replace casual terms with professional ones
        const replacements = {
            'super': 'doskonale',
            'git': 'bardzo dobrze',
            'spoko': 'w porządku',
            'mega': 'bardzo'
        };

        for (const [casual, professional] of Object.entries(replacements)) {
            text = text.replace(new RegExp(casual, 'gi'), professional);
        }

        return text;
    }

    // Language enhancement methods
    enhancePluralization(text, context) {
        // Improve Polish pluralization
        const pluralRules = [
            {
                pattern: /(\d+)\s+zadanie([^s])/g,
                replacement: (match, num, suffix) => {
                    const n = parseInt(num);
                    if (n === 1) return `${num} zadanie${suffix}`;
                    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
                        return `${num} zadania${suffix}`;
                    }
                    return `${num} zadań${suffix}`;
                }
            },
            {
                pattern: /(\d+)\s+spotkanie([^s])/g,
                replacement: (match, num, suffix) => {
                    const n = parseInt(num);
                    if (n === 1) return `${num} spotkanie${suffix}`;
                    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
                        return `${num} spotkania${suffix}`;
                    }
                    return `${num} spotkań${suffix}`;
                }
            }
        ];

        for (const rule of pluralRules) {
            text = text.replace(rule.pattern, rule.replacement);
        }

        return text;
    }

    adjustFormality(text, context) {
        const formalityLevel = context.userPreferences?.formalityLevel || 'medium';

        if (formalityLevel === 'high') {
            // Use more formal constructions
            text = text.replace(/masz/gi, 'posiada Pan/Pani');
            text = text.replace(/zrób/gi, 'proszę wykonać');
            text = text.replace(/zobacz/gi, 'proszę sprawdzić');
        } else if (formalityLevel === 'low') {
            // Use more casual constructions
            text = text.replace(/proszę/gi, '');
            text = text.replace(/może Pan\/Pani/gi, 'możesz');
        }

        return text;
    }

    improveFlow(text) {
        // Add connecting words for better flow
        const improvements = [
            {
                pattern: /\.\s+([A-ZĄĆĘŁŃÓŚŹŻ])/g,
                replacement: '. Dodatkowo, $1'
            },
            {
                pattern: /\!\s+([A-ZĄĆĘŁŃÓŚŹŻ])/g,
                replacement: '! Również $1'
            }
        ];

        for (const improvement of improvements) {
            text = text.replace(improvement.pattern, improvement.replacement);
        }

        // Avoid repetitive sentence starts
        text = this.avoidRepetitiveStarts(text);

        return text;
    }

    improveClarity(text) {
        // Split overly long sentences
        const maxSentenceLength = 150;
        const sentences = text.split(/[.!?]+/);
        
        const improvedSentences = sentences.map(sentence => {
            if (sentence.length > maxSentenceLength) {
                return this.splitLongSentence(sentence);
            }
            return sentence;
        });

        return improvedSentences.join('. ').replace(/\.\s*\./g, '.');
    }

    finalPolish(text) {
        // Remove double spaces
        text = text.replace(/\s+/g, ' ');
        
        // Fix punctuation spacing
        text = text.replace(/\s+([,.!?])/g, '$1');
        text = text.replace(/([.!?])\s*([A-ZĄĆĘŁŃÓŚŹŻ])/g, '$1 $2');
        
        // Ensure proper capitalization after punctuation
        text = text.replace(/([.!?])\s+([a-ząćęłńóśźż])/g, (match, punct, letter) => {
            return punct + ' ' + letter.toUpperCase();
        });

        // Trim whitespace
        text = text.trim();

        return text;
    }

    // Follow-up suggestion generators
    getContextualSuggestions(responseType, context) {
        const suggestions = {
            TASK: [
                'Pokaż szczegóły zadania',
                'Ustaw przypomnienie',
                'Sprawdź deadline'
            ],
            CLIENT: [
                'Zobacz historię kontaktów',
                'Zaplanuj spotkanie',
                'Sprawdź oferty'
            ],
            CALENDAR: [
                'Przygotuj agendę',
                'Sprawdź lokalizację',
                'Wyślij przypomnienie'
            ],
            GOAL: [
                'Zobacz postęp szczegółowy',
                'Ustaw nowy cel',
                'Sprawdź kamienie milowe'
            ]
        };

        return suggestions[responseType] || ['Sprawdź szczegóły', 'Zobacz więcej', 'Przejdź dalej'];
    }

    getBehavioralSuggestions(userBehavior, context) {
        const suggestions = [];

        // Based on user's typical actions
        if (userBehavior.frequentlyChecksCalendar) {
            suggestions.push('Zobacz kalendarz');
        }

        if (userBehavior.likesDetailedInfo) {
            suggestions.push('Pokaż szczegóły');
        }

        if (userBehavior.setsReminders) {
            suggestions.push('Ustaw przypomnienie');
        }

        return suggestions;
    }

    getContentBasedSuggestions(text, context) {
        const suggestions = [];

        // Analyze content for relevant suggestions
        if (text.includes('zadań') || text.includes('zadanie')) {
            suggestions.push('Sprawdź wszystkie zadania');
        }

        if (text.includes('spotkań') || text.includes('spotkanie')) {
            suggestions.push('Zobacz kalendarz');
        }

        if (text.includes('%') || text.includes('postęp')) {
            suggestions.push('Sprawdź szczegółowy postęp');
        }

        if (text.includes('deadline') || text.includes('termin')) {
            suggestions.push('Zobacz wszystkie terminy');
        }

        return suggestions;
    }

    // Utility methods
    avoidRepetitiveStarts(text) {
        const sentences = text.split(/([.!?]+)/);
        const startWords = [];
        
        for (let i = 0; i < sentences.length; i += 2) {
            if (sentences[i]) {
                const firstWord = sentences[i].trim().split(' ')[0];
                startWords.push(firstWord);
            }
        }

        // If we have repetitive starts, vary them
        const alternatives = {
            'Masz': ['Posiadasz', 'Do Twojej dyspozycji', 'W Twoim kalendarzu'],
            'Twoja': ['Obecna', 'Aktualna', 'Bieżąca'],
            'Jest': ['Znajduje się', 'Wynosi', 'Określone jest']
        };

        // Apply alternatives if repetition detected
        for (let i = 0; i < sentences.length; i += 2) {
            if (sentences[i]) {
                const firstWord = sentences[i].trim().split(' ')[0];
                if (alternatives[firstWord] && startWords.filter(w => w === firstWord).length > 1) {
                    const alternative = alternatives[firstWord][Math.floor(Math.random() * alternatives[firstWord].length)];
                    sentences[i] = sentences[i].replace(firstWord, alternative);
                }
            }
        }

        return sentences.join('');
    }

    splitLongSentence(sentence) {
        // Find natural break points
        const breakPoints = [', ale ', ', jednak ', ', ponadto ', ', dodatkowo '];
        
        for (const breakPoint of breakPoints) {
            if (sentence.includes(breakPoint)) {
                const parts = sentence.split(breakPoint);
                return parts[0] + '. ' + parts.slice(1).join(breakPoint);
            }
        }

        // If no natural break point, split at a comma
        const commaIndex = sentence.indexOf(',', sentence.length / 2);
        if (commaIndex !== -1) {
            return sentence.substring(0, commaIndex) + '. ' + sentence.substring(commaIndex + 1);
        }

        return sentence;
    }
}

// Emotional Intelligence Component
class EmotionalIntelligence {
    constructor() {
        this.emotionDetectors = new Map();
        this.setupEmotionDetectors();
    }

    setupEmotionDetectors() {
        this.emotionDetectors.set('stress', {
            indicators: ['urgentTasks', 'overdueTasks', 'meetingsToday', 'timeLeft'],
            threshold: 3,
            keywords: ['pilne', 'termin', 'deadline', 'stres', 'presja']
        });

        this.emotionDetectors.set('excitement', {
            indicators: ['tasksCompleted', 'goalsAchieved', 'streak'],
            threshold: 2,
            keywords: ['ukończone', 'osiągnięcie', 'sukces', 'cel']
        });

        this.emotionDetectors.set('frustration', {
            indicators: ['failedTasks', 'missedDeadlines', 'conflicts'],
            threshold: 1,
            keywords: ['problem', 'błąd', 'nie udało', 'frustracja']
        });

        this.emotionDetectors.set('achievement', {
            indicators: ['completionRate', 'newRecords', 'milestones'],
            threshold: 1,
            keywords: ['gratulacje', 'brawo', 'świetnie', 'doskonale']
        });
    }

    async analyze(context) {
        const emotions = {};
        let primaryEmotion = 'neutral';
        let highestScore = 0;

        for (const [emotion, detector] of this.emotionDetectors) {
            const score = this.calculateEmotionScore(context, detector);
            emotions[emotion] = score;

            if (score > highestScore) {
                highestScore = score;
                primaryEmotion = emotion;
            }
        }

        return {
            primaryEmotion,
            emotionScores: emotions,
            confidence: Math.min(highestScore / 5, 1), // Normalize to 0-1
            recommendations: this.getEmotionalRecommendations(primaryEmotion)
        };
    }

    calculateEmotionScore(context, detector) {
        let score = 0;

        // Check numeric indicators
        for (const indicator of detector.indicators) {
            const value = context[indicator] || 0;
            if (value > 0) {
                score += Math.min(value / detector.threshold, 2);
            }
        }

        // Check keyword presence in recent interactions
        const recentText = context.recentInteractions?.join(' ') || '';
        for (const keyword of detector.keywords) {
            if (recentText.toLowerCase().includes(keyword)) {
                score += 1;
            }
        }

        return score;
    }

    getEmotionalRecommendations(emotion) {
        const recommendations = {
            stress: {
                tone: 'calming',
                pace: 'slower',
                focus: 'prioritization',
                suggestions: ['Weź głęboki oddech', 'Podziel zadania na mniejsze części']
            },
            excitement: {
                tone: 'enthusiastic',
                pace: 'energetic',
                focus: 'celebration',
                suggestions: ['Świętuj sukces', 'Ustaw nowy cel']
            },
            frustration: {
                tone: 'empathetic',
                pace: 'patient',
                focus: 'problem_solving',
                suggestions: ['To zrozumiałe', 'Spróbuj innego podejścia']
            },
            achievement: {
                tone: 'celebratory',
                pace: 'upbeat',
                focus: 'recognition',
                suggestions: ['Gratulacje!', 'Czas na nowe wyzwanie']
            },
            neutral: {
                tone: 'balanced',
                pace: 'normal',
                focus: 'information',
                suggestions: ['Co chcesz sprawdzić?', 'Jak mogę pomóc?']
            }
        };

        return recommendations[emotion] || recommendations.neutral;
    }
}

// Context Manager for maintaining conversation state
class ContextManager {
    constructor() {
        this.conversationHistory = [];
        this.userPreferences = new Map();
        this.sessionContext = new Map();
        this.maxHistoryLength = 50;
    }

    async initialize() {
        // Load persistent context from storage
        try {
            const saved = localStorage.getItem('voiceContextManager');
            if (saved) {
                const data = JSON.parse(saved);
                this.userPreferences = new Map(data.userPreferences || []);
            }
        } catch (error) {
            console.warn('Failed to load context manager state:', error);
        }
    }

    async updateContext(context, data) {
        // Add current interaction to history
        this.conversationHistory.push({
            timestamp: Date.now(),
            context: { ...context },
            data: { ...data }
        });

        // Limit history size
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }

        // Update session context
        this.sessionContext.set('lastInteraction', Date.now());
        this.sessionContext.set('interactionCount', (this.sessionContext.get('interactionCount') || 0) + 1);

        // Enrich context with historical data
        const enrichedContext = {
            ...context,
            conversationHistory: this.conversationHistory.slice(-5), // Last 5 interactions
            sessionLength: this.getSessionLength(),
            userBehavior: this.analyzeUserBehavior(),
            userPreferences: Object.fromEntries(this.userPreferences)
        };

        // Save state
        this.saveState();

        return enrichedContext;
    }

    analyzeUserBehavior() {
        const behavior = {
            totalInteractions: this.conversationHistory.length,
            averageSessionLength: this.getAverageSessionLength(),
            frequentQueries: this.getFrequentQueries(),
            preferredTimeOfDay: this.getPreferredTimeOfDay(),
            responsivenessPeriod: this.getResponsivenessPeriod()
        };

        // Behavioral patterns
        behavior.frequentlyChecksCalendar = this.checkPattern('calendar', 0.3);
        behavior.likesDetailedInfo = this.checkPattern('details', 0.4);
        behavior.setsReminders = this.checkPattern('reminder', 0.2);
        behavior.motivationSeeking = this.checkPattern('motivation', 0.3);

        return behavior;
    }

    getSessionLength() {
        const firstInteraction = this.sessionContext.get('sessionStart') || Date.now();
        return Date.now() - firstInteraction;
    }

    getAverageSessionLength() {
        // Calculate based on historical sessions
        return 5 * 60 * 1000; // Default 5 minutes
    }

    getFrequentQueries() {
        const queryTypes = this.conversationHistory
            .map(h => h.context.responseType)
            .filter(Boolean);
        
        const frequency = {};
        queryTypes.forEach(type => {
            frequency[type] = (frequency[type] || 0) + 1;
        });

        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([type]) => type);
    }

    getPreferredTimeOfDay() {
        const hours = this.conversationHistory
            .map(h => new Date(h.timestamp).getHours());
        
        const timeSlots = { morning: 0, afternoon: 0, evening: 0 };
        hours.forEach(hour => {
            if (hour < 12) timeSlots.morning++;
            else if (hour < 18) timeSlots.afternoon++;
            else timeSlots.evening++;
        });

        return Object.entries(timeSlots)
            .sort(([,a], [,b]) => b - a)[0][0];
    }

    getResponsivenessPeriod() {
        // Calculate how quickly user typically responds to suggestions
        const responseTimes = this.conversationHistory
            .slice(1)
            .map((interaction, index) => {
                const prev = this.conversationHistory[index];
                return interaction.timestamp - prev.timestamp;
            });

        if (responseTimes.length === 0) return 'unknown';

        const averageTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        
        if (averageTime < 30000) return 'fast'; // < 30 seconds
        if (averageTime < 120000) return 'medium'; // < 2 minutes
        return 'thoughtful'; // > 2 minutes
    }

    checkPattern(pattern, threshold) {
        const total = this.conversationHistory.length;
        if (total === 0) return false;

        const patternCount = this.conversationHistory.filter(h => {
            const text = JSON.stringify(h).toLowerCase();
            return text.includes(pattern);
        }).length;

        return (patternCount / total) >= threshold;
    }

    getCurrentUserId() {
        return this.sessionContext.get('userId') || 'anonymous';
    }

    setUserPreference(key, value) {
        this.userPreferences.set(key, value);
        this.saveState();
    }

    getUserPreference(key, defaultValue = null) {
        return this.userPreferences.get(key) || defaultValue;
    }

    saveState() {
        try {
            localStorage.setItem('voiceContextManager', JSON.stringify({
                userPreferences: Array.from(this.userPreferences.entries()),
                lastSaved: Date.now()
            }));
        } catch (error) {
            console.warn('Failed to save context manager state:', error);
        }
    }

    cleanup() {
        // Clean up old conversation history
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.conversationHistory = this.conversationHistory.filter(
            h => h.timestamp > oneWeekAgo
        );
        
        this.saveState();
    }
}

// User Preferences Manager
class UserPreferences {
    constructor() {
        this.preferences = new Map();
        this.defaults = new Map([
            ['communicationStyle', 'casual'],
            ['formalityLevel', 'medium'],
            ['preferredName', ''],
            ['voiceSpeed', 'normal'],
            ['detailLevel', 'medium'],
            ['motivationLevel', 'medium'],
            ['languageVariant', 'standard']
        ]);
    }

    async load() {
        try {
            const saved = localStorage.getItem('voiceUserPreferences');
            if (saved) {
                const data = JSON.parse(saved);
                this.preferences = new Map(data.preferences || []);
            }
            
            // Apply defaults for missing preferences
            for (const [key, value] of this.defaults) {
                if (!this.preferences.has(key)) {
                    this.preferences.set(key, value);
                }
            }
        } catch (error) {
            console.error('Failed to load user preferences:', error);
            this.preferences = new Map(this.defaults);
        }
    }

    get(key) {
        return this.preferences.get(key) || this.defaults.get(key);
    }

    set(key, value) {
        this.preferences.set(key, value);
        this.save();
    }

    async updateFromFeedback(feedback) {
        // Adjust preferences based on user feedback
        if (feedback.feedbackType === 'too_formal' && feedback.rating < 3) {
            const currentFormality = this.get('formalityLevel');
            if (currentFormality === 'high') {
                this.set('formalityLevel', 'medium');
            } else if (currentFormality === 'medium') {
                this.set('formalityLevel', 'low');
            }
        }

        if (feedback.feedbackType === 'too_detailed' && feedback.rating < 3) {
            const currentDetail = this.get('detailLevel');
            if (currentDetail === 'high') {
                this.set('detailLevel', 'medium');
            } else if (currentDetail === 'medium') {
                this.set('detailLevel', 'low');
            }
        }

        if (feedback.feedbackType === 'too_fast' && feedback.rating < 3) {
            this.set('voiceSpeed', 'slow');
        }

        if (feedback.comments) {
            // Analyze comments for preference hints
            const comments = feedback.comments.toLowerCase();
            if (comments.includes('wolniej')) {
                this.set('voiceSpeed', 'slow');
            }
            if (comments.includes('krótko')) {
                this.set('detailLevel', 'low');
            }
            if (comments.includes('formal')) {
                this.set('formalityLevel', 'high');
            }
        }
    }

    save() {
        try {
            localStorage.setItem('voiceUserPreferences', JSON.stringify({
                preferences: Array.from(this.preferences.entries()),
                lastUpdated: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save user preferences:', error);
        }
    }

    export() {
        return Object.fromEntries(this.preferences);
    }

    import(preferences) {
        for (const [key, value] of Object.entries(preferences)) {
            if (this.defaults.has(key)) {
                this.preferences.set(key, value);
            }
        }
        this.save();
    }
}

// Export all classes
window.NLPProcessor = NLPProcessor;
window.EmotionalIntelligence = EmotionalIntelligence;
window.ContextManager = ContextManager;
window.UserPreferences = UserPreferences;