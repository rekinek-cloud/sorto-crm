/**
 * Response Handlers for Different Content Types
 * Each handler specializes in generating natural responses for specific data types
 */

// Base Response Handler
class BaseResponseHandler {
    constructor() {
        this.templates = new Map();
        this.initializeTemplates();
    }

    initializeTemplates() {
        // Override in subclasses
    }

    async generateResponse(data, context, variant) {
        throw new Error('generateResponse must be implemented by subclass');
    }

    formatNumber(num) {
        if (num === 0) return 'zero';
        if (num === 1) return 'jeden';
        if (num === 2) return 'dwa';
        if (num === 3) return 'trzy';
        if (num === 4) return 'cztery';
        if (num === 5) return 'pięć';
        if (num < 10) return num.toString();
        return num.toLocaleString('pl-PL');
    }

    formatPlural(count, singular, few, many) {
        if (count === 1) return singular;
        if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
            return few;
        }
        return many;
    }

    getTimeGreeting() {
        const hour = new Date().getHours();
        if (hour < 10) return 'Rozpoczynasz wcześnie dzisiaj';
        if (hour < 12) return 'Dobry początek dnia';
        if (hour < 17) return 'Środek dnia';
        if (hour < 20) return 'Końcówka dnia roboczego';
        return 'Pracujesz do późna';
    }

    getMotivationalPhrase(context) {
        const phrases = [
            'Świetna robota!',
            'Jesteś na dobrej drodze!',
            'Trzymaj tempo!',
            'Doskonale sobie radzisz!',
            'Kontynuuj dobrą pracę!'
        ];
        
        // Select based on user productivity or randomly
        const index = (context.efficiency || 0) % phrases.length;
        return phrases[Math.floor(index)];
    }
}

// Task Response Handler
class TaskResponseHandler extends BaseResponseHandler {
    initializeTemplates() {
        this.templates.set('list', [
            {
                id: 'task_list_standard',
                template: 'Masz {count} {taskWord} do wykonania. {taskDetails}',
                weight: 0.6
            },
            {
                id: 'task_list_motivational',
                template: '{greeting}! Masz {count} {taskWord} na dzisiaj. {motivation} {taskDetails}',
                weight: 0.4
            }
        ]);

        this.templates.set('priority', [
            {
                id: 'priority_urgent',
                template: 'Najpilniejsze: {firstTask}. {additionalInfo}',
                weight: 0.7
            },
            {
                id: 'priority_structured',
                template: 'Twoje priorytety na dzisiaj: Pierwsza sprawa to {firstTask}. {additionalTasks}',
                weight: 0.3
            }
        ]);

        this.templates.set('completion', [
            {
                id: 'completion_celebration',
                template: 'Wspaniale! Ukończyłeś zadanie: {taskName}. {progressInfo}',
                weight: 0.5
            },
            {
                id: 'completion_progress',
                template: 'Zadanie "{taskName}" zostało ukończone. {remainingTasks}',
                weight: 0.5
            }
        ]);
    }

    async generateResponse(data, context, variant) {
        const { tasks, queryType } = data;
        const templates = this.templates.get(queryType) || this.templates.get('list');
        const template = this.selectTemplate(templates, variant);

        switch (queryType) {
            case 'list':
                return this.generateTaskList(tasks, context, template);
            case 'priority':
                return this.generatePriorityResponse(tasks, context, template);
            case 'completion':
                return this.generateCompletionResponse(data, context, template);
            case 'status':
                return this.generateStatusResponse(tasks, context, template);
            default:
                return this.generateTaskList(tasks, context, template);
        }
    }

    generateTaskList(tasks, context, template) {
        if (!tasks || tasks.length === 0) {
            return {
                text: 'Świetnie! Nie masz żadnych zadań do wykonania. Czas na relaks lub planowanie nowych celów.',
                followUpSuggestions: [
                    'Sprawdź postęp celów',
                    'Zobacz przyszłe spotkania',
                    'Przejrzyj osiągnięcia'
                ]
            };
        }

        const count = tasks.length;
        const taskWord = this.formatPlural(count, 'zadanie', 'zadania', 'zadań');
        const urgentTasks = tasks.filter(task => task.priority === 'HIGH' || task.priority === 'URGENT');
        
        let taskDetails = '';
        if (urgentTasks.length > 0) {
            const firstUrgent = urgentTasks[0];
            taskDetails = `Najpilniejsze to: ${firstUrgent.title}.`;
            
            if (urgentTasks.length > 1) {
                taskDetails += ` Masz także ${urgentTasks.length - 1} innych pilnych zadań.`;
            }
        } else if (tasks.length > 0) {
            taskDetails = `Pierwsza sprawa to: ${tasks[0].title}.`;
        }

        const greeting = this.getTimeGreeting();
        const motivation = count > 5 ? 'To może wydawać się dużo, ale podziel to na mniejsze części.' : 'To całkiem wykonalne!';

        const text = template.template
            .replace('{count}', this.formatNumber(count))
            .replace('{taskWord}', taskWord)
            .replace('{taskDetails}', taskDetails)
            .replace('{greeting}', greeting)
            .replace('{motivation}', motivation);

        return {
            text,
            followUpSuggestions: [
                'Pokaż detale pierwszego zadania',
                'Ukończ pierwsze zadanie',
                'Sprawdź deadline\'y'
            ]
        };
    }

    generatePriorityResponse(tasks, context, template) {
        const priorityTasks = tasks
            .filter(task => task.priority === 'HIGH' || task.priority === 'URGENT')
            .slice(0, 3);

        if (priorityTasks.length === 0) {
            return {
                text: 'Doskonale! Nie masz żadnych pilnych zadań. Możesz skupić się na długoterminowych celach.',
                followUpSuggestions: [
                    'Sprawdź wszystkie zadania',
                    'Zobacz postęp projektów',
                    'Zaplanuj nowe cele'
                ]
            };
        }

        const firstTask = priorityTasks[0];
        let additionalInfo = '';
        let additionalTasks = '';

        if (firstTask.dueDate) {
            const dueDate = new Date(firstTask.dueDate);
            const timeLeft = this.getTimeUntilDeadline(dueDate);
            additionalInfo = `Masz na to ${timeLeft}.`;
        }

        if (priorityTasks.length > 1) {
            additionalTasks = `Następnie zajmij się: ${priorityTasks.slice(1).map(t => t.title).join(', ')}.`;
        }

        const text = template.template
            .replace('{firstTask}', firstTask.title)
            .replace('{additionalInfo}', additionalInfo)
            .replace('{additionalTasks}', additionalTasks);

        return {
            text,
            followUpSuggestions: [
                'Rozpocznij pierwszą sprawę',
                'Pokaż detale zadania',
                'Zaplanuj czas na wykonanie'
            ]
        };
    }

