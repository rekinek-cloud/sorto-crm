// Mock transcription service - simulates AI transcription
// In a real app, this would connect to services like OpenAI Whisper, Google Speech-to-Text, etc.

export interface TranscriptionResult {
  text: string;
  confidence: number;
  words: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
  speakers?: Array<{
    speaker: string;
    segments: Array<{
      text: string;
      startTime: number;
      endTime: number;
    }>;
  }>;
}

const SAMPLE_TRANSCRIPTIONS = [
  "Dzisiaj miałem bardzo produktywny dzień w pracy. Udało mi się ukończyć projekt nad którym pracowałem od tygodnia.",
  "Spotkanie z klientem przebiegło bardzo dobrze. Przedstawiliśmy nową propozycję i otrzymaliśmy pozytywną odpowiedź.",
  "Muszę pamiętać o kupnie mleka, chleba i jajek w drodze do domu. Dodatkowo trzeba będzie zadzwonić do dentysty.",
  "Podczas dzisiejszej prezentacji omówiliśmy strategię marketingową na kolejny kwartał. Zespół był bardzo zaangażowany.",
  "Pomysł na nową aplikację mobilną wydaje się bardzo obiecujący. Należy przygotować szczegółowy plan rozwoju."
];

const SAMPLE_WORDS = [
  { word: "dzisiaj", startTime: 0.1, endTime: 0.5, confidence: 0.95 },
  { word: "miałem", startTime: 0.6, endTime: 0.9, confidence: 0.92 },
  { word: "bardzo", startTime: 1.0, endTime: 1.3, confidence: 0.88 },
  { word: "produktywny", startTime: 1.4, endTime: 2.1, confidence: 0.94 },
  { word: "dzień", startTime: 2.2, endTime: 2.5, confidence: 0.96 }
];

export const transcribeAudio = async (_audioBlob: Blob): Promise<TranscriptionResult> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  const randomTranscription = SAMPLE_TRANSCRIPTIONS[Math.floor(Math.random() * SAMPLE_TRANSCRIPTIONS.length)];
  
  return {
    text: randomTranscription,
    confidence: 0.85 + Math.random() * 0.14, // Random confidence between 85-99%
    words: SAMPLE_WORDS,
    speakers: [
      {
        speaker: "Użytkownik",
        segments: [
          {
            text: randomTranscription,
            startTime: 0,
            endTime: 10
          }
        ]
      }
    ]
  };
};

export const generateSummary = async (_transcription: string): Promise<string> => {
  // Simulate AI summary generation
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const summaries = [
    "Produktywny dzień pracy z ukończeniem długoterminowego projektu.",
    "Pozytywne spotkanie z klientem i prezentacja nowej propozycji.",
    "Lista zakupów i przypomnienie o wizycie u dentysty.",
    "Strategia marketingowa na kolejny kwartał omówiona z zespołem.",
    "Nowy pomysł na aplikację mobilną wymaga szczegółowego planu."
  ];
  
  return summaries[Math.floor(Math.random() * summaries.length)];
};

export const extractKeywords = (text: string): string[] => {
  const commonWords = ['i', 'a', 'o', 'w', 'z', 'na', 'do', 'się', 'że', 'to', 'jest', 'być', 'mieć', 'który'];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 5);
};