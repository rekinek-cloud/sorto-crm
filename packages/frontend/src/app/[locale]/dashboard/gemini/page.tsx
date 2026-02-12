'use client';

import { useState, useRef } from 'react';
import {
  Image,
  FileText,
  MessageSquare,
  Sparkles,
  Archive,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import gemini, { CacheInfo, ImageTags } from '@/lib/api/gemini';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

type TabType = 'vision' | 'ocr' | 'cache' | 'chat';

export default function GeminiPage() {
  const [activeTab, setActiveTab] = useState<TabType>('vision');
  const [isLoading, setIsLoading] = useState(false);

  // Vision state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('');
  const [visionResult, setVisionResult] = useState<string | null>(null);
  const [imageTags, setImageTags] = useState<ImageTags | null>(null);

  // OCR state
  const [ocrImage, setOcrImage] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState('polski');
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  // Cache state
  const [caches, setCaches] = useState<CacheInfo[]>([]);
  const [cacheName, setCacheName] = useState('');
  const [cacheDocuments, setCacheDocuments] = useState('');
  const [cacheQuestion, setCacheQuestion] = useState('');
  const [cacheAnswer, setCacheAnswer] = useState<string | null>(null);
  const [selectedCache, setSelectedCache] = useState<string | null>(null);

  // Chat state
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  // Vision handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setVisionResult(null);
      setImageTags(null);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    try {
      const result = await gemini.analyzeImage(selectedImage, visionPrompt || undefined);
      setVisionResult(result);
    } catch (error) {
      toast.error('Blad podczas analizy obrazu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoTag = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    try {
      const tags = await gemini.autoTagImage(selectedImage);
      setImageTags(tags);
    } catch (error) {
      toast.error('Blad podczas tagowania');
    } finally {
      setIsLoading(false);
    }
  };

  // OCR handlers
  const handleOcrImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOcrImage(file);
      setOcrPreview(URL.createObjectURL(file));
      setOcrResult(null);
    }
  };

  const handleOcr = async () => {
    if (!ocrImage) return;
    setIsLoading(true);
    try {
      const text = await gemini.ocr(ocrImage, ocrLanguage);
      setOcrResult(text);
    } catch (error) {
      toast.error('Blad podczas OCR');
    } finally {
      setIsLoading(false);
    }
  };

  // Cache handlers
  const loadCaches = async () => {
    try {
      const data = await gemini.listCaches();
      setCaches(data);
    } catch (error) {
      console.error('Failed to load caches:', error);
    }
  };

  const handleCreateCache = async () => {
    if (!cacheName || !cacheDocuments) {
      toast.error('Podaj nazwe i dokumenty');
      return;
    }
    setIsLoading(true);
    try {
      // Parse documents (each line is a document)
      const docs = cacheDocuments.split('\n---\n').map((doc, i) => ({
        name: `Document ${i + 1}`,
        content: doc.trim(),
      }));

      await gemini.createCache(cacheName, docs, 3600);
      toast.success('Cache utworzony (1h)');
      setCacheName('');
      setCacheDocuments('');
      loadCaches();
    } catch (error) {
      toast.error('Blad podczas tworzenia cache');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryCache = async () => {
    if (!selectedCache || !cacheQuestion) {
      toast.error('Wybierz cache i wpisz pytanie');
      return;
    }
    setIsLoading(true);
    try {
      const answer = await gemini.queryWithCache(selectedCache, cacheQuestion);
      setCacheAnswer(answer);
    } catch (error) {
      toast.error('Blad podczas zapytania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCache = async (name: string) => {
    if (!confirm('Usunac cache?')) return;
    try {
      await gemini.deleteCache(name);
      toast.success('Cache usuniety');
      loadCaches();
    } catch (error) {
      toast.error('Blad podczas usuwania');
    }
  };

  // Chat handlers
  const handleChat = async () => {
    if (!chatPrompt.trim()) return;
    setIsLoading(true);
    try {
      const response = await gemini.chat(chatPrompt);
      setChatResponse(response);
    } catch (error) {
      toast.error('Blad podczas czatu');
    } finally {
      setIsLoading(false);
    }
  };

  const tabItems: { id: TabType; name: string; icon: typeof Image }[] = [
    { id: 'vision', name: 'Vision', icon: Image },
    { id: 'ocr', name: 'OCR', icon: FileText },
    { id: 'cache', name: 'Cache (90% taniej)', icon: Archive },
    { id: 'chat', name: 'Chat', icon: MessageSquare },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Gemini AI"
        subtitle="Vision, Cache 90% taniej, 1M kontekst"
        icon={Sparkles}
        iconColor="text-purple-600"
      />

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {tabItems.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'cache') loadCaches();
                }}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <TabIcon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Vision Tab */}
      {activeTab === 'vision' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Analiza obrazu</h2>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded" />
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500" />
                  <p className="mt-2 text-slate-500 dark:text-slate-400">Kliknij aby wybrac obraz</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <div className="mt-4">
              <input
                type="text"
                value={visionPrompt}
                onChange={(e) => setVisionPrompt(e.target.value)}
                placeholder="Opcjonalnie: Co chcesz wiedziec o obrazie?"
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-4 py-2"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAnalyzeImage}
                disabled={!selectedImage || isLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Analizuje...' : 'Analizuj'}
              </button>
              <button
                onClick={handleAutoTag}
                disabled={!selectedImage || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Auto-tagi
              </button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Wynik</h2>

            {visionResult && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{visionResult}</p>
              </div>
            )}

            {imageTags && (
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tagi:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {imageTags.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Kategoria:</span>
                  <span className="ml-2 text-slate-900 dark:text-slate-100">{imageTags.category}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Opis:</span>
                  <p className="text-slate-700 dark:text-slate-300">{imageTags.description}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Nastroj:</span>
                  <span className="ml-2 text-slate-900 dark:text-slate-100">{imageTags.mood}</span>
                </div>
                {imageTags.people && (
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Osoby:</span>
                    <span className="ml-2 text-slate-900 dark:text-slate-100">{imageTags.facesCount} twarzy</span>
                  </div>
                )}
              </div>
            )}

            {!visionResult && !imageTags && (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">Wyslij obraz do analizy</p>
            )}
          </div>
        </div>
      )}

      {/* OCR Tab */}
      {activeTab === 'ocr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">OCR - Rozpoznawanie tekstu</h2>

            <div
              onClick={() => ocrFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
            >
              {ocrPreview ? (
                <img src={ocrPreview} alt="OCR Preview" className="max-h-64 mx-auto rounded" />
              ) : (
                <>
                  <FileText className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500" />
                  <p className="mt-2 text-slate-500 dark:text-slate-400">Kliknij aby wybrac dokument/zdjecie</p>
                </>
              )}
            </div>
            <input
              ref={ocrFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleOcrImageSelect}
              className="hidden"
            />

            <div className="mt-4">
              <select
                value={ocrLanguage}
                onChange={(e) => setOcrLanguage(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-4 py-2"
              >
                <option value="polski">Polski</option>
                <option value="angielski">Angielski</option>
                <option value="niemiecki">Niemiecki</option>
              </select>
            </div>

            <button
              onClick={handleOcr}
              disabled={!ocrImage || isLoading}
              className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Rozpoznaje...' : 'Rozpoznaj tekst'}
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Rozpoznany tekst</h2>

            {ocrResult ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">{ocrResult}</pre>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">Wyslij obraz do rozpoznania</p>
            )}
          </div>
        </div>
      )}

      {/* Cache Tab */}
      {activeTab === 'cache' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Utworz cache RAG</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Zaladuj dokumenty raz, pytaj wiele razy - 90% taniej!
              </p>

              <div className="space-y-4">
                <input
                  type="text"
                  value={cacheName}
                  onChange={(e) => setCacheName(e.target.value)}
                  placeholder="Nazwa cache (np. dokumentacja-api)"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-4 py-2"
                />

                <textarea
                  value={cacheDocuments}
                  onChange={(e) => setCacheDocuments(e.target.value)}
                  placeholder="Wklej dokumenty (oddziel ---)"
                  rows={8}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-4 py-2"
                />

                <button
                  onClick={handleCreateCache}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isLoading ? 'Tworze...' : 'Utworz cache (1h)'}
                </button>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Aktywne cache ({caches.length})</h2>

              {caches.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">Brak aktywnych cache</p>
              ) : (
                <div className="space-y-2">
                  {caches.map((cache) => (
                    <div
                      key={cache.cacheName}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                        selectedCache === cache.displayName
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                      onClick={() => setSelectedCache(cache.displayName)}
                    >
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{cache.displayName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                          wygasa: {new Date(cache.expireTime).toLocaleTimeString()}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCache(cache.cacheName);
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Zapytaj cache (90% taniej!)</h2>

            <div className="space-y-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Wybrany cache:{' '}
                <span className="font-medium text-purple-600 dark:text-purple-400">{selectedCache || 'brak'}</span>
              </div>

              <input
                type="text"
                value={cacheQuestion}
                onChange={(e) => setCacheQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQueryCache()}
                placeholder="Zadaj pytanie..."
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-4 py-2"
              />

              <button
                onClick={handleQueryCache}
                disabled={!selectedCache || !cacheQuestion || isLoading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Pytam...' : 'Zapytaj (90% taniej)'}
              </button>

              {cacheAnswer && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Odpowiedz:</h4>
                  <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{cacheAnswer}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mt-6">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Chat z Gemini</h2>

          <div className="space-y-4">
            <textarea
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Napisz wiadomosc..."
              rows={4}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-4 py-2"
            />

            <button
              onClick={handleChat}
              disabled={!chatPrompt.trim() || isLoading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Generuje...' : 'Wyslij'}
            </button>

            {chatResponse && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Odpowiedz:</h4>
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{chatResponse}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