    generateCompletionResponse(data, context, template) {
        const { taskName, remainingCount } = data;
        const motivation = this.getMotivationalPhrase(context);
        
        let progressInfo = '';
        let remainingTasks = '';

        if (remainingCount > 0) {
            const taskWord = this.formatPlural(remainingCount, 'zadanie', 'zadania', 'zadań');
            progressInfo = `Zostało Ci jeszcze ${this.formatNumber(remainingCount)} ${taskWord}.`;
            remainingTasks = `Zostało Ci ${this.formatNumber(remainingCount)} ${taskWord} do ukończenia.`;
        } else {
            progressInfo = 'To było ostatnie zadanie na dzisiaj! Gratulacje!';
            remainingTasks = 'Wszystkie zadania na dzisiaj zostały ukończone!';
        }

        const text = template.template
            .replace('{taskName}', taskName)
            .replace('{progressInfo}', progressInfo)
            .replace('{remainingTasks}', remainingTasks);

        return {
            text,
            followUpSuggestions: remainingCount > 0 ? [
                'Pokaż następne zadanie',
                'Sprawdź postęp dnia',
                'Zrób krótką przerwę'
            ] : [
                'Zobacz osiągnięcia dnia',
                'Zaplanuj jutro',
                'Sprawdź cele długoterminowe'
            ]
        };
    }

    generateStatusResponse(tasks, context, template) {
        const total = tasks.length;
        const completed = tasks.filter(task => task.status === 'COMPLETED').length;
        const inProgress = tasks.filter(task => task.status === 'IN_PROGRESS').length;
        const pending = total - completed - inProgress;

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        let statusText = '';
        if (completionRate >= 80) {
            statusText = `Fantastycznie! Ukończyłeś już ${completionRate}% zadań.`;
        } else if (completionRate >= 50) {
            statusText = `Dobra robota! Ukończyłeś ${completionRate}% zadań.`;
        } else if (completionRate > 0) {
            statusText = `Rozpocząłeś dzień. Ukończyłeś ${completionRate}% zadań.`;
        } else {
            statusText = 'Czas zacząć! Masz przed sobą cały dzień możliwości.';
        }

        if (inProgress > 0) {
            const progressWord = this.formatPlural(inProgress, 'zadanie w trakcie', 'zadania w trakcie', 'zadań w trakcie');
            statusText += ` Masz ${this.formatNumber(inProgress)} ${progressWord}.`;
        }

        return {
            text: statusText,
            followUpSuggestions: [
                'Pokaż zadania w trakcie',
                'Zobacz priorytety',
                'Sprawdź deadline\'y'
            ]
        };
    }

    getTimeUntilDeadline(dueDate) {
        const now = new Date();
        const diffMs = dueDate - now;
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs < 0) return 'termin już minął';
        if (diffHours < 1) return 'mniej niż godzinę';
        if (diffHours < 24) return `${diffHours} godzin`;
        if (diffDays === 1) return 'do jutra';
        return `${diffDays} dni`;
    }

    selectTemplate(templates, variant) {
        // A/B testing logic - select template based on variant
        if (variant && variant.templateOverride) {
            return templates.find(t => t.id === variant.templateOverride) || templates[0];
        }
        
        // Weighted random selection
        const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const template of templates) {
            random -= template.weight;
            if (random <= 0) return template;
        }
        
        return templates[0];
    }
}

// Client Response Handler
class ClientResponseHandler extends BaseResponseHandler {
    initializeTemplates() {
        this.templates.set('info', [
            {
                id: 'client_info_detailed',
                template: '{clientName} to {clientType}. {companyInfo} {recentActivity}',
                weight: 0.6
            },
            {
                id: 'client_info_concise',
                template: '{clientName} - {businessSummary}. {nextAction}',
                weight: 0.4
            }
        ]);

        this.templates.set('deals', [
            {
                id: 'deals_optimistic',
                template: 'Świetne wieści o {clientName}! {dealInfo} {probability}',
                weight: 0.5
            },
            {
                id: 'deals_analytical',
                template: '{clientName}: {dealStatus}. {nextSteps}',
                weight: 0.5
            }
        ]);
    }

    async generateResponse(data, context, variant) {
        const { clientData, queryType } = data;
        const templates = this.templates.get(queryType) || this.templates.get('info');
        const template = this.selectTemplate(templates, variant);

        switch (queryType) {
            case 'info':
                return this.generateClientInfo(clientData, context, template);
            case 'deals':
                return this.generateDealsInfo(clientData, context, template);
            case 'history':
                return this.generateHistoryInfo(clientData, context, template);
            case 'meetings':
                return this.generateMeetingsInfo(clientData, context, template);
            default:
                return this.generateClientInfo(clientData, context, template);
        }
    }

    generateClientInfo(client, context, template) {
        const clientName = client.name || 'Klient';
        const clientType = this.getClientType(client);
        const companyInfo = client.company ? `Pracuje w ${client.company}.` : '';
        const recentActivity = this.getRecentActivitySummary(client);
        const businessSummary = this.getBusinessSummary(client);
        const nextAction = this.getNextAction(client);

        const text = template.template
            .replace('{clientName}', clientName)
            .replace('{clientType}', clientType)
            .replace('{companyInfo}', companyInfo)
            .replace('{recentActivity}', recentActivity)
            .replace('{businessSummary}', businessSummary)
            .replace('{nextAction}', nextAction);

        return {
            text,
            followUpSuggestions: [
                'Pokaż historię kontaktów',
                'Zobacz aktualne oferty',
                'Zaplanuj następne spotkanie'
            ]
        };
    }

