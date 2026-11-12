import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Plus,
  X,
  Target,
  Zap,
  Radio,
  Search,
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
  const [cities, setCities] = useState<CityItem[]>(FALLBACK_CITIES['PK']);
  const [categories, setCategories] = useState<CategoryItem[]>(FALLBACK_CATEGORIES);
  const [jobs, setJobs] = useState<any[]>([]);

  // Selection form
  const [selectedCountry, setSelectedCountry] = useState('PK');
  const [selectedCity, setSelectedCity] = useState('Lahore');
  const [selectedCategory, setSelectedCategory] = useState(FALLBACK_CATEGORIES[0].id);
  const [selectedSource, setSelectedSource] = useState('auto');

  // Custom Category Modal State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [customCatKeywords, setCustomCatKeywords] = useState('');
  const [savingCustomCat, setSavingCustomCat] = useState(false);
  const [customError, setCustomError] = useState('');

  // Estimate
  const [estimate, setEstimate] = useState<any | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchDropdowns = async () => {
    try {
      const [countriesRes, categoriesRes] = await Promise.all([
        api.get<any>('/geo/countries').catch(() => []),
        api.get<any>('/categories').catch(() => []),
      ]);
      const cList = Array.isArray(countriesRes?.data)
        ? countriesRes.data
        : Array.isArray(countriesRes) && countriesRes.length > 0
        ? countriesRes
        : FALLBACK_COUNTRIES;

      const catList = Array.isArray(categoriesRes?.data)
        ? categoriesRes.data
        : Array.isArray(categoriesRes) && categoriesRes.length > 0
        ? categoriesRes
        : FALLBACK_CATEGORIES;

      setCountries(cList);
      setCategories(catList);

      if (cList.length > 0) {
        setSelectedCountry((prev) => (cList.some((c: any) => c.code === prev) ? prev : cList[0].code));
      }
      if (catList.length > 0) {
        setSelectedCategory((prev) => (catList.some((c: any) => c.id === prev) ? prev : catList[0].id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCities = async (countryCode: string) => {
    try {
      const data = await api.get<CityItem[]>(`/geo/cities?country=${countryCode}`).catch(() => []);
      const cityList = Array.isArray(data) && data.length > 0 ? data : (FALLBACK_CITIES[countryCode] || FALLBACK_CITIES['PK']);
      setCities(cityList);
      if (cityList.length > 0) setSelectedCity(cityList[0].name);
      else setSelectedCity('');
    } catch (err) {
      console.error(err);
      const fallback = FALLBACK_CITIES[countryCode] || FALLBACK_CITIES['PK'];
      setCities(fallback);
      if (fallback.length > 0) setSelectedCity(fallback[0].name);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await api.get<any[]>('/finder/jobs');
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchJobs();
    const interval = setInterval(fetchJobs, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchCities(selectedCountry);
    }
  }, [selectedCountry]);

  // Update estimate whenever selections change
  useEffect(() => {
    if (!selectedCategory) return;
    const fetchEstimate = async () => {
      setEstimating(true);
      try {
        const est = await api.post('/finder/estimate', {
          country: selectedCountry,
          city: selectedCity,
          categoryId: selectedCategory,
          providerId: selectedSource,
        });
        setEstimate(est);
      } catch (err) {
        // ignore
      } finally {
        setEstimating(false);
      }
    };
    fetchEstimate();
  }, [selectedCountry, selectedCity, selectedCategory, selectedSource]);

  const handleStartSearch = async () => {
    if (!selectedCategory) {
      alert('Please select an Industry / Category before starting lead extraction.');
      return;
    }
    setStarting(true);
    setMsg(null);
    try {
      await api.post('/finder/jobs', {
        country: selectedCountry,
        city: selectedCity,
        categoryId: selectedCategory,
        providerId: selectedSource,
      });
      setMsg(`Search job started for ${selectedCity || selectedCountry}! Auto-detecting Meta Integration & Ads.`);
      fetchJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to start job');
    } finally {
      setStarting(false);
    }
  };

  const handleCreateCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCatName.trim()) {
      setCustomError('Please enter a category name');
      return;
    }

    setSavingCustomCat(true);
    setCustomError('');

    try {
      const res = await api.post<any>('/categories', {
        name: customCatName.trim(),
        keywords: customCatKeywords.trim() || customCatName.trim(),
      });

      const newCat = res?.data || res;
      if (newCat?.id) {
        setCategories((prev) => [newCat, ...prev]);
        setSelectedCategory(newCat.id);
      }

      setShowCustomModal(false);
      setCustomCatName('');
      setCustomCatKeywords('');
      setMsg(`Custom category "${newCat.name}" added and selected!`);
      fetchDropdowns();
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Compass className="w-7 h-7 text-emerald-400" />
            Global Lead Finder &amp; Meta Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Scrape Google Maps &amp; direct businesses across 2km grid cells with auto Meta Pixel, Ads &amp; Email detection
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
            Meta Pixel &amp; Ads Detection Active
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Multi-Engine Failover
          </span>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{msg}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-emerald-400 hover:text-white px-2">✕</button>
        </div>
      )}

      {/* Criteria & Estimator Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Target Location &amp; Category
            </h2>
            <button
              onClick={() => setShowCustomModal(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Custom Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Target Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {countries.length === 0 && (
                  <option value="">Loading countries...</option>
                )}
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                City / Metropolitan Area
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {cities.length === 0 && (
                  <option value="">Loading cities...</option>
                )}
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase text-slate-400">
                  Industry / Category
                </label>
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Create Custom
                </button>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                {categories.length === 0 && (
                  <option value="">Loading categories...</option>
                )}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Scraping Engine
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="auto">Auto (Google Places ➔ Serper ➔ SerpAPI ➔ Apify ➔ Overpass)</option>
                <option value="google_places">Google Places API Only</option>
                <option value="serper">Serper.dev (Google Maps Fast) Only</option>
                <option value="serpapi">SerpAPI (Google Maps) Only</option>
                <option value="apify">Apify Scraper Only</option>
                <option value="overpass">OpenStreetMap (Overpass - Free) Only</option>
              </select>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Meta Pixel &amp; Ads Engine Included:</span>{' '}
              Extracted websites are automatically scanned for Meta Pixel, Instagram &amp; Facebook pages, and tagged with active ad status for instant cold outreach.
            </div>
          </div>
        </div>

        {/* Live Cost & Grid Estimate Panel */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Live Cost &amp; Grid Estimate
              </span>
              {estimating && (
                <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>GeoGrid Cells (2km):</span>
                <span className="text-white font-mono font-bold">
                  {estimate?.cellsCount || 1} cells
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Keywords Checked:</span>
                <span className="text-white font-mono font-bold">
                  {estimate?.keywordsCount || 1}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>API Requests:</span>
                <span className="text-white font-mono font-bold">
                  {estimate?.totalRequests || 1} calls
                </span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2 font-semibold">
                <span className="text-slate-200">Expected Leads:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  ~{estimate?.estimatedLeads || '100+'} leads
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartSearch}
            disabled={starting || !selectedCategory}
            className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/30 disabled:opacity-50"
          >
            {starting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Lead Extraction</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Custom Category Creation Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowCustomModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Add Custom Category &amp; Keywords
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Create any niche or web development specialization to extract tailored business leads.
              </p>
            </div>

            {customError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                {customError}
              </div>
            )}

            <form onSubmit={handleCreateCustomCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next.js SaaS Developers, Webflow Studios, Meta Ad Agencies"
                  value={customCatName}
                  onChange={(e) => setCustomCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Keywords (Comma-separated)
                </label>
                <textarea
                  placeholder="e.g. nextjs agency, full stack developer, react software house, web development firm"
                  value={customCatKeywords}
                  onChange={(e) => setCustomCatKeywords(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Our GeoGrid engine will query Google Maps &amp; web registries using each keyword.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomCat}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-emerald-900/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingCustomCat ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save &amp; Select Category</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active & Past Search Jobs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Extraction Jobs &amp; Checkpoints</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Long-running jobs survive network disruptions and checkpoint every 2km grid cell.
            </p>
          </div>
          <button
            onClick={fetchJobs}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
            title="Refresh jobs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No search jobs launched yet. Choose a city and category above to start!
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {jobs.map((job) => {
              const percent = job.progressTotal > 0 ? Math.round((job.progressDone / job.progressTotal) * 100) : 0;
              const isPaused = job.status === 'paused';

              return (
                <div
                  key={job.id}
                  className={`p-4 rounded-xl border transition ${
                    isPaused
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  {isPaused && (
                    <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>{job.pausedReason || 'All keys failed. Job paused at checkpoint.'}</span>
                      </div>
                      <NavLink
                        to="/console/integrations"
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px] ml-2 flex-shrink-0"
                      >
                        Add Keys in Console
                      </NavLink>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {job.city || job.country} Lead Search
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            job.status === 'running'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isPaused
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : job.status === 'done'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        Engine: {job.providerId} • Created: {new Date(job.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900">
                      <div className="text-left sm:text-right text-xs">
                        <div className="text-slate-300 font-semibold">
                          <span className="text-emerald-400 font-bold font-mono">+{job.statsNew}</span> new leads
                        </div>
                        <span className="text-slate-500 text-[11px]">
                          {job.statsDuplicates} duplicates filtered
                        </span>
                      </div>

                      {isPaused ? (
                        <button
                          onClick={() => handleResumeJob(job.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </button>
                      ) : job.status === 'running' ? (
                        <button
                          onClick={() => handlePauseJob(job.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 rounded-lg text-xs font-medium flex items-center gap-1.5"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono">
                      <span>Progress: {percent}%</span>
                      <span>
                        {job.progressDone} / {job.progressTotal} cells completed
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
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
    </div>
  );
};
