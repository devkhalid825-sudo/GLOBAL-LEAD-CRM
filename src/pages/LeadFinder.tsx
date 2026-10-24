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
} from 'lucide-react';

interface CountryItem {
  code: string;
  name: string;
}

interface CityItem {
  id: string;
  name: string;
}

interface CategoryItem {
  id: string;
  name: string;
}

export const LeadFinderPage: React.FC = () => {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  // Selection form
  const [selectedCountry, setSelectedCountry] = useState('PK');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSource, setSelectedSource] = useState('auto');

  // Estimate
  const [estimate, setEstimate] = useState<any | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchDropdowns = async () => {
    try {
      const [countriesRes, categoriesRes] = await Promise.all([
        api.get<CountryItem[]>('/geo/countries'),
        api.get<CategoryItem[]>('/categories'),
      ]);
      setCountries(countriesRes);
      setCategories(categoriesRes);
      if (categoriesRes.length > 0) setSelectedCategory(categoriesRes[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCities = async (countryCode: string) => {
    try {
      const data = await api.get<CityItem[]>(`/geo/cities?country=${countryCode}`);
      setCities(data);
      if (data.length > 0) setSelectedCity(data[0].name);
      else setSelectedCity('');
    } catch (err) {
      console.error(err);
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
    if (!selectedCategory) return;
    setStarting(true);
    setMsg(null);
    try {
      const job = await api.post('/finder/jobs', {
        country: selectedCountry,
        city: selectedCity,
        categoryId: selectedCategory,
        providerId: selectedSource,
      });
      setMsg(`Search job started for ${selectedCity || selectedCountry}!`);
      fetchJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to start job');
    } finally {
      setStarting(false);
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Compass className="w-7 h-7 text-emerald-400" />
          Global Lead Finder
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Scrape Google Maps & directories across 2km grid cells with auto-deduplication and failover
        </p>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{msg}</span>
        </div>
      )}

      {/* Criteria & Estimator Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Target Area & Business Category
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Target Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
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
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Industry / Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Provider Engine
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="auto">Auto (Google Places ➔ SerpAPI ➔ Apify ➔ Overpass)</option>
                <option value="google_places">Google Places API Only</option>
                <option value="serpapi">SerpAPI (Google Maps) Only</option>
                <option value="apify">Apify Scraper Only</option>
                <option value="overpass">OpenStreetMap (Overpass - Free) Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Cost & Grid Estimate Panel */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Live Cost & Grid Estimate
            </span>
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

      {/* Active & Past Search Jobs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Extraction Jobs & Checkpoints</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Long-running jobs survive network disruptions and checkpoint every 2km grid cell.
            </p>
          </div>
          <button
            onClick={fetchJobs}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
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

                    <div className="flex items-center gap-4">
                      <div className="text-right text-xs">
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