    generateDealsInfo(client, context, template) {
        if (!client.deals || client.deals.length === 0) {
            return {
                text: `${client.name} nie ma obecnie aktywnych ofert. To dobry moment na zaproponowanie nowych rozwiązań.`,
                followUpSuggestions: [
                    'Utwórz nową ofertę',
                    'Sprawdź historię zamówień',
                    'Zaplanuj spotkanie handlowe'
                ]
            };
        }

        const mainDeal = client.deals[0];
        const dealInfo = `${mainDeal.title} o wartości ${this.formatCurrency(mainDeal.value)}`;
        const probability = mainDeal.probability ? 
            `Prawdopodobieństwo zamknięcia: ${mainDeal.probability}%.` : '';
        const dealStatus = `Oferta "${mainDeal.title}" jest w fazie ${this.getDealStageInPolish(mainDeal.stage)}`;
        const nextSteps = this.getDealNextSteps(mainDeal);

        const text = template.template
            .replace('{clientName}', client.name)
            .replace('{dealInfo}', dealInfo)
            .replace('{probability}', probability)
            .replace('{dealStatus}', dealStatus)
            .replace('{nextSteps}', nextSteps);

        return {
            text,
            followUpSuggestions: [
                'Zaktualizuj status oferty',
                'Zaplanuj follow-up',
                'Wyślij propozycję'
            ]
        };
    }

    generateHistoryInfo(client, context, template) {
        const interactionCount = client.interactions?.length || 0;
        const lastContact = client.lastContactDate ? 
            new Date(client.lastContactDate) : null;
        
        let historyText = '';
        
        if (interactionCount === 0) {
            historyText = `${client.name} to nowy kontakt. Jeszcze nie mieliście żadnych interakcji.`;
        } else {
            const interactionWord = this.formatPlural(interactionCount, 'kontakt', 'kontakty', 'kontaktów');
            historyText = `Mieliście już ${this.formatNumber(interactionCount)} ${interactionWord} z ${client.name}.`;
            
            if (lastContact) {
                const daysSince = Math.floor((new Date() - lastContact) / (1000 * 60 * 60 * 24));
                if (daysSince === 0) {
                    historyText += ' Ostatni kontakt był dzisiaj.';
                } else if (daysSince === 1) {
                    historyText += ' Ostatni kontakt był wczoraj.';
                } else if (daysSince < 7) {
                    historyText += ` Ostatni kontakt był ${daysSince} dni temu.`;
                } else {
                    historyText += ` Ostatni kontakt był ${Math.floor(daysSince / 7)} tygodni temu.`;
                }
            }
        }

        return {
            text: historyText,
            followUpSuggestions: [
                'Pokaż szczegóły ostatniego kontaktu',
                'Zaplanuj nowy kontakt',
                'Zobacz wszystkie interakcje'
            ]
        };
    }

    generateMeetingsInfo(client, context, template) {
        const upcomingMeetings = client.meetings?.filter(m => new Date(m.startTime) > new Date()) || [];
        const pastMeetings = client.meetings?.filter(m => new Date(m.startTime) <= new Date()) || [];

        let meetingsText = '';

        if (upcomingMeetings.length > 0) {
            const nextMeeting = upcomingMeetings[0];
            const meetingDate = new Date(nextMeeting.startTime);
            const timeUntil = this.getTimeUntilMeeting(meetingDate);
            
            meetingsText = `Następne spotkanie z ${client.name} jest ${timeUntil}. Temat: ${nextMeeting.title}.`;
            
            if (upcomingMeetings.length > 1) {
                meetingsText += ` Masz też ${upcomingMeetings.length - 1} innych zaplanowanych spotkań.`;
            }
        } else if (pastMeetings.length > 0) {
            const lastMeeting = pastMeetings[pastMeetings.length - 1];
            const daysSince = Math.floor((new Date() - new Date(lastMeeting.startTime)) / (1000 * 60 * 60 * 24));
            
            meetingsText = `Ostatnie spotkanie z ${client.name} było ${daysSince} dni temu. Czas zaplanować kolejne!`;
        } else {
            meetingsText = `Nie masz jeszcze zaplanowanych spotkań z ${client.name}. To dobry moment na pierwsze spotkanie.`;
        }

        return {
            text: meetingsText,
            followUpSuggestions: upcomingMeetings.length > 0 ? [
                'Pokaż szczegóły spotkania',
                'Przygotuj agendę',
                'Wyślij przypomnienie'
            ] : [
                'Zaplanuj spotkanie',
                'Sprawdź dostępność',
                'Wyślij propozycję terminów'
            ]
        };
    }

    // Helper methods
    getClientType(client) {
        if (client.type === 'LEAD') return 'potencjalny klient';
        if (client.type === 'CUSTOMER') return 'stały klient';
        if (client.type === 'PROSPECT') return 'prospekt';
        return 'kontakt biznesowy';
    }

    getRecentActivitySummary(client) {
        if (!client.lastActivity) return '';
        
        const activity = client.lastActivity;
        const daysSince = Math.floor((new Date() - new Date(activity.date)) / (1000 * 60 * 60 * 24));
        
        if (daysSince === 0) return 'Ostatnia aktywność była dzisiaj.';
        if (daysSince === 1) return 'Ostatnia aktywność była wczoraj.';
        return `Ostatnia aktywność była ${daysSince} dni temu.`;
    }

    getBusinessSummary(client) {
        const parts = [];
        if (client.industry) parts.push(`branża ${client.industry}`);
        if (client.size) parts.push(`${client.size} pracowników`);
        if (client.revenue) parts.push(`obroty ${this.formatCurrency(client.revenue)}`);
        
        return parts.length > 0 ? parts.join(', ') : 'szczegóły do uzupełnienia';
    }

    getNextAction(client) {
        if (client.nextAction) return `Następny krok: ${client.nextAction}.`;
        if (client.status === 'HOT') return 'Gorący lead - skontaktuj się jak najszybciej!';
        if (client.status === 'COLD') return 'Zimny kontakt - rozważ kampanię reaktywacyjną.';
        return 'Zaplanuj kolejne działania.';
    }

