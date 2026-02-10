/**
 * SSML Builder for Voice Optimization
 * Converts natural language responses to optimized Speech Synthesis Markup Language
 */

class SSMLBuilder {
    constructor() {
        this.voiceSettings = new Map();
        this.pronunciationRules = new Map();
        this.emotionMappings = new Map();
        this.polishLanguageRules = new Map();
        
        this.initializeSSMLComponents();
    }

    initializeSSMLComponents() {
        this.setupVoiceSettings();
        this.setupPronunciationRules();
        this.setupEmotionMappings();
        this.setupPolishLanguageRules();
    }

    async build(response, context) {
        try {
            const { text, emotionalContext } = response;
            const userPreferences = context.userPreferences || {};
            
            // Start with base SSML structure
            let ssml = this.createBaseSSML();
            
            // Apply voice settings based on context and preferences
            ssml = this.applyVoiceSettings(ssml, context, userPreferences);
            
            // Process text content with SSML enhancements
            const processedContent = await this.processTextContent(text, context, emotionalContext);
            
            // Insert processed content
            ssml = ssml.replace('{CONTENT}', processedContent);
            
            // Apply final optimizations
            ssml = this.applyFinalOptimizations(ssml, context);
            
            return ssml;
            
        } catch (error) {
            console.error('SSML building failed:', error);
            // Fallback to plain text
            return response.text;
        }
    }

    setupVoiceSettings() {
        // Voice configuration profiles
        this.voiceSettings.set('default', {
            rate: '0.9',
            pitch: '+0%',
            volume: 'medium',
            emphasis: 'moderate'
        });

        this.voiceSettings.set('energetic', {
            rate: '1.1',
            pitch: '+5%',
            volume: 'loud',
            emphasis: 'strong'
        });

        this.voiceSettings.set('calming', {
            rate: '0.8',
            pitch: '-2%',
            volume: 'soft',
            emphasis: 'reduced'
        });

        this.voiceSettings.set('professional', {
            rate: '0.95',
            pitch: '+0%',
            volume: 'medium',
            emphasis: 'moderate'
        });

        this.voiceSettings.set('motivational', {
            rate: '1.0',
            pitch: '+3%',
            volume: 'loud',
            emphasis: 'strong'
        });
    }

    setupPronunciationRules() {
        // Polish-specific pronunciation rules
        this.pronunciationRules.set('numbers', {
            '1': 'jeden',
            '2': 'dwa',
            '3': 'trzy',
            '4': 'cztery',
            '5': 'pięć',
            '6': 'sześć',
            '7': 'siedem',
            '8': 'osiem',
            '9': 'dziewięć',
            '10': 'dziesięć',
            '11': 'jedenaście',
            '12': 'dwanaście',
            '15': 'piętnaście',
            '20': 'dwadzieścia',
            '30': 'trzydzieści',
            '50': 'pięćdziesiąt',
            '100': 'sto'
        });

        this.pronunciationRules.set('ordinals', {
            '1st': 'pierwszy',
            '2nd': 'drugi',
            '3rd': 'trzeci',
            '4th': 'czwarty',
            '5th': 'piąty'
        });

        this.pronunciationRules.set('dates', {
            'Monday': 'poniedziałek',
            'Tuesday': 'wtorek',
            'Wednesday': 'środa',
            'Thursday': 'czwartek',
            'Friday': 'piątek',
            'Saturday': 'sobota',
            'Sunday': 'niedziela'
        });

        this.pronunciationRules.set('acronyms', {
            'CRM': '<say-as interpret-as="characters">C R M</say-as>',
            'STREAMS': 'STREAMS',
            'API': '<say-as interpret-as="characters">A P I</say-as>',
            'CEO': '<say-as interpret-as="characters">C E O</say-as>',
            'IT': '<say-as interpret-as="characters">I T</say-as>',
            'KPI': '<say-as interpret-as="characters">K P I</say-as>',
            'ROI': '<say-as interpret-as="characters">R O I</say-as>',
            'URL': '<say-as interpret-as="characters">U R L</say-as>'
        });

        this.pronunciationRules.set('technical_terms', {
            'dashboard': '<phoneme alphabet="ipa" ph="ˈdæʃbɔːrd">dashboard</phoneme>',
            'workflow': '<phoneme alphabet="ipa" ph="ˈwɜːrkfloʊ">workflow</phoneme>',
            'deadline': '<phoneme alphabet="ipa" ph="ˈdɛdlaɪn">deadline</phoneme>',
            'feedback': '<phoneme alphabet="ipa" ph="ˈfiːdbæk">feedback</phoneme>'
        });

        this.pronunciationRules.set('currency', {
            'PLN': 'złoty',
            'złotych': 'złotych',
            'EUR': 'euro',
            'USD': 'dolar amerykański'
        });
    }

