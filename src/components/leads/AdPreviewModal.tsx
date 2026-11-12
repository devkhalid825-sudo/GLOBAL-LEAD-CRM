import React, { useState } from 'react';
import {
  X,
  Radio,
  ExternalLink,
  Target,
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  CheckCircle2,
  Copy,
  Zap,
  Globe,
  Search,
  Eye,
  ShieldAlert,
} from 'lucide-react';

interface AdPreviewModalProps {
  lead: {
    id: string;
    name: string;
    city?: string;
    country?: string;
    categoryName?: string;
    website?: string;
    tags?: string[];
    adsInfo?: any;
  } | null;
  onClose: () => void;
}

export const AdPreviewModal: React.FC<AdPreviewModalProps> = ({ lead, onClose }) => {
  const [activeTab, setActiveTab] = useState<'instagram' | 'facebook' | 'google' | 'library'>('instagram');
  const [copiedPitch, setCopiedPitch] = useState(false);

  if (!lead) return null;

  const tags = Array.isArray(lead.tags) ? lead.tags : [];
  const ads = lead.adsInfo || {};
  const isMetaIntegrated = tags.includes('Meta Integrated') || tags.includes('Meta Pixel Active') || ads.pixelDetected || ads.hasMetaPixel;
  const isAdsRunning = tags.includes('Meta Ads Active') || ads.running || ads.runningMetaAds || ads.runningGoogleAds;
  const pixelId = (ads.pixelIds && ads.pixelIds[0]) || '9482019482019';

  const category = lead.categoryName || 'Business & Digital Services';
  const cleanName = lead.name;
  const handleName = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);

  // Dynamic tailored ad copy based on category
  const adHeadline = category.includes('Website') || category.includes('Web')
    ? 'High-Converting Web Applications & Next.js Platforms'
    : category.includes('Shopify') || category.includes('Commerce')
    ? 'Premium D2C Collection | Fast Delivery & Exclusive Offers'
    : category.includes('Real Estate')
    ? 'Exclusive Luxury Properties & Prime Investment Units'
    : category.includes('Clinic')
    ? 'World-Class Cosmetic & Dental Treatments'
    : `Scale Your Business in ${lead.city || 'Your City'} with Premier Solutions`;

  const adBody = category.includes('Website') || category.includes('Web')
    ? `🔥 Is your current website losing qualified customers? We build ultra-fast, responsive web platforms and automated CRM workflows that 2x your lead-to-deal conversion rate. Get your free architectural roadmap today!`
    : category.includes('Shopify') || category.includes('Commerce')
    ? `✨ Experience premium quality crafted for modern lifestyle. Shop our best-selling collections with free shipping and 100% satisfaction guarantee. Discover the new collection now!`
    : category.includes('Real Estate')
    ? `🏡 Discover high-yield luxury real estate in prime locations. Low down-payments, flexible payment plans, and guaranteed capital appreciation. Book a VIP tour today.`
    : `⚡ Serving customers in ${lead.city || 'your area'}. Experience top-rated service with transparent pricing and dedicated support. Tap below to speak with an expert!`;

  const pitchScript = isAdsRunning
    ? `Hi ${cleanName}, noticed your active campaigns on Meta & Instagram in ${lead.city || 'your area'}! Your brand positioning is solid, but noticed your landing page conversion tracking could be optimized to cut your Cost Per Acquisition (CPA) by 30%. Would you be open to a quick 2-minute video breakdown of 2 fixes?`
    : `Hi ${cleanName}, noticed your business in ${lead.city || 'your area'} has strong market positioning, but you aren't currently running Meta/Instagram ads to capture local high-intent customers. We designed a sample high-converting ad concept tailored for ${category} that could drive 30-50 qualified inquiries/month. Open to a quick 2-minute preview?`;

  const adLibraryUrl =
    ads.adLibraryUrl ||
    `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(
      lead.name
    )}`;

  const googleAdsUrl = `https://adstransparency.google.com/?region=anywhere&q=${encodeURIComponent(
    lead.website || lead.name
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20 flex-shrink-0">
              {lead.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white truncate">{lead.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Ad Intel
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                📍 {lead.city}, {lead.country} • <span className="text-emerald-400 font-mono">{category}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls Bar */}
        <div className="px-6 py-2.5 border-b border-slate-800/80 bg-slate-900 flex items-center justify-between gap-2 overflow-x-auto text-xs font-semibold">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setActiveTab('instagram')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'instagram'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>📱 Instagram Feed Ad</span>
            </button>

            <button
              onClick={() => setActiveTab('facebook')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'facebook'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>📘 Facebook Sponsored Ad</span>
            </button>

            <button
              onClick={() => setActiveTab('google')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'google'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🔍 Google Search Ad</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'library'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🌐 Live Ad Library</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>Pixel:</span>
            <span className={isMetaIntegrated ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {isMetaIntegrated ? `ACTIVE (${pixelId})` : 'MISSING'}
            </span>
          </div>
        </div>

        {/* Dynamic Ad Status Banner */}
        {isAdsRunning ? (
          <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <Zap className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span><strong>Active Campaigns Detected:</strong> Is business ke active Meta/Google tags detect huay hain.</span>
            </div>
            <a
              href={adLibraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition shadow"
            >
              <span>View Real Ads on Facebook Ad Library ↗</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>
                <strong>No Active Ads Detected (Pixel Missing):</strong> Yeh business Meta/Google par ads nahi chala raha. Neeche inke liye sample Pitch Mockup & Cold Pitch tayyar hai!
              </span>
            </div>
            <a
              href={adLibraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg font-bold text-[11px] transition"
            >
              <span>Check Meta Ad Library</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: INSTAGRAM FEED AD MOCKUP */}
          {activeTab === 'instagram' && (
            <div className="flex flex-col md:flex-row gap-6 items-start justify-center">
              {/* Instagram Card Mockup */}
              <div className="w-full max-w-sm mx-auto bg-black border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-white font-sans">
                {/* IG Card Header */}
                <div className="p-3.5 flex items-center justify-between border-b border-zinc-900">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px]">
                      <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-xs font-bold">
                        {lead.name.slice(0, 1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1">
                        <span>{handleName}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                        <span className="text-[10px] text-blue-400 font-normal">Follow</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block -mt-0.5">Sponsored</span>
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                </div>

                {/* IG Ad Creative / Visual */}
                <div className="aspect-square bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl" />
                  <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider self-start text-white">
                    {category}
                  </div>
                  <div className="space-y-2 z-10">
                    <h4 className="text-xl font-black text-white leading-tight drop-shadow">
                      {adHeadline}
                    </h4>
                    <p className="text-xs text-slate-300 drop-shadow line-clamp-2">
                      {adBody}
                    </p>
                  </div>
                  {isAdsRunning ? (
                    <div className="text-[11px] font-mono text-emerald-400 font-bold z-10 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Active Meta Sponsored Creative</span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-amber-300 font-bold z-10 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-amber-500/30">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Agency Pitch Mockup (No Live Ads)</span>
                    </div>
                  )}
                </div>

                {/* IG Action Bar */}
                <div className="bg-zinc-900/90 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-white border-y border-zinc-800">
                  <span>Learn More</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </div>

                {/* IG Icons & Captions */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-zinc-300">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                      <MessageCircle className="w-5 h-5" />
                      <Share2 className="w-5 h-5" />
                    </div>
                    <Bookmark className="w-5 h-5 text-zinc-300" />
                  </div>
                  <div className="text-xs font-bold">{isAdsRunning ? '1,842 likes' : 'Projected 500+ Engagement'}</div>
                  <div className="text-xs text-zinc-200 leading-snug">
                    <span className="font-bold mr-1.5 text-white">{handleName}</span>
                    <span>{adBody}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider pt-1">
                    {isAdsRunning ? 'Verified Meta Advertiser • 3 days ago' : 'Cold Outreach Specimen • Ready to Pitch'}
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/90 border-t border-zinc-800 text-center">
                  <a
                    href={adLibraryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    <span>Double-check {cleanName} on Meta Ad Library</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Side Pitch & Intel Panel */}
              <div className="flex-1 space-y-4">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Live Ad Intelligence Breakdown
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400 py-1 border-b border-slate-900">
                      <span>Ad Placement:</span>
                      <span className="text-white font-semibold">
                        {isAdsRunning ? 'Instagram Feed & Reels (Active)' : 'Proposed: Feed & Reels'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 py-1 border-b border-slate-900">
                      <span>Meta Pixel Tracking:</span>
                      <span className={isMetaIntegrated ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {isMetaIntegrated ? 'Active (Conversions Tracking)' : 'Missing (Wasting Ad Budget!)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 py-1 border-b border-slate-900">
                      <span>Estimated Ad Budget:</span>
                      <span className={isAdsRunning ? 'text-amber-400 font-mono font-bold' : 'text-slate-400 font-mono font-semibold'}>
                        {isAdsRunning ? '$1,200 - $3,800 / month' : '$0 / month (Untapped Opportunity!)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 py-1">
                      <span>Target Audience:</span>
                      <span className="text-slate-300">{lead.city || 'Metro Area'}, High-Intent Buyers</span>
                    </div>
                  </div>
                </div>

                {/* Pitch Hook Card */}
                <div className="p-4 bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Advertiser Cold Outreach Pitch
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pitchScript);
                        setCopiedPitch(true);
                        setTimeout(() => setCopiedPitch(false), 2000);
                      }}
                      className="text-xs text-indigo-400 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      {copiedPitch ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Pitch</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    "{pitchScript}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FACEBOOK FEED AD MOCKUP */}
          {activeTab === 'facebook' && (
            <div className="max-w-xl mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl text-slate-200">
              {/* FB Post Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                    {lead.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1">
                      <span>{lead.name}</span>
                      <span className="text-[11px] text-blue-400 font-normal">· Following</span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      Sponsored · 🌐 Public
                    </span>
                  </div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-slate-400" />
              </div>

              {/* FB Primary Text */}
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {adBody}
              </p>

              {/* FB Media Thumbnail Banner */}
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                <div className="h-44 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 flex flex-col justify-end">
                  <span className="text-[10px] font-mono text-blue-300 uppercase tracking-wider">
                    {lead.website || `${cleanName.toLowerCase().replace(/\s+/g, '')}.com`}
                  </span>
                  <h4 className="text-lg font-bold text-white mt-1 leading-snug">
                    {adHeadline}
                  </h4>
                </div>
                <div className="p-3 bg-slate-900/90 flex items-center justify-between border-t border-slate-800">
                  <div className="min-w-0 pr-3">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      OFFICIAL AD CAMPAIGN
                    </span>
                    <span className="text-xs font-bold text-white truncate block">
                      {cleanName} — Book Initial Consultation
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex-shrink-0 transition">
                    Learn More
                  </button>
                </div>
              </div>

              {/* FB Social Engagement */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="p-1 rounded-full bg-blue-500 text-white">
                    <ThumbsUp className="w-2.5 h-2.5" />
                  </span>
                  <span>428 likes</span>
                </span>
                <span>38 comments · 14 shares</span>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE SEARCH SPONSORED AD MOCKUP */}
          {activeTab === 'google' && (
            <div className="max-w-2xl mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  Google Search Sponsored Preview
                </span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Top 3 Ranking Position
                </span>
              </div>

              {/* Google Result Card */}
              <div className="space-y-2 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-300">Sponsored</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 font-mono text-[11px] truncate">
                    {lead.website || `https://www.${cleanName.toLowerCase().replace(/\s+/g, '')}.com`}
                  </span>
                </div>

                <h4 className="text-base font-bold text-blue-400 hover:underline cursor-pointer leading-tight">
                  {cleanName} | Premier {category} in {lead.city || 'Your Area'}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Looking for top-tier {category}? We deliver high performance, tailored solutions, and dedicated customer support. Transparent pricing, free initial assessment. Contact {cleanName} today!
                </p>

                {/* Sitelinks Extensions */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 font-medium hover:underline cursor-pointer">
                    ⚡ Our Core Services &amp; Packages
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 font-medium hover:underline cursor-pointer">
                    📞 Request Instant Callback
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 font-medium hover:underline cursor-pointer">
                    ⭐ Client Reviews &amp; Case Studies
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 font-medium hover:underline cursor-pointer">
                    📍 Location &amp; Direct Office Hours
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE AD LIBRARY DEEP-LINK */}
          {activeTab === 'library' && (
            <div className="text-center py-10 space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">Inspect Live Campaigns</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Facebook &amp; Google protect their ad databases with strict iframe security headers. Click below to view live creatives directly in the official transparency databases:
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a
                  href={adLibraryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
                >
                  <span>Open Meta Ad Library</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={googleAdsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <span>Google Ads Transparency</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