    getDealStageInPolish(stage) {
        const stages = {
            'PROSPECT': 'prospekt',
            'QUALIFIED': 'kwalifikacja',
            'PROPOSAL': 'propozycja',
            'NEGOTIATION': 'negocjacje',
            'CLOSING': 'finalizacja',
            'WON': 'wygrana',
            'LOST': 'przegrana'
        };
        return stages[stage] || stage;
    }

    getDealNextSteps(deal) {
        const stage = deal.stage;
        const nextSteps = {
            'PROSPECT': 'Przeprowadź kwalifikację potrzeb.',
            'QUALIFIED': 'Przygotuj szczegółową propozycję.',
            'PROPOSAL': 'Umów prezentację lub demo.',
            'NEGOTIATION': 'Dopracuj warunki handlowe.',
            'CLOSING': 'Przygotuj dokumenty do podpisu.'
        };
        return nextSteps[stage] || 'Określ następne kroki.';
    }

    getTimeUntilMeeting(meetingDate) {
        const now = new Date();
        const diffMs = meetingDate - now;
        const diffMinutes = Math.ceil(diffMs / (1000 * 60));
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 60) return `za ${diffMinutes} minut`;
        if (diffHours < 24) return `za ${diffHours} godzin`;
        if (diffDays === 1) return 'jutro';
        return `za ${diffDays} dni`;
    }

    formatCurrency(amount) {
        if (!amount) return '';
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN'
        }).format(amount);
    }

    selectTemplate(templates, variant) {
        // Same logic as TaskResponseHandler
        if (variant && variant.templateOverride) {
            return templates.find(t => t.id === variant.templateOverride) || templates[0];
        }
        
        const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const template of templates) {
            random -= template.weight;
            if (random <= 0) return template;
        }
        
        return templates[0];
    }
}

// Calendar Response Handler
class CalendarResponseHandler extends BaseResponseHandler {
    initializeTemplates() {
        this.templates.set('today', [
            {
                id: 'calendar_today_structured',
                template: 'Dzisiaj masz {count} {meetingWord}. {timeDistribution} {firstMeeting}',
                weight: 0.6
            },
            {
                id: 'calendar_today_personal',
                template: '{greeting} Twój kalendarz na dzisiaj: {meetingsSummary}',
                weight: 0.4
            }
        ]);

        this.templates.set('upcoming', [
            {
                id: 'upcoming_next',
                template: 'Następne spotkanie: {nextMeeting} {timeInfo} {preparation}',
                weight: 0.7
            },
            {
                id: 'upcoming_overview',
                template: 'W najbliższym czasie masz: {upcomingSummary}',
                weight: 0.3
            }
        ]);
    }

    async generateResponse(data, context, variant) {
        const { meetings, queryType } = data;
        const templates = this.templates.get(queryType) || this.templates.get('today');
        const template = this.selectTemplate(templates, variant);

        switch (queryType) {
            case 'today':
                return this.generateTodayResponse(meetings, context, template);
            case 'upcoming':
                return this.generateUpcomingResponse(meetings, context, template);
            case 'summary':
                return this.generateSummaryResponse(meetings, context, template);
            case 'conflicts':
                return this.generateConflictsResponse(meetings, context, template);
            default:
                return this.generateTodayResponse(meetings, context, template);
        }
    }

    generateTodayResponse(meetings, context, template) {
        const todayMeetings = meetings.filter(meeting => {
            const meetingDate = new Date(meeting.startTime);
            const today = new Date();
            return meetingDate.toDateString() === today.toDateString();
        });

        if (todayMeetings.length === 0) {
            return {
                text: 'Świetnie! Masz dziś wolny kalendarz. To doskonały czas na skupienie się na głębokich zadaniach.',
                followUpSuggestions: [
                    'Pokaż zadania do wykonania',
                    'Zobacz jutrzejsze spotkania',
                    'Zaplanuj czas na projekty'
                ]
            };
        }

        const count = todayMeetings.length;
        const meetingWord = this.formatPlural(count, 'spotkanie', 'spotkania', 'spotkań');
        const timeDistribution = this.getTimeDistribution(todayMeetings);
        const firstMeeting = this.getFirstMeetingInfo(todayMeetings);
        const greeting = this.getTimeGreeting();
        const meetingsSummary = this.getMeetingsSummary(todayMeetings);

        const text = template.template
            .replace('{count}', this.formatNumber(count))
            .replace('{meetingWord}', meetingWord)
            .replace('{timeDistribution}', timeDistribution)
            .replace('{firstMeeting}', firstMeeting)
            .replace('{greeting}', greeting)
            .replace('{meetingsSummary}', meetingsSummary);

        return {
            text,
            followUpSuggestions: [
                'Pokaż szczegóły pierwszego spotkania',
                'Przygotuj agenda na spotkania',
                'Sprawdź jutrzejszy kalendarz'
            ]
        };
    }

    generateUpcomingResponse(meetings, context, template) {
        const now = new Date();
        const upcoming = meetings
            .filter(meeting => new Date(meeting.startTime) > now)
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
            .slice(0, 3);

        if (upcoming.length === 0) {
            return {
                text: 'Nie masz żadnych zaplanowanych spotkań w najbliższym czasie. Możesz skupić się na bieżących zadaniach.',
                followUpSuggestions: [
                    'Zaplanuj nowe spotkania',
                    'Sprawdź zadania do wykonania',
                    'Zobacz długoterminowy kalendarz'
                ]
            };
        }

        const nextMeeting = upcoming[0];
        const timeInfo = this.getTimeUntilMeeting(new Date(nextMeeting.startTime));
        const preparation = this.getPreparationSuggestion(nextMeeting);
        const upcomingSummary = this.getUpcomingSummary(upcoming);

        const text = template.template
            .replace('{nextMeeting}', `${nextMeeting.title} z ${nextMeeting.clientName || 'uczestnikami'}`)
            .replace('{timeInfo}', timeInfo)
            .replace('{preparation}', preparation)
            .replace('{upcomingSummary}', upcomingSummary);

        return {
            text,
            followUpSuggestions: [
                'Przygotuj się do spotkania',
                'Sprawdź informacje o kliencie',
                'Wyślij przypomnienie'
            ]
        };
    }

