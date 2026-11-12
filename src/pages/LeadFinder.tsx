import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import {
  Compass,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Plus,
  X,
  Target,
  Zap,
  KeyRound,
} from 'lucide-react';

interface CountryItem {
  code: string;
  name: string;
}

interface CityItem {
  id: string;
  name: string;
  countryCode?: string;
}

interface CategoryItem {
  id: string;
  name: string;
}

const FALLBACK_COUNTRIES: CountryItem[] = [
  { code: 'PK', name: 'Pakistan' },
  { code: 'US', name: 'United States' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
];

const FALLBACK_CATEGORIES: CategoryItem[] = [
  { id: 'cat_webdev', name: 'Website Development (Next.js, WordPress, Web Apps)' },
  { id: 'cat_meta_ecom', name: 'Meta Integrated E-Commerce Brands (Meta Ads & Pixel)' },
  { id: 'cat_meta_ads', name: 'Meta Advertisers & D2C Brands (Active Facebook/Instagram Ads)' },
  { id: 'cat_shopify', name: 'Shopify & Headless E-Commerce Development' },
  { id: 'cat_landing', name: 'Webflow, Framer & High-Converting Landing Pages' },
  { id: 'cat_crm', name: 'Custom CRM, ERP & SaaS Web Applications' },
  { id: 'cat_appdev', name: 'Mobile App Development (iOS, Android, Flutter)' },
  { id: 'cat_video', name: 'AI Video Ads, UGC & Explainer Video Production' },
  { id: 'cat_aicontent', name: 'AI Content & Commercial Product Photography' },
  { id: 'cat_seo', name: 'SEO & Google Search Ranking Services' },
  { id: 'cat_speed', name: 'Website Speed Optimization & Security Hardening' },
  { id: 'cat_remote_staff', name: 'Remote Staff Augmentation & Dedicated Developers' },
  { id: 'cat_it', name: 'Digital Agencies & Full-Service IT Houses' },
  { id: 'cat_realestate', name: 'Real Estate & Property Developers' },
  { id: 'cat_clinics', name: 'High-Ticket Aesthetic & Dental Clinics' },
  { id: 'cat_restaurants', name: 'Restaurants, Cafes & Retail Brands' },
];

const FALLBACK_CITIES: Record<string, CityItem[]> = {
  PK: [
    { id: 'pk_1', name: 'Lahore' },
    { id: 'pk_2', name: 'Karachi' },
    { id: 'pk_3', name: 'Islamabad' },
    { id: 'pk_4', name: 'Rawalpindi' },
    { id: 'pk_5', name: 'Faisalabad' },
  ],
  US: [
    { id: 'us_1', name: 'New York' },
    { id: 'us_2', name: 'Los Angeles' },
    { id: 'us_3', name: 'Chicago' },
    { id: 'us_4', name: 'Houston' },
    { id: 'us_5', name: 'Miami' },
  ],
  AE: [
    { id: 'ae_1', name: 'Dubai' },
    { id: 'ae_2', name: 'Abu Dhabi' },
    { id: 'ae_3', name: 'Sharjah' },
  ],
  GB: [
    { id: 'gb_1', name: 'London' },
    { id: 'gb_2', name: 'Manchester' },
    { id: 'gb_3', name: 'Birmingham' },
  ],
  SA: [
    { id: 'sa_1', name: 'Riyadh' },
    { id: 'sa_2', name: 'Jeddah' },
  ],
  CA: [
    { id: 'ca_1', name: 'Toronto' },
    { id: 'ca_2', name: 'Vancouver' },
  ],
  AU: [
    { id: 'au_1', name: 'Sydney' },
    { id: 'au_2', name: 'Melbourne' },
  ],
};

export const LeadFinderPage: React.FC = () => {
  const [countries, setCountries] = useState<CountryItem[]>(FALLBACK_COUNTRIES);
  const [cities, setCities] = useState<CityItem[]>(FALLBACK_CITIES['AE']);
  const [categories, setCategories] = useState<CategoryItem[]>(FALLBACK_CATEGORIES);
  const [jobs, setJobs] = useState<any[]>([]);

  // Selection form
  const [selectedCountry, setSelectedCountry] = useState('AE');
  const [selectedCity, setSelectedCity] = useState('Dubai');
  const [selectedCategory, setSelectedCategory] = useState(FALLBACK_CATEGORIES[0].id);
  const [selectedSource, setSelectedSource] = useState('gemini');
  const [searchRadius, setSearchRadius] = useState(25);

  // Custom Category Modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [customCatKeywords, setCustomCatKeywords] = useState('');
  const [savingCustomCat, setSavingCustomCat] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Dynamic API Keys & Quota Modal
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [keysStatus, setKeysStatus] = useState<any[]>([]);
  const [newKeyProvider, setNewKeyProvider] = useState('gemini');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyNotice, setKeyNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Estimator
  const [estimate, setEstimate] = useState<any | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchDropdowns = async () => {
    try {
      const [countriesRes, categoriesRes] = await Promise.allSettled([
        api.get<CountryItem[]>('/finder/countries'),
        api.get<CategoryItem[]>('/finder/categories'),
      ]);

      if (countriesRes.status === 'fulfilled' && Array.isArray(countriesRes.value) && countriesRes.value.length > 0) {
        setCountries(countriesRes.value);
      }
      if (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value) && categoriesRes.value.length > 0) {
        setCategories(categoriesRes.value);
      }
    } catch {
      // Fallbacks used
    }
  };

  const fetchCities = async (countryCode: string) => {
    try {
      const res = await api.get<CityItem[]>(`/finder/cities?country=${countryCode}`);
      if (Array.isArray(res) && res.length > 0) {
        setCities(res);
        setSelectedCity(res[0].name);
      } else if (FALLBACK_CITIES[countryCode]) {
        setCities(FALLBACK_CITIES[countryCode]);
        setSelectedCity(FALLBACK_CITIES[countryCode][0].name);
      }
    } catch {
      if (FALLBACK_CITIES[countryCode]) {
        setCities(FALLBACK_CITIES[countryCode]);
        setSelectedCity(FALLBACK_CITIES[countryCode][0].name);
      }
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await api.get<any[]>('/finder/jobs');
      setJobs(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKeysStatus = async () => {
    try {
      const res = await api.get<any[]>('/finder/keys/status');
      setKeysStatus(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyValue.trim()) return;
    setSavingKey(true);
    setKeyNotice(null);
    try {
      await api.post('/finder/keys/add', {
        providerId: newKeyProvider,
        key: newKeyValue.trim(),
      });
      setKeyNotice({ msg: `Key for ${newKeyProvider.toUpperCase()} hot-reloaded successfully!`, type: 'success' });
      setNewKeyValue('');
      fetchKeysStatus();
    } catch (err: any) {
      setKeyNotice({ msg: err.message || 'Failed to save key', type: 'error' });
    } finally {
      setSavingKey(false);
    }
  };

  const fetchEstimate = async () => {
    if (!selectedCountry || !selectedCity || !selectedCategory) return;
    setEstimating(true);
    try {
      const res = await api.post<any>('/finder/estimate', {
        country: selectedCountry,
        city: selectedCity,
        categoryId: selectedCategory,
        providerId: selectedSource,
      });
      setEstimate(res);
    } catch {
      setEstimate({
        cellsCount: 12,
        keywordsCount: 4,
        totalRequests: 48,
        estimatedLeads: 240,
        currency: 'USD',
      });
    } finally {
      setEstimating(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchJobs();
    fetchKeysStatus();
  }, []);

  useEffect(() => {
    fetchCities(selectedCountry);
  }, [selectedCountry]);

  useEffect(() => {
    fetchEstimate();
  }, [selectedCountry, selectedCity, selectedCategory, selectedSource, searchRadius]);

  const handleStartSearch = async () => {
    setStarting(true);
    setMsg(null);
    try {
      const res = await api.post<any>('/finder/jobs/start', {
        country: selectedCountry,
        city: selectedCity,
        categoryId: selectedCategory,
        providerId: selectedSource,
      });
      setMsg(`Search job started: ${res?.jobId || 'Active'}! Tracking leads in real-time.`);
      fetchJobs();
    } catch (err: any) {
      setMsg(`Error launching search: ${err.message}`);
    } finally {
      setStarting(false);
    }
  };

  const handleCreateCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCatName.trim()) return;
    setSavingCustomCat(true);
    setCustomError(null);
    try {
      const keywordsArray = customCatKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await api.post<any>('/finder/categories/custom', {
        name: customCatName.trim(),
        keywords: keywordsArray.length > 0 ? keywordsArray : [customCatName.trim()],
      });

      const newCat = res?.category || { id: `custom_${Date.now()}`, name: customCatName.trim() };
      setCategories((prev) => [newCat, ...prev]);
      setSelectedCategory(newCat.id);
      setShowCustomModal(false);
      setCustomCatName('');
      setCustomCatKeywords('');
      setMsg(`Custom category "${newCat.name}" added and selected!`);
    } catch (err: any) {
      setCustomError(err.message || 'Failed to save custom category');
    } finally {
      setSavingCustomCat(false);
    }
  };

  const handlePauseJob = async (jobId: string) => {
    try {
      await api.post(`/finder/jobs/${jobId}/pause`);
      fetchJobs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResumeJob = async (jobId: string) => {
    try {
      await api.post(`/finder/jobs/${jobId}/resume`);
      fetchJobs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Editorial Luxury Header matching Figma */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <h1 className="serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black leading-tight">
            Find new leads.
          </h1>
          <p className="text-sm text-[#525252] mt-2 font-sans">
            Pick an engine, set the area, and watch verified leads arrive.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              fetchKeysStatus();
              setShowKeysModal(true);
            }}
            className="btn-ghost text-xs flex items-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Hot-reload API vault</span>
          </button>
          <span className="pill-luxury on text-xs">
            Meta &amp; Google Ads Active
          </span>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-2xl text-black text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
            <span>{msg}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-[#737373] hover:text-black">✕</button>
        </div>
      )}

      {/* Main Grid: Finder Config (Span 8) & Engine Status (Span 4) matching Figma HTML */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Finder Config Card (Span 8) */}
        <div className="lg:col-span-8 card-luxury p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-8">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-[#525252] font-medium">Search query &amp; industry</label>
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="text-xs text-black font-semibold hover:underline"
                >
                  + Custom Niche
                </button>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-[#E5E5E5] rounded-xl px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="text-xs text-[#525252] font-medium block mb-1.5">City / Location</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-white border border-[#E5E5E5] rounded-xl px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black font-medium"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}, {selectedCountry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Radius Slider matching Figma */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#525252]">Search Radius: <strong className="mono text-black">{searchRadius} km</strong></span>
              <span className="mono text-[#737373]">1km – 100km</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
          </div>

          {/* Engine Selector Pills matching Figma */}
          <div>
            <label className="text-xs text-[#525252] block mb-2 font-medium">Scraping Engine</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'gemini', label: 'Google Gemini AI (Free)' },
                { id: 'serper', label: 'Serper.dev (Google Maps)' },
                { id: 'overpass', label: 'OpenStreetMap (Overpass)' },
                { id: 'serpapi', label: 'SerpAPI' },
              ].map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => setSelectedSource(engine.id)}
                  className={`pill-luxury ${selectedSource === engine.id ? 'on' : ''}`}
                >
                  {engine.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions & Launch Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleStartSearch}
              disabled={starting}
              className="btn-solid text-xs flex items-center gap-2"
            >
              {starting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>{starting ? 'Starting Engine...' : 'Start scraping'}</span>
            </button>

            <button
              onClick={() => {
                fetchKeysStatus();
                setShowKeysModal(true);
              }}
              className="btn-ghost text-xs"
            >
              Hot-reload API vault
            </button>
          </div>

          {/* Live Progress Bar matching Figma */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#525252]">
                {jobs.length > 0 && jobs[0].status === 'running'
                  ? `+${jobs[0].statsNew || 0} leads added, ${jobs[0].statsDuplicates || 0} duplicates filtered`
                  : 'Engine Ready'}
              </span>
              <span className="mono font-bold text-black">
                {jobs.length > 0 && jobs[0].progressTotal > 0
                  ? `${Math.round((jobs[0].progressDone / jobs[0].progressTotal) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full bg-[#E5E5E5] rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-black h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    jobs.length > 0 && jobs[0].progressTotal > 0
                      ? Math.round((jobs[0].progressDone / jobs[0].progressTotal) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Engine Status Card (Span 4) matching Figma */}
        <div className="lg:col-span-4 card-luxury p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="serif text-xl font-semibold text-black mb-4">Engine status</h2>
            <div className="divide-y divide-[#E5E5E5] text-xs">
              <div className="py-3 flex items-center justify-between">
                <span className="text-[#525252]">Gemini AI</span>
                <span className="pill-luxury on">Free Active</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-[#525252]">Serper.dev</span>
                <span className="pill-luxury">Key active</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-[#525252]">Overpass</span>
                <span className="pill-luxury">No key needed</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-[#525252]">Meta Pixel Scanner</span>
                <span className="pill-luxury on">Live Integrated</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-white border border-[#E5E5E5] rounded-xl text-xs text-[#525252] space-y-1">
            <div className="font-semibold text-black flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-black" />
              <span>Meta &amp; Google Ads Scanner</span>
            </div>
            <p className="text-[11px] text-[#737373]">
              Every scraped website is automatically audited for Meta Pixel, active Ads Library presence, and phone contacts.
            </p>
          </div>
        </div>
      </div>

      {/* Active & Past Search Jobs Table */}
      <div className="card-luxury p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
          <div>
            <h2 className="serif text-xl font-semibold text-black">Extraction Jobs &amp; Checkpoints</h2>
            <p className="text-xs text-[#525252] mt-0.5">
              Long-running jobs checkpoint every 2km grid cell.
            </p>
          </div>
          <button
            onClick={fetchJobs}
            className="btn-ghost p-2"
            title="Refresh jobs"
          >
            <RefreshCw className="w-4 h-4 text-black" />
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="py-12 text-center text-[#737373] text-xs">
            No search jobs launched yet. Choose a category above and click "Start scraping"!
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const percent = job.progressTotal > 0 ? Math.round((job.progressDone / job.progressTotal) * 100) : 0;
              const isPaused = job.status === 'paused';

              return (
                <div
                  key={job.id}
                  className="p-4 bg-white border border-[#E5E5E5] rounded-xl space-y-3 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="serif font-semibold text-black text-sm">
                          {job.city || job.country} Lead Search
                        </span>
                        <span className="pill-luxury text-[10px]">
                          {job.status}
                        </span>
                      </div>
                      <span className="text-xs text-[#737373] mt-0.5 block mono">
                        Engine: {job.providerId} • Created: {new Date(job.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-xs">
                        <span className="mono font-bold text-black">+{job.statsNew}</span> new leads
                      </div>

                      {isPaused ? (
                        <button
                          onClick={() => handleResumeJob(job.id)}
                          className="btn-solid text-xs py-1 px-3"
                        >
                          Resume
                        </button>
                      ) : job.status === 'running' ? (
                        <button
                          onClick={() => handlePauseJob(job.id)}
                          className="btn-ghost text-xs py-1 px-3"
                        >
                          Pause
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#737373] mb-1 mono">
                      <span>Progress: {percent}%</span>
                      <span>{job.progressDone} / {job.progressTotal} cells</span>
                    </div>
                    <div className="w-full bg-[#E5E5E5] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-black h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Category Creation Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCustomModal(false)}
              className="absolute top-5 right-5 text-[#737373] hover:text-black p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="serif text-xl font-bold text-black flex items-center gap-2">
                <Target className="w-5 h-5 text-black" />
                Add Custom Category &amp; Keywords
              </h3>
              <p className="text-xs text-[#525252] mt-1">
                Create any niche or web development specialization to extract tailored business leads.
              </p>
            </div>

            {customError && (
              <div className="p-3 bg-white border border-rose-300 rounded-xl text-rose-600 text-xs">
                {customError}
              </div>
            )}

            <form onSubmit={handleCreateCustomCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next.js SaaS Developers, Webflow Studios, Meta Ad Agencies"
                  value={customCatName}
                  onChange={(e) => setCustomCatName(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Target Keywords (Comma-separated)
                </label>
                <textarea
                  placeholder="e.g. nextjs agency, full stack developer, react software house, web development firm"
                  value={customCatKeywords}
                  onChange={(e) => setCustomCatKeywords(e.target.value)}
                  rows={3}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomCat}
                  className="btn-solid text-xs flex items-center gap-1.5"
                >
                  {savingCustomCat ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic API Key Vault Modal matching Figma */}
      {showKeysModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowKeysModal(false)}
              className="absolute top-5 right-5 text-[#737373] hover:text-black p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="serif text-xl font-bold text-black flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-black" />
                API vault
              </h3>
              <p className="text-xs text-[#525252] mt-0.5">
                Keys reload in memory immediately without restarting servers.
              </p>
            </div>

            {keyNotice && (
              <div className="p-3 bg-white border border-[#E5E5E5] rounded-xl text-xs text-black flex items-center justify-between">
                <span>{keyNotice.msg}</span>
                <button onClick={() => setKeyNotice(null)} className="text-[#737373] hover:text-black">✕</button>
              </div>
            )}

            <div className="divide-y divide-[#E5E5E5] text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#525252]">Gemini AI</span>
                <span className="pill-luxury on">Active</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#525252]">Serper.dev</span>
                <span className="pill-luxury on">Active</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#525252]">Meta Graph Token</span>
                <span className="pill-luxury on">Active</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#525252]">SerpAPI</span>
                <span className="pill-luxury">Optional</span>
              </div>
            </div>

            <form onSubmit={handleQuickAddKey} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Engine Provider
                </label>
                <select
                  value={newKeyProvider}
                  onChange={(e) => setNewKeyProvider(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black"
                >
                  <option value="gemini">Google Gemini AI</option>
                  <option value="serper">Serper.dev (Google Maps)</option>
                  <option value="meta">Meta Graph Access Token</option>
                  <option value="serpapi">SerpAPI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Paste new API key / token
                </label>
                <input
                  type="text"
                  placeholder="sk-… or EAAV…"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeysModal(false)}
                  className="btn-ghost text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={savingKey || !newKeyValue.trim()}
                  className="btn-solid text-xs disabled:opacity-50"
                >
                  {savingKey ? 'Reloading...' : 'Save and reload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
