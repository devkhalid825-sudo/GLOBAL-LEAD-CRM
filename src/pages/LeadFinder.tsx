import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import {
  Compass,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  Plus,
  X,
  Target,
  Zap,
  KeyRound,
} from 'lucide-react';
import { Card, Button, Input, Select, Textarea, Slider, Pill, Modal, Progress, Toast, EmptyState, Skeleton } from '../components/ui/index.js';

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
  { id: 'cat_webdev', name: 'Website development (Next.js, WordPress, Web Apps)' },
  { id: 'cat_meta_ecom', name: 'Meta integrated e-commerce brands (Meta Ads & Pixel)' },
  { id: 'cat_meta_ads', name: 'Meta advertisers & D2C brands (Active Facebook/Instagram Ads)' },
  { id: 'cat_shopify', name: 'Shopify & headless e-commerce development' },
  { id: 'cat_landing', name: 'Webflow, Framer & high-converting landing pages' },
  { id: 'cat_crm', name: 'Custom CRM, ERP & SaaS web applications' },
  { id: 'cat_appdev', name: 'Mobile app development (iOS, Android, Flutter)' },
  { id: 'cat_video', name: 'AI video ads, UGC & explainer video production' },
  { id: 'cat_aicontent', name: 'AI content & commercial product photography' },
  { id: 'cat_seo', name: 'SEO & Google Search ranking services' },
  { id: 'cat_speed', name: 'Website speed optimization & security hardening' },
  { id: 'cat_remote_staff', name: 'Remote staff augmentation & dedicated developers' },
  { id: 'cat_it', name: 'Digital agencies & full-service IT houses' },
  { id: 'cat_realestate', name: 'Real estate & property developers' },
  { id: 'cat_clinics', name: 'High-ticket aesthetic & dental clinics' },
  { id: 'cat_restaurants', name: 'Restaurants, cafes & retail brands' },
];