    generateSummaryResponse(meetings, context, template) {
        const thisWeek = this.getThisWeekMeetings(meetings);
        const nextWeek = this.getNextWeekMeetings(meetings);
        
        const thisWeekCount = thisWeek.length;
        const nextWeekCount = nextWeek.length;
        
        let summaryText = '';
        
        if (thisWeekCount === 0 && nextWeekCount === 0) {
            summaryText = 'Masz spokojny okres - brak zaplanowanych spotkań w najbliższych dwóch tygodniach.';
        } else {
            const thisWeekWord = this.formatPlural(thisWeekCount, 'spotkanie', 'spotkania', 'spotkań');
            const nextWeekWord = this.formatPlural(nextWeekCount, 'spotkanie', 'spotkania', 'spotkań');
            
            summaryText = `W tym tygodniu masz ${thisWeekCount} ${thisWeekWord}`;
            if (nextWeekCount > 0) {
                summaryText += `, a w następnym ${nextWeekCount} ${nextWeekWord}`;
            }
            summaryText += '.';
            
            // Add busiest day info
            const busiestDay = this.getBusiestDay(thisWeek);
            if (busiestDay) {
                summaryText += ` Najbardziej obciążony dzień to ${busiestDay.day} z ${busiestDay.count} spotkaniami.`;
            }
        }

        return {
            text: summaryText,
            followUpSuggestions: [
                'Pokaż szczegóły tygodnia',
                'Sprawdź najbliższe spotkania',
                'Zaplanuj nowe terminy'
            ]
        };
    }

    generateConflictsResponse(meetings, context, template) {
        const conflicts = this.findTimeConflicts(meetings);
        
        if (conflicts.length === 0) {
            return {
                text: 'Doskonale! Nie masz żadnych konfliktów w kalendarzu. Wszystkie spotkania są odpowiednio rozłożone.',
                followUpSuggestions: [
                    'Pokaż najbliższe spotkania',
                    'Dodaj nowe terminy',
                    'Sprawdź obciążenie tygodnia'
                ]
            };
        }

        const conflictWord = this.formatPlural(conflicts.length, 'konflikt', 'konflikty', 'konfliktów');
        let conflictsText = `Uwaga! Masz ${this.formatNumber(conflicts.length)} ${conflictWord} w kalendarzu. `;
        
        const firstConflict = conflicts[0];
        const conflictDate = new Date(firstConflict.startTime).toLocaleDateString('pl-PL');
        conflictsText += `Pierwszy konflikt: ${conflictDate} - nakładające się spotkania.`;

        return {
            text: conflictsText,
            followUpSuggestions: [
                'Pokaż szczegóły konfliktów',
                'Przełóż spotkania',
                'Skontaktuj się z uczestnikami'
            ]
        };
    }

    // Helper methods
    getTimeDistribution(meetings) {
        const morning = meetings.filter(m => new Date(m.startTime).getHours() < 12).length;
        const afternoon = meetings.filter(m => {
            const hour = new Date(m.startTime).getHours();
            return hour >= 12 && hour < 18;
        }).length;
        const evening = meetings.filter(m => new Date(m.startTime).getHours() >= 18).length;

        const parts = [];
        if (morning > 0) parts.push(`${morning} rano`);
        if (afternoon > 0) parts.push(`${afternoon} po południu`);
        if (evening > 0) parts.push(`${evening} wieczorem`);

        return parts.length > 0 ? parts.join(', ') + '.' : '';
    }

    getFirstMeetingInfo(meetings) {
        const sorted = meetings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        const first = sorted[0];
        const time = new Date(first.startTime).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `Pierwsze o ${time}: ${first.title}.`;
    }