    setupEmotionMappings() {
        this.emotionMappings.set('excitement', {
            prosody: { rate: '+10%', pitch: '+5%', volume: '+3dB' },
            emphasis: 'strong',
            pauses: 'short',
            tone: 'upbeat'
        });

        this.emotionMappings.set('stress', {
            prosody: { rate: '-20%', pitch: '-2%', volume: '-2dB' },
            emphasis: 'reduced',
            pauses: 'long',
            tone: 'calming'
        });

        this.emotionMappings.set('achievement', {
            prosody: { rate: '+5%', pitch: '+8%', volume: '+5dB' },
            emphasis: 'strong',
            pauses: 'medium',
            tone: 'celebratory'
        });

        this.emotionMappings.set('frustration', {
            prosody: { rate: '-10%', pitch: '-1%', volume: '-1dB' },
            emphasis: 'moderate',
            pauses: 'long',
            tone: 'empathetic'
        });

        this.emotionMappings.set('neutral', {
            prosody: { rate: '0%', pitch: '0%', volume: '0dB' },
            emphasis: 'moderate',
            pauses: 'medium',
            tone: 'balanced'
        });
    }

    setupPolishLanguageRules() {
        // Polish language-specific SSML optimizations
        this.polishLanguageRules.set('stress_patterns', {
            // Polish words typically have stress on the penultimate syllable
            'zadanie': '<emphasis level="moderate">za-DA-nie</emphasis>',
            'spotkanie': '<emphasis level="moderate">spot-KA-nie</emphasis>',
            'projekt': '<emphasis level="moderate">pro-JEKT</emphasis>',
            'deadline': '<emphasis level="moderate">DEAD-line</emphasis>'
        });

        this.polishLanguageRules.set('difficult_clusters', {
            // Common Polish consonant clusters that need careful pronunciation
            'szcz': '<phoneme alphabet="ipa" ph="ʂt͡ʂ">szcz</phoneme>',
            'dźw': '<phoneme alphabet="ipa" ph="d͡ʑf">dźw</phoneme>',
            'chrz': '<phoneme alphabet="ipa" ph="xʂ">chrz</phoneme>'
        });

        this.polishLanguageRules.set('liaison_rules', {
            // Rules for natural speech flow in Polish
            'w tym': 'f tym',
            'z tym': 's tym',
            'nad tym': 'nat tym'
        });
    }