const FALLBACK_CITIES: Record<string, CityItem[]> = {
  PK: [
    { id: 'pk_1', name: 'Lahore' },
    { id: 'pk_2', name: 'Karachi' },
    { id: 'pk_3', name: 'Islamabad' },
  ],
  US: [
    { id: 'us_1', name: 'New York' },
    { id: 'us_2', name: 'Los Angeles' },
    { id: 'us_3', name: 'Chicago' },
  ],
  AE: [
    { id: 'ae_1', name: 'Dubai' },
    { id: 'ae_2', name: 'Abu Dhabi' },
    { id: 'ae_3', name: 'Sharjah' },
  ],
  GB: [
    { id: 'gb_1', name: 'London' },
    { id: 'gb_2', name: 'Manchester' },
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

  // Dynamic API Keys Modal
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [keysStatus, setKeysStatus] = useState<any[]>([]);
  const [newKeyProvider, setNewKeyProvider] = useState('gemini');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  // Search execution & feedback
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
    } catch {}
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
    try {
      await api.post('/finder/keys/add', {
        providerId: newKeyProvider,
        key: newKeyValue.trim(),
      });
      setNotice(`Key for ${newKeyProvider.toUpperCase()} hot-reloaded successfully.`);
      setNewKeyValue('');
      fetchKeysStatus();
    } catch (err: any) {
      setNotice(`Key reload failed: ${err.message || 'Error'}`);
    } finally {
      setSavingKey(false);
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

  const handleStartSearch = async () => {
    setStarting(true);
    try {
      const res = await api.post<any>('/finder/jobs/start', {
        country: selectedCountry,
        city: selectedCity,
        categoryId: selectedCategory,
        providerId: selectedSource,
      });
      setNotice(`Extraction job started: ${res?.jobId || 'Active'}`);
      fetchJobs();
    } catch (err: any) {
      setNotice(`Failed to start extraction: ${err.message}`);
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
      setNotice(`Custom category "${newCat.name}" saved.`);
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
      setNotice('Search job paused at checkpoint');
    } catch (err: any) {
      setNotice(err.message || 'Failed to pause');
    }
  };

  const handleResumeJob = async (jobId: string) => {
    try {
      await api.post(`/finder/jobs/${jobId}/resume`);
      fetchJobs();
      setNotice('Search job resumed');
    } catch (err: any) {
      setNotice(err.message || 'Failed to resume');
    }
  };

  // Active top job progress calculation
  const topJob = jobs.length > 0 ? jobs[0] : null;
  const progressPct = topJob && topJob.progressTotal > 0
    ? Math.round((topJob.progressDone / topJob.progressTotal) * 100)
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Editorial Luxury Header matching visual source */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tightest text-tx leading-tight">
            Find new leads.
          </h1>
          <p className="text-sm text-tx-muted mt-2 font-sans">
            Pick an engine, set the area, and watch verified leads arrive.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => {
              fetchKeysStatus();
              setShowKeysModal(true);
            }}
            size="sm"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1.5" />
            <span>Hot-reload API vault</span>
          </Button>
          <Pill active className="pointer-events-none text-xs">
            Meta &amp; Google Ads active
          </Pill>
        </div>
      </div>

      {/* Main Grid: Finder Config (Span 8) & Failover Monitor (Span 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Finder Search Form Card (Span 8) */}
        <div className="lg:col-span-8 card-luxury p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-8 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-tx-muted font-medium">Search query &amp; industry</label>
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="text-xs text-tx font-semibold hover:underline"
                >
                  + Custom niche
                </button>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-luxury text-xs py-2.5 font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs text-tx-muted font-medium block">City / Location</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="input-luxury text-xs py-2.5 font-medium"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}, {selectedCountry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GeoGrid Radius Range Slider matching Figma */}
          <Slider
            label={`Search radius: ${searchRadius} km`}
            valueDisplay={`${searchRadius} km`}
            min={1}
            max={100}
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
          />

          {/* Scraping Engine Selection Pills matching Figma */}
          <div className="space-y-2">
            <label className="text-xs text-tx-muted block font-medium">Scraping engine</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'gemini', label: 'Google Gemini AI (Free)' },
                { id: 'serper', label: 'Serper.dev (Google Maps)' },
                { id: 'overpass', label: 'OpenStreetMap (Overpass)' },
                { id: 'serpapi', label: 'SerpAPI' },
              ].map((engine) => (
                <Pill
                  key={engine.id}
                  active={selectedSource === engine.id}
                  onClick={() => setSelectedSource(engine.id)}
                  className="text-xs"
                >
                  {engine.label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Launch Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={handleStartSearch}
              loading={starting}
              size="md"
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
              <span>Start scraping</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                fetchKeysStatus();
                setShowKeysModal(true);
              }}
              size="md"
            >
              Hot-reload API vault
            </Button>
          </div>

          {/* Live Progress Bar matching Figma */}
          <div className="pt-2">
            <Progress
              value={progressPct}
              label={
                topJob && topJob.status === 'running'
                  ? `+${topJob.statsNew || 0} leads added, ${topJob.statsDuplicates || 0} duplicates filtered`
                  : 'Engine ready'
              }
              statusText={`${progressPct}%`}
            />
          </div>
        </div>

        {/* Engine Failover Monitor Card (Span 4) matching Figma */}
        <div className="lg:col-span-4 card-luxury p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="serif text-xl font-semibold text-tx mb-4">Engine status</h2>
            <div className="divide-y divide-border text-xs">
              <div className="py-3 flex items-center justify-between">
                <span className="text-tx-muted">Gemini AI</span>
                <Pill active className="pointer-events-none text-[11px]">Free active</Pill>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-tx-muted">Serper.dev</span>
                <Pill className="pointer-events-none text-[11px]">Key active</Pill>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-tx-muted">Overpass</span>
                <Pill className="pointer-events-none text-[11px]">No key needed</Pill>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-tx-muted">Meta Pixel scanner</span>
                <Pill active className="pointer-events-none text-[11px]">Live integrated</Pill>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-surface-2 border border-border rounded-btn text-xs text-tx-muted space-y-1">
            <div className="font-semibold text-tx flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-tx" />
              <span>Multi-provider failover active</span>
            </div>
            <p className="text-[11px] text-tx-subtle leading-relaxed">
              Automatic fallback routes queries across Gemini, Serper and OpenStreetMap to guarantee uninterrupted scraping.
            </p>
          </div>
        </div>
      </div>

      {/* Active & Checkpointed Search Jobs List */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="serif text-xl font-semibold text-tx">Extraction jobs &amp; checkpoints</h2>
            <p className="text-xs text-tx-muted mt-0.5">
              Long-running jobs checkpoint progress every 2km grid cell.
            </p>
          </div>
          <button
            onClick={fetchJobs}
            className="btn-ghost p-2"
            title="Refresh jobs"
            aria-label="Refresh jobs"
          >
            <RefreshCw className="w-4 h-4 text-tx" />
          </button>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            title="No extraction jobs launched yet"
            description="Choose an area and category above to start scraping verified leads."
          />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const percent = job.progressTotal > 0 ? Math.round((job.progressDone / job.progressTotal) * 100) : 0;
              const isPaused = job.status === 'paused';

              return (
                <div
                  key={job.id}
                  className="p-4 bg-surface-2 border border-border rounded-btn space-y-3"
                >
                  {/* Key Exhaustion / Paused Checkpoint Banner (Monochrome) */}
                  {isPaused && (
                    <div className="p-3 bg-surface-1 border border-border rounded-btn text-xs text-tx flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-tx flex-shrink-0" />
                        <span>{job.pausedReason || 'Quota reached or key rotated. Checkpoint saved.'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            fetchKeysStatus();
                            setShowKeysModal(true);
                          }}
                          size="sm"
                        >
                          Hot-swap key
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleResumeJob(job.id)}
                          size="sm"
                        >
                          Resume search
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="serif font-semibold text-tx text-sm">
                          {job.city || job.country} lead search
                        </span>
                        <Pill className="text-[10px] pointer-events-none">
                          {job.status}
                        </Pill>
                      </div>
                      <span className="text-xs text-tx-subtle mt-0.5 block mono">
                        Engine: {job.providerId} • Created: {new Date(job.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-xs">
                        <span className="mono font-bold text-tx">+{job.statsNew}</span> new leads
                      </div>

                      {isPaused ? (
                        <Button
                          variant="primary"
                          onClick={() => handleResumeJob(job.id)}
                          size="sm"
                        >
                          Resume
                        </Button>
                      ) : job.status === 'running' ? (
                        <Button
                          variant="ghost"
                          onClick={() => handlePauseJob(job.id)}
                          size="sm"
                        >
                          Pause
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <Progress
                    value={percent}
                    label={`Progress: ${percent}%`}
                    statusText={`${job.progressDone} / ${job.progressTotal} cells`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Floating Status Toast */}
      <Toast message={notice} onClose={() => setNotice(null)} />

      {/* Custom Category Creation Modal */}
      <Modal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Add custom category & keywords"
        subtitle="Extract targeted B2B businesses in any niche"
      >
        {customError && <p className="text-xs text-tx-muted mb-2">{customError}</p>}
        <form onSubmit={handleCreateCustomCategory} className="space-y-4">
          <Input
            label="Category name"
            required
            placeholder="e.g. Next.js SaaS Developers, Webflow Agencies"
            value={customCatName}
            onChange={(e) => setCustomCatName(e.target.value)}
          />

          <Textarea
            label="Target search keywords (Comma-separated)"
            rows={3}
            placeholder="e.g. nextjs agency, full stack developer, react studio"
            value={customCatKeywords}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomCatKeywords(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowCustomModal(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={savingCustomCat}
              size="sm"
            >
              Save category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dynamic API Key Vault Modal matching Figma */}
      <Modal
        isOpen={showKeysModal}
        onClose={() => setShowKeysModal(false)}
        title="API vault"
        subtitle="Hot-reloads keys in memory without server restarts"
        maxWidth="max-w-md"
      >
        <div className="divide-y divide-border text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-tx-muted">Gemini AI</span>
            <Pill active className="pointer-events-none text-[11px]">Active</Pill>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-tx-muted">Serper.dev</span>
            <Pill active className="pointer-events-none text-[11px]">Active</Pill>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-tx-muted">Meta Graph Token</span>
            <Pill active className="pointer-events-none text-[11px]">Active</Pill>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-tx-muted">SerpAPI</span>
            <Pill className="pointer-events-none text-[11px]">Optional</Pill>
          </div>
        </div>

        <form onSubmit={handleQuickAddKey} className="space-y-3 pt-3">
          <Select
            label="Engine provider"
            value={newKeyProvider}
            onChange={(e) => setNewKeyProvider(e.target.value)}
          >
            <option value="gemini">Google Gemini AI</option>
            <option value="serper">Serper.dev (Google Maps)</option>
            <option value="meta">Meta Graph Access Token</option>
            <option value="serpapi">SerpAPI</option>
          </Select>

          <Input
            label="Paste new key / token"
            type="text"
            placeholder="sk-… or EAAV…"
            value={newKeyValue}
            onChange={(e) => setNewKeyValue(e.target.value)}
            className="mono"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowKeysModal(false)}
              size="sm"
            >
              Close
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={savingKey}
              disabled={!newKeyValue.trim()}
              size="sm"
            >
              Save and reload
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