    getMeetingsSummary(meetings) {
        if (meetings.length <= 2) {
            return meetings.map(m => {
                const time = new Date(m.startTime).toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                return `${time} - ${m.title}`;
            }).join(', ');
        } else {
            const first = meetings[0];
            const time = new Date(first.startTime).toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit'
            });
            return `${time} - ${first.title} i jeszcze ${meetings.length - 1} innych`;
        }
    }

    getTimeUntilMeeting(meetingDate) {
        const now = new Date();
        const diffMs = meetingDate - now;
        const diffMinutes = Math.ceil(diffMs / (1000 * 60));
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

        if (diffMinutes < 30) return `za ${diffMinutes} minut`;
        if (diffMinutes < 120) return `za ${Math.ceil(diffMinutes / 30) * 30} minut`;
        if (diffHours < 24) return `za ${diffHours} godzin`;
        return `jutro o ${meetingDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
    }

    getPreparationSuggestion(meeting) {
        const timeUntil = new Date(meeting.startTime) - new Date();
        const minutesUntil = timeUntil / (1000 * 60);

        if (minutesUntil < 30) {
            return 'Czas się przygotować!';
        } else if (minutesUntil < 120) {
            return 'Sprawdź agendę i materiały.';
        } else {
            return 'Masz jeszcze czas na przygotowania.';
        }
    }

    getUpcomingSummary(meetings) {
        return meetings.map((meeting, index) => {
            const time = this.getTimeUntilMeeting(new Date(meeting.startTime));
            return `${index + 1}. ${meeting.title} ${time}`;
        }).join(', ');
    }

    getThisWeekMeetings(meetings) {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        return meetings.filter(meeting => {
            const meetingDate = new Date(meeting.startTime);
            return meetingDate >= weekStart && meetingDate < weekEnd;
        });
    }

    getNextWeekMeetings(meetings) {
        const now = new Date();
        const nextWeekStart = new Date(now.setDate(now.getDate() - now.getDay() + 7));
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

        return meetings.filter(meeting => {
            const meetingDate = new Date(meeting.startTime);
            return meetingDate >= nextWeekStart && meetingDate < nextWeekEnd;
        });
    }

    getBusiestDay(meetings) {
        const dayCount = {};
        const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

        meetings.forEach(meeting => {
            const day = new Date(meeting.startTime).getDay();
            dayCount[day] = (dayCount[day] || 0) + 1;
        });

        let busiestDay = null;
        let maxCount = 0;

        for (const [day, count] of Object.entries(dayCount)) {
            if (count > maxCount) {
                maxCount = count;
                busiestDay = { day: dayNames[day], count };
            }
        }

        return busiestDay;
    }

    findTimeConflicts(meetings) {
        const conflicts = [];
        const sorted = meetings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            
            const currentEnd = new Date(current.endTime || current.startTime);
            const nextStart = new Date(next.startTime);
            
            if (currentEnd > nextStart) {
                conflicts.push(current);
            }
        }

        return conflicts;
    }

    selectTemplate(templates, variant) {
        if (variant && variant.templateOverride) {
            return templates.find(t => t.id === variant.templateOverride) || templates[0];
        }
        
        const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const template of templates) {
            random -= template.weight;
            if (random <= 0) return template;
        }
        
        return templates[0];
    }
}

// Goal Response Handler
class GoalResponseHandler extends BaseResponseHandler {
    initializeTemplates() {
        this.templates.set('progress', [
            {
                id: 'progress_motivational',
                template: '{achievement} {progressDetails} {motivation}',
                weight: 0.6
            },
            {
                id: 'progress_analytical',
                template: '{goalName}: {progressPercentage}% ukończone. {timeAnalysis}',
                weight: 0.4
            }
        ]);

        this.templates.set('achievement', [
            {
                id: 'achievement_celebration',
                template: 'Gratulacje! {achievementText} {impact} {nextChallenge}',
                weight: 0.8
            },
            {
                id: 'achievement_milestone',
                template: 'Osiągnięcie odblokowane: {achievementText} {streakInfo}',
                weight: 0.2
            }
        ]);
    }

    async generateResponse(data, context, variant) {
        const { goals, queryType } = data;
        const templates = this.templates.get(queryType) || this.templates.get('progress');
        const template = this.selectTemplate(templates, variant);

        switch (queryType) {
            case 'progress':
                return this.generateProgressResponse(goals, context, template);
            case 'achievement':
                return this.generateAchievementResponse(goals, context, template);
            case 'summary':
                return this.generateSummaryResponse(goals, context, template);
            case 'motivation':
                return this.generateMotivationResponse(goals, context, template);
            default:
                return this.generateProgressResponse(goals, context, template);
        }
    }

    generateProgressResponse(goals, context, template) {
        if (!goals || goals.length === 0) {
            return {
                text: 'Nie masz jeszcze ustawionych celów. To dobry moment na zaplanowanie swoich ambicji!',
                followUpSuggestions: [
                    'Ustaw nowy cel',
                    'Zobacz szablony celów',
                    'Sprawdź osiągnięcia'
                ]
            };
        }

        const mainGoal = goals[0];
        const progress = mainGoal.progress || 0;
        const achievement = this.getAchievementLevel(progress);
        const progressDetails = this.getProgressDetails(mainGoal);
        const motivation = this.getMotivationalMessage(progress, context);
        const progressPercentage = Math.round(progress);
        const timeAnalysis = this.getTimeAnalysis(mainGoal);

        const text = template.template
            .replace('{achievement}', achievement)
            .replace('{progressDetails}', progressDetails)
            .replace('{motivation}', motivation)
            .replace('{goalName}', mainGoal.name || 'Cel')
            .replace('{progressPercentage}', progressPercentage)
            .replace('{timeAnalysis}', timeAnalysis);

        return {
            text,
            followUpSuggestions: this.getProgressSuggestions(progress)
        };
    }

    generateAchievementResponse(data, context, template) {
        const { achievement, impact } = data;
        
        const achievementText = this.getAchievementText(achievement);
        const impactInfo = this.getImpactInfo(impact);
        const nextChallenge = this.getNextChallenge(achievement);
        const streakInfo = this.getStreakInfo(achievement);

        const text = template.template
            .replace('{achievementText}', achievementText)
            .replace('{impact}', impactInfo)
            .replace('{nextChallenge}', nextChallenge)
            .replace('{streakInfo}', streakInfo);

        return {
            text,
            followUpSuggestions: [
                'Zobacz wszystkie osiągnięcia',
                'Ustaw nowy cel',
                'Udostępnij sukces'
            ]
        };
    }

    generateSummaryResponse(goals, context, template) {
        const totalGoals = goals.length;
        const completed = goals.filter(goal => (goal.progress || 0) >= 100).length;
        const inProgress = goals.filter(goal => {
            const progress = goal.progress || 0;
            return progress > 0 && progress < 100;
        }).length;
        const notStarted = totalGoals - completed - inProgress;

        let summaryText = '';

        if (completed > 0) {
            const completedWord = this.formatPlural(completed, 'cel ukończony', 'cele ukończone', 'celów ukończonych');
            summaryText = `Wspaniale! Masz ${this.formatNumber(completed)} ${completedWord}. `;
        }

        if (inProgress > 0) {
            const progressWord = this.formatPlural(inProgress, 'cel w trakcie', 'cele w trakcie', 'celów w trakcie');
            summaryText += `${this.formatNumber(inProgress)} ${progressWord}. `;
        }

        if (notStarted > 0) {
            const notStartedWord = this.formatPlural(notStarted, 'cel do rozpoczęcia', 'cele do rozpoczęcia', 'celów do rozpoczęcia');
            summaryText += `${this.formatNumber(notStarted)} ${notStartedWord}. `;
        }

        if (totalGoals === 0) {
            summaryText = 'Nie masz jeszcze żadnych celów. Czas na planowanie przyszłości!';
        }

        // Add efficiency insight
        const efficiency = totalGoals > 0 ? Math.round((completed / totalGoals) * 100) : 0;
        if (efficiency > 0) {
            summaryText += `Twoja skuteczność realizacji celów to ${efficiency}%.`;
        }

        return {
            text: summaryText,
            followUpSuggestions: [
                'Pokaż postęp najważniejszych celów',
                'Zaktualizuj status celów',
                'Ustaw nowy cel'
            ]
        };
    }

    generateMotivationResponse(goals, context, template) {
        const recentProgress = this.getRecentProgress(goals);
        const personalizedMotivation = this.getPersonalizedMotivation(context);
        const encouragement = this.getEncouragement(recentProgress);

        let motivationText = personalizedMotivation + ' ' + encouragement;

        if (recentProgress.improvement > 0) {
            motivationText += ` W ostatnim czasie poczyniłeś ${recentProgress.improvement}% postępu. To fantastyczny rezultat!`;
        }

        const inspirationalQuote = this.getInspirationalQuote();
        motivationText += ` ${inspirationalQuote}`;

        return {
            text: motivationText,
            followUpSuggestions: [
                'Sprawdź konkretne cele',
                'Zaplanuj następne kroki',
                'Zobacz osiągnięcia'
            ]
        };
    }

    // Helper methods
    getAchievementLevel(progress) {
        if (progress >= 100) return 'Fantastycznie! Cel ukończony!';
        if (progress >= 80) return 'Świetnie! Jesteś bardzo blisko celu!';
        if (progress >= 60) return 'Doskonale! Masz już większość za sobą!';
        if (progress >= 40) return 'Dobra robota! Jesteś w połowie drogi!';
        if (progress >= 20) return 'Dobry start! Nabierasz rozpędu!';
        return 'Każda podróż zaczyna się od pierwszego kroku!';
    }

    getProgressDetails(goal) {
        const progress = goal.progress || 0;
        const remaining = 100 - progress;
        
        let details = `Ukończyłeś ${Math.round(progress)}%`;
        
        if (goal.deadline) {
            const deadline = new Date(goal.deadline);
            const now = new Date();
            const timeLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            
            if (timeLeft > 0) {
                details += `. Zostało ${timeLeft} dni do deadline'u`;
            } else if (timeLeft === 0) {
                details += '. Deadline jest dzisiaj!';
            } else {
                details += '. Deadline minął';
            }
        }
        
        if (remaining > 0 && remaining <= 20) {
            details += '. Już prawie!';
        }
        
        return details + '.';
    }

    getMotivationalMessage(progress, context) {
        const motivations = [
            'Nie zatrzymuj się teraz!',
            'Każdy dzień to krok naprzód!',
            'Twoja determinacja jest imponująca!',
            'Sukces jest tuż za rogiem!',
            'Koncentruj się na celu!'
        ];

        if (progress >= 80) {
            return 'Jesteś tak blisko! Finisz już widać!';
        } else if (progress >= 50) {
            return 'Przekroczyłeś połowę! Świetnie sobie radzisz!';
        } else if (progress >= 20) {
            return 'Dobry początek! Momentum rośnie!';
        }
        
        return motivations[Math.floor(Math.random() * motivations.length)];
    }

    getTimeAnalysis(goal) {
        if (!goal.deadline) return 'Brak ustalonego terminu.';
        
        const deadline = new Date(goal.deadline);
        const now = new Date();
        const totalTime = deadline - new Date(goal.createdAt || goal.startDate || now);
        const remainingTime = deadline - now;
        const elapsedTime = totalTime - remainingTime;
        
        const timeProgress = totalTime > 0 ? (elapsedTime / totalTime) * 100 : 0;
        const goalProgress = goal.progress || 0;
        
        if (goalProgress > timeProgress + 10) {
            return 'Jesteś wyprzedzony w stosunku do harmonogramu!';
        } else if (goalProgress < timeProgress - 10) {
            return 'Jesteś nieco opóźniony - czas przyspieszyć!';
        } else {
            return 'Jesteś dokładnie na czas!';
        }
    }

    getProgressSuggestions(progress) {
        if (progress >= 80) {
            return [
                'Dociągnij do końca!',
                'Sprawdź ostatnie kroki',
                'Przygotuj celebrację'
            ];
        } else if (progress >= 50) {
            return [
                'Kontynuuj działania',
                'Sprawdź kamienie milowe',
                'Oceń postęp'
            ];
        } else {
            return [
                'Zaplanuj następne kroki',
                'Podziel cel na mniejsze części',
                'Ustaw przypomnienia'
            ];
        }
    }

    getAchievementText(achievement) {
        const texts = {
            'first_goal_completed': 'Ukończyłeś swój pierwszy cel!',
            'streak_7_days': 'Pracujesz konsekwentnie przez 7 dni!',
            'productivity_milestone': 'Osiągnąłeś nowy poziom produktywności!',
            'efficiency_expert': 'Zostałeś ekspertem efektywności!'
        };
        
        return texts[achievement.type] || `Osiągnięcie: ${achievement.name}`;
    }

    getImpactInfo(impact) {
        if (!impact) return '';
        
        let info = '';
        if (impact.tasksCompleted) info += `Ukończyłeś ${impact.tasksCompleted} zadań. `;
        if (impact.timesSaved) info += `Zaoszczędziłeś ${impact.timesSaved} godzin. `;
        if (impact.efficiencyGain) info += `Zwiększyłeś efektywność o ${impact.efficiencyGain}%. `;
        
        return info;
    }

    getNextChallenge(achievement) {
        const challenges = [
            'Czas na następny poziom!',
            'Jakie będzie Twoje następne wyzwanie?',
            'Gotowy na kolejny cel?',
            'Podnieś poprzeczkę jeszcze wyżej!'
        ];
        
        return challenges[Math.floor(Math.random() * challenges.length)];
    }

    getStreakInfo(achievement) {
        if (achievement.streak) {
            return `Seria ${achievement.streak} dni z rzędu!`;
        }
        return '';
    }

    getRecentProgress(goals) {
        // Simulate recent progress calculation
        const improvement = Math.floor(Math.random() * 15) + 5; // 5-20% improvement
        return { improvement };
    }

    getPersonalizedMotivation(context) {
        const hour = new Date().getHours();
        const motivations = {
            morning: 'Rozpocznij dzień z energią!',
            afternoon: 'Połowa dnia za Tobą - kontynuuj świetną pracę!',
            evening: 'Dobij dzień sukcesem!'
        };
        
        if (hour < 12) return motivations.morning;
        if (hour < 18) return motivations.afternoon;
        return motivations.evening;
    }

    getEncouragement(recentProgress) {
        if (recentProgress.improvement > 10) {
            return 'Robisz niesamowite postępy!';
        } else if (recentProgress.improvement > 5) {
            return 'Stały postęp to klucz do sukcesu!';
        }
        return 'Każdy krok ma znaczenie!';
    }

    getInspirationalQuote() {
        const quotes = [
            'Sukces to suma małych wysiłków powtarzanych dzień po dniu.',
            'Nie liczą się wielkie kroki, ale konsekwentne działanie.',
            'Twoje jedyne ograniczenie to Ty sam.',
            'Cel bez planu to tylko życzenie.',
            'Doskonałość to nawyk, nie przypadek.'
        ];
        
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    selectTemplate(templates, variant) {
        if (variant && variant.templateOverride) {
            return templates.find(t => t.id === variant.templateOverride) || templates[0];
        }
        
        const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const template of templates) {
            random -= template.weight;
            if (random <= 0) return template;
        }
        
        return templates[0];
    }
}