    createBaseSSML() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" 
       xmlns="http://www.w3.org/2001/10/synthesis" 
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
       xsi:schemaLocation="http://www.w3.org/2001/10/synthesis http://www.w3.org/TR/speech-synthesis/synthesis.xsd" 
       xml:lang="pl-PL">
    <voice name="pl-PL-Standard-A" gender="neutral">
        <prosody rate="{RATE}" pitch="{PITCH}" volume="{VOLUME}">
            {CONTENT}
        </prosody>
    </voice>
</speak>`;
    }

    applyVoiceSettings(ssml, context, userPreferences) {
        // Determine voice profile based on context and preferences
        const emotionalContext = context.emotionalContext || {};
        const voiceSpeed = userPreferences.voiceSpeed || 'normal';
        const primaryEmotion = emotionalContext.primaryEmotion || 'neutral';
        
        let profile = 'default';
        
        // Select profile based on emotional context
        if (primaryEmotion === 'excitement' || primaryEmotion === 'achievement') {
            profile = 'energetic';
        } else if (primaryEmotion === 'stress') {
            profile = 'calming';
        } else if (context.responseType === 'CLIENT' || context.formal) {
            profile = 'professional';
        } else if (context.responseType === 'GOAL' && emotionalContext.confidence > 0.7) {
            profile = 'motivational';
        }

        const settings = this.voiceSettings.get(profile);
        
        // Adjust rate based on user preference
        let finalRate = parseFloat(settings.rate);
        if (voiceSpeed === 'slow') finalRate *= 0.8;
        if (voiceSpeed === 'fast') finalRate *= 1.2;
        
        // Apply settings to SSML
        ssml = ssml.replace('{RATE}', finalRate.toString());
        ssml = ssml.replace('{PITCH}', settings.pitch);
        ssml = ssml.replace('{VOLUME}', settings.volume);
        
        return ssml;
    }

    async processTextContent(text, context, emotionalContext) {
        let processedText = text;
        
        // Apply processing steps in order
        processedText = this.processNumbers(processedText);
        processedText = this.processDatesAndTimes(processedText);
        processedText = this.processAcronyms(processedText);
        processedText = this.processTechnicalTerms(processedText);
        processedText = this.processCurrency(processedText);
        processedText = this.addEmphasisAndPauses(processedText, emotionalContext);
        processedText = this.optimizePolishPronunciation(processedText);
        processedText = this.addBreathingPauses(processedText);
        processedText = this.optimizeResponseLength(processedText, context);
        
        return processedText;
    }

    processNumbers(text) {
        const numberRules = this.pronunciationRules.get('numbers');
        
        // Handle cardinal numbers (1-100)
        text = text.replace(/\b(\d{1,2})\b/g, (match, num) => {
            const number = parseInt(num);
            if (numberRules[num]) {
                return `<say-as interpret-as="cardinal">${numberRules[num]}</say-as>`;
            } else if (number <= 100) {
                return `<say-as interpret-as="cardinal">${num}</say-as>`;
            }
            return match;
        });

        // Handle larger numbers
        text = text.replace(/\b(\d{3,})\b/g, (match, num) => {
            return `<say-as interpret-as="cardinal">${num}</say-as>`;
        });

        // Handle percentages
        text = text.replace(/(\d+)%/g, '<say-as interpret-as="cardinal">$1</say-as> procent');

        // Handle ordinals
        const ordinalRules = this.pronunciationRules.get('ordinals');
        for (const [ordinal, polish] of Object.entries(ordinalRules)) {
            text = text.replace(new RegExp(ordinal, 'gi'), polish);
        }

        return text;
    }

    processDatesAndTimes(text) {
        // Handle time formats (24:00, 12:30)
        text = text.replace(/(\d{1,2}):(\d{2})/g, (match, hours, minutes) => {
            const h = parseInt(hours);
            const m = parseInt(minutes);
            
            if (m === 0) {
                return `<say-as interpret-as="time" format="h">${h}</say-as>`;
            } else {
                return `<say-as interpret-as="time" format="hm">${h}:${m}</say-as>`;
            }
        });

        // Handle dates (YYYY-MM-DD)
        text = text.replace(/(\d{4})-(\d{2})-(\d{2})/g, 
            '<say-as interpret-as="date" format="ymd">$1-$2-$3</say-as>');

        // Handle day names
        const dateRules = this.pronunciationRules.get('dates');
        for (const [english, polish] of Object.entries(dateRules)) {
            text = text.replace(new RegExp(english, 'gi'), polish);
        }

        return text;
    }

    processAcronyms(text) {
        const acronymRules = this.pronunciationRules.get('acronyms');
        
        for (const [acronym, ssml] of Object.entries(acronymRules)) {
            text = text.replace(new RegExp(`\\b${acronym}\\b`, 'gi'), ssml);
        }

        return text;
    }

    processTechnicalTerms(text) {
        const technicalRules = this.pronunciationRules.get('technical_terms');
        
        for (const [term, ssml] of Object.entries(technicalRules)) {
            text = text.replace(new RegExp(`\\b${term}\\b`, 'gi'), ssml);
        }

        return text;
    }

    processCurrency(text) {
        const currencyRules = this.pronunciationRules.get('currency');
        
        // Handle currency amounts
        text = text.replace(/(\d+)\s*(PLN|zł)/gi, (match, amount, currency) => {
            const num = parseInt(amount);
            const unit = currencyRules['PLN'];
            
            if (num === 1) {
                return `<say-as interpret-as="cardinal">${num}</say-as> ${unit}`;
            } else if (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)) {
                return `<say-as interpret-as="cardinal">${num}</say-as> złote`;
            } else {
                return `<say-as interpret-as="cardinal">${num}</say-as> złotych`;
            }
        });

        // Handle other currencies
        for (const [symbol, name] of Object.entries(currencyRules)) {
            if (symbol !== 'PLN' && symbol !== 'złotych') {
                text = text.replace(new RegExp(`\\b${symbol}\\b`, 'gi'), name);
            }
        }

        return text;
    }

    addEmphasisAndPauses(text, emotionalContext) {
        const emotion = emotionalContext?.primaryEmotion || 'neutral';
        const emotionSettings = this.emotionMappings.get(emotion);
        
        if (!emotionSettings) return text;

        // Add emphasis to important words based on emotion
        const emphasisPatterns = {
            excitement: ['świetnie', 'fantastycznie', 'doskonale', 'brawo'],
            achievement: ['gratulacje', 'sukces', 'osiągnięcie', 'cel'],
            stress: ['spokojnie', 'pomoc', 'rozwiązanie', 'krok po kroku'],
            frustration: ['rozumiem', 'pomogę', 'spróbujmy', 'inaczej']
        };

        const patterns = emphasisPatterns[emotion] || [];
        
        for (const pattern of patterns) {
            const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
            text = text.replace(regex, `<emphasis level="${emotionSettings.emphasis}">$1</emphasis>`);
        }

        // Add pauses based on emotion
        if (emotion === 'stress' || emotion === 'frustration') {
            // Add longer pauses for calming effect
            text = text.replace(/\./g, '.<break time="800ms"/>');
            text = text.replace(/,/g, ',<break time="400ms"/>');
        } else if (emotion === 'excitement' || emotion === 'achievement') {
            // Add shorter, energetic pauses
            text = text.replace(/!/g, '!<break time="300ms"/>');
        } else {
            // Standard pauses
            text = text.replace(/\./g, '.<break time="500ms"/>');
            text = text.replace(/,/g, ',<break time="200ms"/>');
        }

        return text;
    }

    optimizePolishPronunciation(text) {
        // Apply Polish-specific pronunciation rules
        const stressPatterns = this.polishLanguageRules.get('stress_patterns');
        for (const [word, ssml] of Object.entries(stressPatterns)) {
            text = text.replace(new RegExp(`\\b${word}\\b`, 'gi'), ssml);
        }

        // Handle difficult consonant clusters
        const clusters = this.polishLanguageRules.get('difficult_clusters');
        for (const [cluster, ssml] of Object.entries(clusters)) {
            text = text.replace(new RegExp(cluster, 'gi'), ssml);
        }

        // Apply liaison rules for natural flow
        const liaisonRules = this.polishLanguageRules.get('liaison_rules');
        for (const [original, modified] of Object.entries(liaisonRules)) {
            text = text.replace(new RegExp(original, 'gi'), modified);
        }

        return text;
    }

    addBreathingPauses(text) {
        // Add natural breathing pauses for longer responses
        const sentences = text.split(/[.!?]+/);
        
        if (sentences.length > 3) {
            // Add breathing pause after every 2-3 sentences
            let result = '';
            sentences.forEach((sentence, index) => {
                result += sentence;
                if (index < sentences.length - 1) {
                    if ((index + 1) % 2 === 0) {
                        result += '.<break time="1s"/>';
                    } else {
                        result += '.';
                    }
                }
            });
            text = result;
        }

        return text;
    }

    optimizeResponseLength(text, context) {
        const maxDuration = context.maxResponseDuration || 60; // seconds
        const averageWordsPerSecond = 3; // Polish speech rate
        const maxWords = maxDuration * averageWordsPerSecond;
        
        const words = text.split(/\s+/);
        
        if (words.length > maxWords) {
            // Truncate and add indication of more content
            const truncated = words.slice(0, maxWords - 10).join(' ');
            return truncated + '... <break time="500ms"/> i więcej szczegółów dostępnych na żądanie.';
        }
        
        return text;
    }

    applyFinalOptimizations(ssml, context) {
        // Remove any double spaces or breaks
        ssml = ssml.replace(/\s+/g, ' ');
        ssml = ssml.replace(/<break[^>]*><break[^>]*>/g, '<break time="800ms"/>');
        
        // Ensure proper SSML structure
        ssml = this.validateSSMLStructure(ssml);
        
        // Add response metadata
        ssml = this.addResponseMetadata(ssml, context);
        
        return ssml;
    }

    validateSSMLStructure(ssml) {
        // Basic SSML validation and fixes
        const fixes = [
            // Fix unclosed tags
            { pattern: /<emphasis[^>]*>([^<]*?)(?!<\/emphasis>)/g, replacement: '<emphasis level="moderate">$1</emphasis>' },
            { pattern: /<say-as[^>]*>([^<]*?)(?!<\/say-as>)/g, replacement: '<say-as interpret-as="cardinal">$1</say-as>' },
            
            // Remove invalid characters
            { pattern: /[^\w\s\p{L}<>/=":;.,!?()-]/gu, replacement: '' },
            
            // Fix break times
            { pattern: /<break time="(\d+)ms?"\/>/g, replacement: '<break time="$1ms"/>' }
        ];

        for (const fix of fixes) {
            ssml = ssml.replace(fix.pattern, fix.replacement);
        }

        return ssml;
    }

    addResponseMetadata(ssml, context) {
        // Add metadata as SSML comments for debugging and analytics
        const metadata = {
            responseType: context.responseType,
            emotion: context.emotionalContext?.primaryEmotion,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const metadataComment = `<!-- Response Metadata: ${JSON.stringify(metadata)} -->`;
        return ssml.replace('<speak', `${metadataComment}\n<speak`);
    }

    // Public utility methods for manual SSML creation
    createEmphasis(text, level = 'moderate') {
        return `<emphasis level="${level}">${text}</emphasis>`;
    }

    createPause(duration = '500ms') {
        return `<break time="${duration}"/>`;
    }

    createProsody(text, rate = '0%', pitch = '0%', volume = '0dB') {
        return `<prosody rate="${rate}" pitch="${pitch}" volume="${volume}">${text}</prosody>`;
    }

    createSayAs(text, interpretAs = 'cardinal', format = null) {
        const formatAttr = format ? ` format="${format}"` : '';
        return `<say-as interpret-as="${interpretAs}"${formatAttr}>${text}</say-as>`;
    }

    createPhoneme(text, alphabet = 'ipa', ph) {
        return `<phoneme alphabet="${alphabet}" ph="${ph}">${text}</phoneme>`;
    }

    // SSML testing and validation
    async testSSML(ssml) {
        try {
            // Basic validation
            const parser = new DOMParser();
            const doc = parser.parseFromString(ssml, 'application/xml');
            
            if (doc.querySelector('parsererror')) {
                throw new Error('Invalid SSML structure');
            }

            // Check for required elements
            if (!doc.querySelector('speak')) {
                throw new Error('Missing speak element');
            }

            // Estimate speech duration
            const estimatedDuration = this.estimateSpeechDuration(ssml);
            
            return {
                valid: true,
                estimatedDuration,
                warnings: this.getSSMLWarnings(doc)
            };
            
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                estimatedDuration: 0,
                warnings: []
            };
        }
    }

    estimateSpeechDuration(ssml) {
        // Extract text content and calculate approximate duration
        const textContent = ssml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const words = textContent.split(' ').length;
        const wordsPerSecond = 3; // Average for Polish
        
        // Add time for breaks
        const breaks = (ssml.match(/<break[^>]*>/g) || []).length;
        const averageBreakTime = 0.5; // seconds
        
        return (words / wordsPerSecond) + (breaks * averageBreakTime);
    }

    getSSMLWarnings(doc) {
        const warnings = [];
        
        // Check for potentially problematic patterns
        if (doc.querySelector('emphasis emphasis')) {
            warnings.push('Nested emphasis tags detected');
        }
        
        if (doc.querySelector('prosody prosody')) {
            warnings.push('Nested prosody tags detected');
        }
        
        const breaks = doc.querySelectorAll('break');
        const longBreaks = Array.from(breaks).filter(br => {
            const time = br.getAttribute('time');
            return time && parseInt(time) > 2000;
        });
        
        if (longBreaks.length > 0) {
            warnings.push('Very long breaks detected (>2s)');
        }
        
        return warnings;
    }

    // Export settings for external configuration
    exportSettings() {
        return {
            voiceSettings: Object.fromEntries(this.voiceSettings),
            pronunciationRules: Object.fromEntries(this.pronunciationRules),
            emotionMappings: Object.fromEntries(this.emotionMappings),
            polishLanguageRules: Object.fromEntries(this.polishLanguageRules)
        };
    }

    // Import custom settings
    importSettings(settings) {
        if (settings.voiceSettings) {
            this.voiceSettings = new Map(Object.entries(settings.voiceSettings));
        }
        if (settings.pronunciationRules) {
            this.pronunciationRules = new Map(Object.entries(settings.pronunciationRules));
        }
        if (settings.emotionMappings) {
            this.emotionMappings = new Map(Object.entries(settings.emotionMappings));
        }
        if (settings.polishLanguageRules) {
            this.polishLanguageRules = new Map(Object.entries(settings.polishLanguageRules));
        }
    }
}

// Export for use in voice response engine
window.SSMLBuilder = SSMLBuilder;