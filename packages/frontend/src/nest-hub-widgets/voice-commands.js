/**
 * Voice Commands Integration for Google Nest Hub
 * Handles speech recognition and Google Assistant integration
 */

class VoiceCommands {
    constructor(apiClient, dashboard) {
        this.apiClient = apiClient;
        this.dashboard = dashboard;
        this.isListening = false;
        this.recognition = null;
        this.voiceModal = document.getElementById('voice-modal');
        this.voiceFeedback = document.getElementById('voice-feedback');
        this.cancelButton = document.getElementById('voice-cancel');
        
        this.initializeSpeechRecognition();
        this.setupEventListeners();
        this.setupVoiceCommands();
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'pl-PL';
            this.recognition.maxAlternatives = 3;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.voiceFeedback.textContent = 'Słucham... Powiedz komendę';
            };

            this.recognition.onresult = (event) => {
                const results = event.results;
                const lastResult = results[results.length - 1];
                
                if (lastResult.isFinal) {
                    const transcript = lastResult[0].transcript.toLowerCase().trim();
                    this.voiceFeedback.textContent = `Rozpoznano: "${transcript}"`;
                    this.processVoiceCommand(transcript);
                } else {
                    // Show interim results
                    const interim = lastResult[0].transcript;
                    this.voiceFeedback.textContent = `Słyszę: ${interim}...`;
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.voiceFeedback.textContent = `Błąd rozpoznawania: ${event.error}`;
                setTimeout(() => this.stopListening(), 2000);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (this.voiceModal.classList.contains('active')) {
                    setTimeout(() => this.stopListening(), 1000);
                }
            };
        } else {
            console.warn('Speech Recognition not supported in this browser');
        }
    }

    setupEventListeners() {
        // Voice buttons in widgets
        document.querySelectorAll('.voice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const voiceType = btn.getAttribute('data-voice');
                this.startListening(voiceType);
            });
        });

        // Cancel button
        this.cancelButton?.addEventListener('click', () => {
            this.stopListening();
        });

        // Close modal on outside click
        this.voiceModal?.addEventListener('click', (e) => {
            if (e.target === this.voiceModal) {
                this.stopListening();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isListening) {
                this.stopListening();
            }
            
            // Global voice activation (Ctrl + Space)
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                this.startListening('global');
            }
        });
    }

    setupVoiceCommands() {
        this.commands = {
            // Navigation commands
            'pokaż dashboard': () => this.dashboard.showOverview(),
            'otwórz priorytety': () => this.dashboard.focusWidget('priorities'),
            'pokaż sprzedaż': () => this.dashboard.focusWidget('crm'),
            'otwórz kalendarz': () => this.dashboard.focusWidget('calendar'),
            'pokaż cele': () => this.dashboard.focusWidget('goals'),
            'pokaż aktywności': () => this.dashboard.focusWidget('activities'),
            'otwórz powiadomienia': () => this.dashboard.focusWidget('notifications'),

            // Task management commands
            'odśwież dane': () => this.dashboard.refreshAllData(),
            'ukończ pierwsze zadanie': () => this.completeFirstTask(),
            'ukończ zadanie': () => this.completeTaskByVoice(),
            'pokaż inbox': () => this.showInboxStatus(),
            'przetworz inbox': () => this.processInboxItems(),

            // CRM commands
            'pokaż pipeline': () => this.showPipelineStatus(),
            'pokaż konwersje': () => this.showConversionRates(),
            'jakie są wyniki sprzedaży': () => this.announceSalesMetrics(),
            'ile mam spotkań dzisiaj': () => this.announceTodayMeetings(),

            // Information queries
            'ile mam zadań': () => this.announceTaskCount(),
            'jakie są priorytety': () => this.announcePriorities(),
            'co dzisiaj': () => this.announceTodaysSchedule(),
            'jaki jest postęp': () => this.announceProgress(),

            // System commands
            'tryb offline': () => this.toggleOfflineMode(),
            'wyczyść cache': () => this.clearCache(),
            'pomoc': () => this.showHelp(),
            'wyjdź': () => this.stopListening(),
            'anuluj': () => this.stopListening()
        };

        // Fuzzy matching patterns for better recognition
        this.patterns = [
            { pattern: /ukończ|wykonaj|zrób|skończ.*zadanie/i, action: 'completeTask' },
            { pattern: /pokaż|otwórz|wyświetl.*priorytety/i, action: 'showPriorities' },
            { pattern: /pokaż|otwórz|wyświetl.*sprzedaż|crm|pipeline/i, action: 'showCRM' },
            { pattern: /pokaż|otwórz|wyświetl.*kalendarz|spotkania/i, action: 'showCalendar' },
            { pattern: /ile.*zadań|zadania|tasks/i, action: 'announceTaskCount' },
            { pattern: /odśwież|refresh|reload/i, action: 'refreshData' },
            { pattern: /pomoc|help|co mogę powiedzieć/i, action: 'showHelp' }
        ];
    }

    startListening(context = 'global') {
        if (!this.recognition) {
            this.showToast('Rozpoznawanie mowy nie jest dostępne', 'error');
            return;
        }

        this.currentContext = context;
        this.voiceModal.classList.add('active');
        this.voiceFeedback.textContent = 'Inicjalizacja mikrofonu...';
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.voiceFeedback.textContent = 'Błąd uruchamiania mikrofonu';
            setTimeout(() => this.stopListening(), 2000);
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        
        this.isListening = false;
        this.voiceModal.classList.remove('active');
        this.currentContext = null;
    }

    processVoiceCommand(transcript) {
        console.log('Processing voice command:', transcript);
        
        // Direct command match
        const directCommand = this.commands[transcript];
        if (directCommand) {
            directCommand();
            this.stopListening();
            return;
        }

        // Pattern matching for fuzzy recognition
        for (const { pattern, action } of this.patterns) {
            if (pattern.test(transcript)) {
                this.executeAction(action, transcript);
                this.stopListening();
                return;
            }
        }

        // Context-specific commands
        if (this.currentContext && this.currentContext !== 'global') {
            this.processContextCommand(transcript, this.currentContext);
            return;
        }

        // Search fallback
        this.performVoiceSearch(transcript);
    }

    executeAction(action, transcript) {
        switch (action) {
            case 'completeTask':
                this.completeFirstTask();
                break;
            case 'showPriorities':
                this.dashboard.focusWidget('priorities');
                break;
            case 'showCRM':
                this.dashboard.focusWidget('crm');
                break;
            case 'showCalendar':
                this.dashboard.focusWidget('calendar');
                break;
            case 'announceTaskCount':
                this.announceTaskCount();
                break;
            case 'refreshData':
                this.dashboard.refreshAllData();
                this.speak('Odświeżam dane');
                break;
            case 'showHelp':
                this.showHelp();
                break;
            default:
                this.performVoiceSearch(transcript);
        }
    }

    processContextCommand(transcript, context) {
        switch (context) {
            case 'priorities':
                if (/ukończ|wykonaj|zrób/i.test(transcript)) {
                    this.completeFirstTask();
                } else if (/pierwszy|pierwsz[ea]/i.test(transcript)) {
                    this.announceFirstPriority();
                }
                break;
                
            case 'crm':
                if (/pipeline|sprzedaż/i.test(transcript)) {
                    this.announceSalesMetrics();
                } else if (/konwersj[ae]/i.test(transcript)) {
                    this.showConversionRates();
                }
                break;
                
            case 'calendar':
                if (/dzisiaj|today/i.test(transcript)) {
                    this.announceTodayMeetings();
                } else if (/następn[ye]|next/i.test(transcript)) {
                    this.announceNextMeeting();
                }
                break;
        }
        
        this.stopListening();
    }

    async performVoiceSearch(query) {
        try {
            this.voiceFeedback.textContent = `Szukam: "${query}"`;
            
            const results = await this.apiClient.searchRAG(query);
            
            if (results.results && results.results.length > 0) {
                const firstResult = results.results[0];
                this.speak(`Znalazłem: ${firstResult.title || firstResult.content.substring(0, 50)}`);
                
                // Show search results in a temporary overlay
                this.showSearchResults(results.results, query);
            } else {
                this.speak('Nie znalazłem niczego pasującego do zapytania');
            }
        } catch (error) {
            console.error('Voice search error:', error);
            this.speak('Błąd wyszukiwania');
        }
        
        this.stopListening();
    }

    // Voice actions implementation
    async completeFirstTask() {
        try {
            const tasks = await this.apiClient.getPriorityTasks();
            
            if (tasks.tasks && tasks.tasks.length > 0) {
                const firstTask = tasks.tasks.find(task => task.status !== 'COMPLETED');
                
                if (firstTask) {
                    await this.apiClient.completeTask(firstTask.id);
                    this.speak(`Ukończyłem zadanie: ${firstTask.title}`);
                    this.dashboard.refreshWidget('priorities');
                } else {
                    this.speak('Wszystkie zadania są już ukończone');
                }
            } else {
                this.speak('Nie masz żadnych zadań do ukończenia');
            }
        } catch (error) {
            console.error('Error completing task:', error);
            this.speak('Błąd podczas ukończania zadania');
        }
    }

    async announceTaskCount() {
        try {
            const stats = await this.apiClient.getDashboardStats();
            const activeTasks = stats.stats?.activeTasks || 0;
            const urgentTasks = stats.stats?.urgentTasks || 0;
            
            let message = `Masz ${activeTasks} aktywnych zadań`;
            if (urgentTasks > 0) {
                message += ` w tym ${urgentTasks} pilnych`;
            }
            
            this.speak(message);
        } catch (error) {
            console.error('Error announcing task count:', error);
            this.speak('Błąd podczas pobierania liczby zadań');
        }
    }

    async announcePriorities() {
        try {
            const tasks = await this.apiClient.getPriorityTasks();
            
            if (tasks.tasks && tasks.tasks.length > 0) {
                const activeTasks = tasks.tasks.filter(task => task.status !== 'COMPLETED');
                
                if (activeTasks.length > 0) {
                    const firstTask = activeTasks[0];
                    this.speak(`Najważniejsze zadanie: ${firstTask.title}`);
                } else {
                    this.speak('Wszystkie priorytetowe zadania są ukończone');
                }
            } else {
                this.speak('Nie masz żadnych priorytetowych zadań');
            }
        } catch (error) {
            console.error('Error announcing priorities:', error);
            this.speak('Błąd podczas pobierania priorytetów');
        }
    }

    async announceTodayMeetings() {
        try {
            const meetings = await this.apiClient.getTodayMeetings();
            
            if (meetings.meetings && meetings.meetings.length > 0) {
                const count = meetings.meetings.length;
                const nextMeeting = meetings.meetings[0];
                
                let message = `Masz dziś ${count} spotkań`;
                if (nextMeeting) {
                    const time = new Date(nextMeeting.startTime).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    message += `. Najbliższe o ${time}: ${nextMeeting.title}`;
                }
                
                this.speak(message);
            } else {
                this.speak('Nie masz dziś żadnych spotkań');
            }
        } catch (error) {
            console.error('Error announcing meetings:', error);
            this.speak('Błąd podczas pobierania spotkań');
        }
    }

    async announceSalesMetrics() {
        try {
            const [pipeline, velocity] = await Promise.all([
                this.apiClient.getPipelineStats(),
                this.apiClient.getPipelineVelocity()
            ]);
            
            if (pipeline && pipeline.length > 0) {
                const totalValue = pipeline.reduce((sum, stage) => sum + (stage.value || 0), 0);
                const totalDeals = pipeline.reduce((sum, stage) => sum + (stage.count || 0), 0);
                
                let message = `Pipeline: ${totalDeals} ofert o wartości ${totalValue.toLocaleString()} złotych`;
                
                if (velocity && velocity.winRate) {
                    message += `. Wskaźnik konwersji: ${velocity.winRate}%`;
                }
                
                this.speak(message);
            } else {
                this.speak('Brak danych o pipeline sprzedażowym');
            }
        } catch (error) {
            console.error('Error announcing sales metrics:', error);
            this.speak('Błąd podczas pobierania danych sprzedażowych');
        }
    }

    showHelp() {
        const commands = [
            'Odśwież dane',
            'Pokaż priorytety',
            'Ile mam zadań',
            'Ukończ pierwsze zadanie',
            'Pokaż sprzedaż',
            'Co dzisiaj',
            'Pokaż kalendarz'
        ];
        
        this.speak('Możesz powiedzieć na przykład: ' + commands.slice(0, 3).join(', '));
        
        // Show visual help
        this.showToast('Komendy głosowe: ' + commands.join(' • '), 'info', 5000);
    }

    // Text-to-Speech
    speak(text) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pl-PL';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            
            // Try to find Polish voice
            const voices = speechSynthesis.getVoices();
            const polishVoice = voices.find(voice => voice.lang.startsWith('pl'));
            if (polishVoice) {
                utterance.voice = polishVoice;
            }
            
            speechSynthesis.speak(utterance);
        }
    }

    // Utility methods
    showToast(message, type = 'info', duration = 3000) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'error' ? '#ea4335' : type === 'success' ? '#34a853' : '#4285f4',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: '9999',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '400px',
            wordWrap: 'break-word'
        });
        
        document.body.appendChild(toast);
        
        // Animate in
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'transform 0.3s ease-out';
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
        
        // Remove after duration
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    showSearchResults(results, query) {
        // Implementation would show search results overlay
        // For now, just log to console
        console.log('Search results for:', query, results);
    }

    clearCache() {
        this.apiClient.clearCache();
        this.speak('Cache wyczyszczony');
        this.showToast('Cache został wyczyszczony', 'success');
    }
}

// Export for use in dashboard
window.VoiceCommands = VoiceCommands;