// Error Response Handler
class ErrorResponseHandler extends BaseResponseHandler {
    initializeTemplates() {
        this.templates.set('network', [
            {
                id: 'network_helpful',
                template: 'Mam problem z połączeniem. {suggestion} Spróbuj ponownie za chwilę.',
                weight: 0.7
            },
            {
                id: 'network_technical',
                template: 'Błąd sieci: {error}. {technicalSuggestion}',
                weight: 0.3
            }
        ]);

        this.templates.set('data', [
            {
                id: 'data_friendly',
                template: 'Nie mogę znaleźć tych informacji. {alternative} {suggestion}',
                weight: 0.8
            },
            {
                id: 'data_specific',
                template: 'Brak danych: {specificError}. {actionSuggestion}',
                weight: 0.2
            }
        ]);
    }

    async generateResponse(error, context, variant) {
        const errorType = this.categorizeError(error);
        const templates = this.templates.get(errorType) || this.templates.get('data');
        const template = this.selectTemplate(templates, variant);

        return this.generateErrorResponse(error, errorType, context, template);
    }

    generateErrorResponse(error, errorType, context, template) {
        const errorMessage = error.message || 'Nieznany błąd';
        const suggestion = this.getSuggestion(errorType, context);
        const alternative = this.getAlternative(errorType);
        const technicalSuggestion = this.getTechnicalSuggestion(errorType);
        const actionSuggestion = this.getActionSuggestion(errorType);

        const text = template.template
            .replace('{error}', errorMessage)
            .replace('{suggestion}', suggestion)
            .replace('{alternative}', alternative)
            .replace('{technicalSuggestion}', technicalSuggestion)
            .replace('{specificError}', errorMessage)
            .replace('{actionSuggestion}', actionSuggestion);

        return {
            text,
            isError: true,
            followUpSuggestions: this.getErrorSuggestions(errorType)
        };
    }

