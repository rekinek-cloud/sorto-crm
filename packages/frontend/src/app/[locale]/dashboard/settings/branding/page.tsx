'use client';

import React, { useState, useEffect } from 'react';
import { PaintBrushIcon, PhotoIcon, CheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Branding {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  companyName: string | null;
  tagline: string | null;
  footerText: string | null;
  customDomain: string | null;
  emailFromName: string | null;
  emailSignature: string | null;
}

const defaultBranding: Branding = {
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#6366F1',
  secondaryColor: '#8B5CF6',
  accentColor: '#10B981',
  companyName: null,
  tagline: null,
  footerText: null,
  customDomain: null,
  emailFromName: null,
  emailSignature: null,
};

const presetColors = [
  { name: 'Indigo', primary: '#6366F1', secondary: '#8B5CF6', accent: '#10B981' },
  { name: 'Blue', primary: '#3B82F6', secondary: '#60A5FA', accent: '#F59E0B' },
  { name: 'Green', primary: '#10B981', secondary: '#34D399', accent: '#6366F1' },
  { name: 'Purple', primary: '#8B5CF6', secondary: '#A78BFA', accent: '#EC4899' },
  { name: 'Red', primary: '#EF4444', secondary: '#F87171', accent: '#3B82F6' },
  { name: 'Orange', primary: '#F59E0B', secondary: '#FBBF24', accent: '#8B5CF6' },
];

export default function BrandingPage() {
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const token = Cookies.get('access_token');
      const response = await fetch(`${API_URL}/branding`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBranding({ ...defaultBranding, ...data.branding });
      }
    } catch (error) {
      console.error('Failed to load branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = Cookies.get('access_token');
      const response = await fetch(`${API_URL}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(branding),
      });

      if (response.ok) {
        toast.success('Branding zapisany pomyslnie');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Blad zapisu');
      }
    } catch (error) {
      toast.error('Nie udalo sie zapisac brandingu');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof presetColors[0]) => {
    setBranding({
      ...branding,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-100 rounded-lg">
          <PaintBrushIcon className="h-6 w-6 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
          <p className="text-sm text-gray-600">Personalizuj wyglad aplikacji</p>
        </div>
      </div>

      {/* Color Presets */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Predefiniowane schematy</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {presetColors.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-3 rounded-xl border-2 border-gray-200 hover:border-gray-400 transition-colors"
            >
              <div className="flex gap-1 mb-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
              </div>
              <div className="text-xs font-medium text-gray-700">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kolory</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kolor glowny</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kolor dodatkowy</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kolor akcentu</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.accentColor}
                onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={branding.accentColor}
                onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logo & Identity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tozsamosc</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa firmy</label>
            <input
              type="text"
              value={branding.companyName || ''}
              onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Moja Firma"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slogan</label>
            <input
              type="text"
              value={branding.tagline || ''}
              onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Twoj slogan tutaj"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL Logo</label>
            <input
              type="url"
              value={branding.logoUrl || ''}
              onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL Favicon</label>
            <input
              type="url"
              value={branding.faviconUrl || ''}
              onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Email Branding */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Branding email</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa nadawcy</label>
            <input
              type="text"
              value={branding.emailFromName || ''}
              onChange={(e) => setBranding({ ...branding, emailFromName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Moja Firma"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stopka email</label>
            <textarea
              value={branding.emailSignature || ''}
              onChange={(e) => setBranding({ ...branding, emailSignature: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Pozdrawiamy,&#10;Zespol Moja Firma"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Podglad</h2>
        <div className="p-4 rounded-lg" style={{ backgroundColor: `${branding.primaryColor}10` }}>
          <div className="flex items-center gap-3 mb-4">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" className="h-10" />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <PhotoIcon className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <div className="font-bold" style={{ color: branding.primaryColor }}>
                {branding.companyName || 'Nazwa Firmy'}
              </div>
              {branding.tagline && (
                <div className="text-sm text-gray-500">{branding.tagline}</div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Przycisk glowny
            </button>
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: branding.secondaryColor }}
            >
              Przycisk dodatkowy
            </button>
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: branding.accentColor }}
            >
              Akcent
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <CheckIcon className="h-5 w-5" />
          )}
          Zapisz zmiany
        </button>
      </div>
    </div>
  );
}
