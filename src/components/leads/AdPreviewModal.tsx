import React, { useState, useEffect } from 'react';
import {
  Copy,
  MessageCircle,
  Mail,
  Heart,
  Share2,
  Bookmark,
  ExternalLink,
  MoreHorizontal,
  Globe,
  Search,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Button, Pill, Textarea, Skeleton } from '../ui/index.js';

interface AdPreviewModalProps {
  lead: {
    id: string;
    name: string;
    phone?: string;
    phoneNorm?: string;
    phones?: string[];
    email?: string;
    emails?: string[];
    city?: string;
    country?: string;
    categoryName?: string;
    website?: string;
    websiteNorm?: string;
    tags?: string[];
    adsInfo?: any;
  } | null;
  onClose: () => void;
}

export const AdPreviewModal: React.FC<AdPreviewModalProps> = ({ lead, onClose }) => {
  const [activeTab, setActiveTab] = useState<'instagram' | 'facebook' | 'google' | 'library'>('instagram');
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [liveAds, setLiveAds] = useState<any[]>([]);
  const [loadingLiveAds, setLoadingLiveAds] = useState(false);
  const [liveAdsChecked, setLiveAdsChecked] = useState(false);

  useEffect(() => {
    if (lead?.id && activeTab === 'library' && !liveAdsChecked) {
      fetchLiveAds();
    }
  }, [activeTab, lead?.id]);

  const fetchLiveAds = async () => {
    if (!lead?.id) return;
    try {
      setLoadingLiveAds(true);
      const res: any = await api.get(`/leads/${lead.id}/ad-library`);
      setLiveAds(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLiveAds([]);
    } finally {
      setLoadingLiveAds(false);
      setLiveAdsChecked(true);
    }
  };

  if (!lead) return null;

  const tags = Array.isArray(lead.tags) ? lead.tags : [];
  const ads = lead.adsInfo || {};
  const isMetaIntegrated = tags.includes('Meta Integrated') || tags.includes('Meta Pixel Active') || ads.pixelDetected || ads.hasMetaPixel;
  const isAdsRunning = tags.includes('Meta Ads Active') || ads.running || ads.runningMetaAds || ads.runningGoogleAds;
  const pixelId = (ads.pixelIds && ads.pixelIds[0]) || '9482019482019';

  const category = lead.categoryName?.split('(')[0]?.trim() || 'Business & Digital Services';
  const cleanName = lead.name;
  const handle = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);

  // Dynamic tailored headlines
  const adHeadlines: Record<string, string> = {
    instagram: `Your premier ${category.toLowerCase()} in ${lead.city || 'your area'}.`,
    facebook: `Scale your ${category.toLowerCase()} with high-converting systems.`,
    google: `Top-Rated ${category} in ${lead.city || 'your area'}. Contact Today.`,
    library: `Live Creative: 3 verified campaigns running in ${lead.country || 'Global'}.`,
  };

  const adHeadline = adHeadlines[activeTab] || `Premier ${category} in ${lead.city || 'Dubai'}`;

  const defaultPitch = isAdsRunning
    ? `Hi ${cleanName} team, noticed your active campaigns on Meta & Instagram in ${lead.city || 'your area'}. Your brand positioning is solid, but your landing page conversion tracking could be optimized to cut Cost Per Acquisition by about 30%. Would you be open to a 15-minute call this week?`
    : `Hi ${cleanName} team, I noticed your business in ${lead.city || 'your area'} has strong market positioning, but you aren't currently running Meta/Instagram ads to capture local high-intent customers. We designed a sample high-converting ad concept tailored for ${category} that could drive 30-50 qualified inquiries/month. Open to a quick 2-minute preview?`;

  const [pitchText, setPitchText] = useState(defaultPitch);

  const rawPhone = lead.phoneNorm || (Array.isArray(lead.phones) && lead.phones[0]) || lead.phone;
  const cleanPhone = rawPhone ? rawPhone.replace(/[^\d]/g, '') : null;
  const leadEmail = (Array.isArray(lead.emails) && lead.emails[0]) || lead.email || null;

  const waPitchLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(pitchText)}`
    : null;

  const handleCopyPitch = () => {
    navigator.clipboard?.writeText(pitchText).catch(() => {});
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleWhatsAppClick = () => {
    if (lead.id) {
      api.post(`/leads/${lead.id}/timeline`, {
        type: 'whatsapp',
        payload: { message: `Sent Ad Cold Pitch via WhatsApp to ${rawPhone || 'lead'}` },
      }).catch(() => {});
    }
    if (waPitchLink) {
      window.open(waPitchLink, '_blank');
    }
  };

  const handleEmailClick = () => {
    if (lead.id) {
      api.post(`/leads/${lead.id}/timeline`, {
        type: 'email',
        payload: { message: `Initiated Ad Cold Pitch email to ${leadEmail || 'lead'}` },
      }).catch(() => {});
    }
    const mailto = `mailto:${leadEmail || ''}?subject=${encodeURIComponent(`Growth Opportunity for ${cleanName}`)}&body=${encodeURIComponent(pitchText)}`;
    window.open(mailto, '_blank');
  };

  const adLibraryUrl =
    ads.adLibraryUrl ||
    `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(
      lead.name
    )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-surface-1 border border-border rounded-modal w-full max-w-4xl max-h-[92vh] flex flex-col shadow-card overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="serif text-xl sm:text-2xl font-bold text-tx">Ad preview &amp; pitch generator</h2>
            <Pill active className="text-[11px]">{category}</Pill>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        {/* Ad Platform Selector Tabs */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-2 overflow-x-auto bg-surface-2">
          {[
            { id: 'instagram', label: 'Instagram feed ad' },
            { id: 'facebook', label: 'Facebook sponsored ad' },
            { id: 'google', label: 'Google search ad' },
            { id: 'library', label: 'Live ad library' },
          ].map((tab) => (
            <Pill
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="text-xs cursor-pointer"
            >
              {tab.label}
            </Pill>
          ))}

          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-tx-muted">
            <span>Meta Pixel:</span>
            <Pill active={isMetaIntegrated} className="text-[10px]">
              {isMetaIntegrated ? `Active (${pixelId})` : 'Missing'}
            </Pill>
          </div>
        </div>

        {/* Modal Body: Phone Mockup (Left) & Ad Intel + Cold Outreach (Right) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column (Span 5): Phone Frame Ad Simulation */}
          <div className="md:col-span-5 flex justify-center items-start">
            <div className="w-[280px] bg-canvas text-tx rounded-[36px] border-[6px] border-border p-4 min-h-[460px] flex flex-col justify-between shadow-card">
              
              {/* INSTAGRAM MOCKUP */}
              {activeTab === 'instagram' && (
                <div className="space-y-3">
                  {/* IG Top Profile */}
                  <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-tx text-canvas flex items-center justify-center font-bold text-[10px]">
                        {cleanName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-tx text-[11px]">@{handle}</div>
                        <div className="text-[9px] text-tx-subtle">Sponsored</div>
                      </div>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-tx-subtle" />
                  </div>

                  {/* IG Media Box */}
                  <div className="aspect-[4/3] rounded-card bg-surface-2 border border-border p-3.5 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <Pill active className="text-[9px]">{category}</Pill>
                      <Sparkles className="w-3 h-3 text-tx" />
                    </div>
                    <div>
                      <h4 className="serif text-sm font-bold text-tx leading-snug">
                        {adHeadline}
                      </h4>
                      <p className="text-[10px] text-tx-muted mt-1">
                        Verified {category} in {lead.city || 'your area'}.
                      </p>
                    </div>
                    <div className="text-[9px] mono text-tx-subtle">
                      ⭐ 4.9 · 150+ Happy Clients
                    </div>
                  </div>

                  {/* IG CTA Bar */}
                  <div className="w-full py-1.5 bg-tx text-canvas text-center rounded-btn font-semibold text-[11px]">
                    Learn more
                  </div>

                  {/* IG Action Icons */}
                  <div className="flex items-center justify-between pt-1 text-tx">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4" />
                      <MessageCircle className="w-4 h-4" />
                      <Share2 className="w-4 h-4" />
                    </div>
                    <Bookmark className="w-4 h-4" />
                  </div>

                  {/* IG Caption */}
                  <div className="text-[10px] text-tx leading-tight line-clamp-3">
                    <strong className="mr-1">@{handle}</strong>
                    Serving high-intent customers in {lead.city || 'your area'}. Tap Learn more to claim your initial consultation.
                  </div>
                </div>
              )}

              {/* FACEBOOK MOCKUP */}
              {activeTab === 'facebook' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-border text-xs">
                    <div className="w-8 h-8 rounded-full bg-tx text-canvas flex items-center justify-center font-bold text-xs">
                      {cleanName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-tx text-[11px] leading-tight">{cleanName}</div>
                      <div className="text-[9px] text-tx-subtle flex items-center gap-1">
                        <span>Sponsored</span> · <Globe className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-tx font-sans leading-relaxed">
                    Looking for a proven {category.toLowerCase()} in {lead.city || 'your city'}? We deliver results with guaranteed satisfaction.
                  </p>

                  <div className="rounded-btn border border-border bg-surface-2 overflow-hidden">
                    <div className="h-28 bg-surface-1 p-3 flex flex-col justify-center">
                      <span className="serif text-xs font-bold text-tx line-clamp-2">{adHeadline}</span>
                      <span className="text-[9px] text-tx-subtle mt-1">Free instant assessment</span>
                    </div>
                    <div className="p-2 border-t border-border flex items-center justify-between bg-surface-2 text-[10px]">
                      <div className="truncate">
                        <span className="mono uppercase text-tx-subtle text-[8px] block">
                          {lead.websiteNorm || lead.website || 'WEBSITE.COM'}
                        </span>
                        <span className="font-semibold text-tx truncate block">{cleanName}</span>
                      </div>
                      <div className="px-2.5 py-1 bg-tx text-canvas rounded-btn font-semibold text-[10px] whitespace-nowrap">
                        Book now
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GOOGLE SEARCH MOCKUP */}
              {activeTab === 'google' && (
                <div className="space-y-3 py-2">
                  <div className="flex items-center gap-1 text-[10px] text-tx-subtle border-b border-border pb-2">
                    <Search className="w-3 h-3 text-tx" />
                    <span className="mono">google.com/search</span>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-btn border border-border bg-surface-2">
                    <div className="flex items-center gap-1.5 text-[9px] text-tx-subtle">
                      <span className="font-bold text-tx">Sponsored</span>
                      <span>·</span>
                      <span className="mono truncate">https://{lead.websiteNorm || 'example.com'}</span>
                    </div>

                    <h4 className="serif text-xs font-bold text-tx leading-tight hover:underline cursor-pointer">
                      {cleanName} - Top-Rated {category}
                    </h4>

                    <p className="text-[10px] text-tx-muted leading-relaxed">
                      Leading {category.toLowerCase()} serving {lead.city || 'your area'}. Immediate appointments, transparent quotes, verified reviews.
                    </p>

                    <div className="pt-2 grid grid-cols-2 gap-1.5 text-[9px]">
                      <span className="p-1 rounded bg-surface-1 border border-border text-tx font-medium text-center">
                        Our Services
                      </span>
                      <span className="p-1 rounded bg-surface-1 border border-border text-tx font-medium text-center">
                        Contact Us
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* LIVE AD LIBRARY MOCKUP */}
              {activeTab === 'library' && (
                <div className="space-y-3 py-1 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-[10px] font-semibold text-tx uppercase tracking-wider">
                        Meta Ad Library
                      </span>
                      <button
                        onClick={fetchLiveAds}
                        className="text-tx-subtle hover:text-tx text-[10px] flex items-center gap-1"
                        title="Recheck"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${loadingLiveAds ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {loadingLiveAds ? (
                      <div className="py-6 space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : liveAds.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        <div className="text-[10px] text-tx font-semibold mono">
                          {liveAds.length} Active Ads Found
                        </div>
                        {liveAds.slice(0, 2).map((ad, idx) => (
                          <div key={idx} className="p-2 bg-surface-2 rounded-btn border border-border text-[10px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="mono text-[9px] text-tx-subtle">ID: {ad.id}</span>
                              <span className="text-[9px] text-tx font-bold">Active</span>
                            </div>
                            <p className="text-[9px] text-tx-muted line-clamp-2">
                              {ad.adText || 'Sponsored creative'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center space-y-2">
                        <span className="serif text-xs font-semibold text-tx block">
                          No active campaigns
                        </span>
                        <p className="text-[10px] text-tx-muted leading-relaxed">
                          This business is not currently advertising on Facebook or Instagram.
                        </p>
                        <Pill active className="text-[9px]">Untapped Opportunity</Pill>
                      </div>
                    )}
                  </div>

                  <a
                    href={adLibraryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-surface-2 hover:bg-surface-1 border border-border text-tx text-center rounded-btn font-medium text-[10px] inline-flex items-center justify-center gap-1"
                  >
                    <span>View on Facebook ↗</span>
                  </a>
                </div>
              )}

              {/* Phone Bottom Footer */}
              <div className="pt-2 border-t border-border text-[9px] text-tx-subtle text-center mono">
                Global Lead Intelligence Simulation
              </div>
            </div>
          </div>

          {/* Right Column (Span 7): Ad Intelligence & Cold Outreach Pitch */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <h3 className="serif text-lg font-semibold text-tx mb-3">Ad intelligence dossier</h3>
              <div className="divide-y divide-border text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-tx-muted">Meta Pixel status</span>
                  <Pill active={isMetaIntegrated} className="text-[10px]">
                    {isMetaIntegrated ? `Detected (${pixelId})` : 'Missing (Immediate pitch hook)'}
                  </Pill>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-tx-muted">Active ad spend estimate</span>
                  <span className="mono text-tx font-semibold">
                    {isAdsRunning ? '$1,200–$3,800/mo' : '$0 / month (Zero active campaigns)'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-tx-muted">Target audience</span>
                  <span className="text-tx font-medium">{lead.city || 'Local area'}, High-intent customers</span>
                </div>
              </div>
            </div>

            {/* Cold Outreach Pitch Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="serif text-lg font-semibold text-tx">Tailored cold outreach pitch</h3>
                <span className="text-[11px] text-tx-subtle mono">1-click direct dispatch</span>
              </div>

              <Textarea
                value={pitchText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPitchText(e.target.value)}
                rows={5}
                className="font-sans leading-relaxed text-xs"
              />

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPitch}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  <span>{copiedPitch ? 'Pitch copied!' : 'Copy pitch'}</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleWhatsAppClick}
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                  <span>Direct WhatsApp pitch</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEmailClick}
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  <span>Email pitch</span>
                </Button>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                <a
                  href={adLibraryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tx font-medium hover:underline inline-flex items-center gap-1"
                >
                  <span>Double-check official Meta Ad Library ↗</span>
                </a>
                <span className="text-tx-subtle text-[11px] mono">
                  {cleanPhone ? `Dialable: ${cleanPhone}` : 'No phone'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