    categorizeError(error) {
        const message = error.message?.toLowerCase() || '';
        
        if (message.includes('network') || message.includes('connection') || message.includes('offline')) {
            return 'network';
        }
        if (message.includes('not found') || message.includes('empty') || message.includes('no data')) {
            return 'data';
        }
        if (message.includes('unauthorized') || message.includes('permission')) {
            return 'auth';
        }
        if (message.includes('timeout') || message.includes('slow')) {
            return 'performance';
        }
        
        return 'general';
    }

    getSuggestion(errorType, context) {
        const suggestions = {
            network: 'Sprawdź połączenie internetowe.',
            data: 'Spróbuj innego zapytania lub sprawdź filtry.',
            auth: 'Może musisz się ponownie zalogować.',
            performance: 'Serwer może być przeciążony.',
            general: 'Spróbuj ponownie za chwilę.'
        };
        
        return suggestions[errorType] || suggestions.general;
    }

    getAlternative(errorType) {
        const alternatives = {
            network: 'Mogę pokazać Ci dane z cache.',
            data: 'Mogę zamiast tego pokazać podsumowanie.',
            auth: 'Mogę pokazać publiczne informacje.',
            performance: 'Mogę pokazać podstawowe dane.',
            general: 'Mogę spróbować inaczej.'
        };
        
        return alternatives[errorType] || alternatives.general;
    }

    getTechnicalSuggestion(errorType) {
        const suggestions = {
            network: 'Sprawdź status sieci lub użyj danych mobilnych.',
            data: 'Sprawdź poprawność zapytania.',
            auth: 'Odśwież token autoryzacji.',
            performance: 'Spróbuj za kilka minut.',
            general: 'Sprawdź logi systemowe.'
        };
        
        return suggestions[errorType] || suggestions.general;
    }

    getActionSuggestion(errorType) {
        const suggestions = {
            network: 'Sprawdź połączenie i spróbuj ponownie.',
            data: 'Upewnij się, że dane istnieją.',
            auth: 'Zaloguj się ponownie.',
            performance: 'Poczekaj chwilę i spróbuj ponownie.',
            general: 'Skontaktuj się z pomocą techniczną.'
        };
        
        return suggestions[errorType] || suggestions.general;
    }

    getErrorSuggestions(errorType) {
        const suggestions = {
            network: [
                'Sprawdź połączenie',
                'Spróbuj ponownie',
                'Przejdź do trybu offline'
            ],
            data: [
                'Zmień zapytanie',
                'Sprawdź filtry',
                'Zobacz inne sekcje'
            ],
            auth: [
                'Zaloguj się ponownie',
                'Sprawdź uprawnienia',
                'Skontaktuj się z administratorem'
            ],
            performance: [
                'Spróbuj za chwilę',
                'Upewnij się o stabilności sieci',
                'Użyj prostszego zapytania'
            ],
            general: [
                'Spróbuj ponownie',
                'Zgłoś problem',
                'Zobacz pomoc'
            ]
        };
        
        return suggestions[errorType] || suggestions.general;
    }

    selectTemplate(templates, variant) {
        if (variant && variant.templateOverride) {
            return templates.find(t => t.id === variant.templateOverride) || templates[0];
        }
        
        const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const template of templates) {
            random -= template.weight;
            if (random <= 0) return template;
        }
        
        return templates[0];
    }
}

// Export all handlers
window.TaskResponseHandler = TaskResponseHandler;
window.ClientResponseHandler = ClientResponseHandler;
window.CalendarResponseHandler = CalendarResponseHandler;
window.GoalResponseHandler = GoalResponseHandler;
window.ErrorResponseHandler = ErrorResponseHandler;