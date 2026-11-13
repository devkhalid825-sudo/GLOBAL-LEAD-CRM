import React, { useState } from 'react';
import {
  Copy,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Button, Pill, Textarea } from '../ui/index.js';

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

  // Dynamic tailored headlines
  const adHeadlines: Record<string, string> = {
    instagram: `Your best ${category.toLowerCase()}, booked this week.`,
    facebook: `Scale your ${category.toLowerCase()} with high-converting systems.`,
    google: `Top-Rated ${category} in ${lead.city || 'Dubai'}. Contact Today.`,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-surface-1 border border-border rounded-modal w-full max-w-4xl max-h-[92vh] flex flex-col shadow-card overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-bold text-tx">Ad preview and pitch</h2>
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
              className="text-xs"
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
          <div className="md:col-span-5 flex justify-center">
            <div className="w-[260px] bg-canvas text-tx rounded-[36px] border-[6px] border-border p-5 min-h-[380px] flex flex-col justify-between shadow-card">
              <div className="flex items-center justify-between">
                <Pill active className="text-[10px]">
                  {category.split('(')[0]?.trim()}
                </Pill>
                <span className="font-mono text-[10px] text-tx-subtle">Sponsored</span>
              </div>

              <div className="space-y-3 my-auto py-6">
                <h4 className="font-serif text-xl font-bold leading-snug text-tx">
                  {adHeadline}
                </h4>
                <p className="text-[11px] text-tx-muted font-sans leading-relaxed">
                  Serving high-intent customers in {lead.city || 'Dubai'}. Tap below to claim exclusive consultation &amp; guaranteed conversion boost.
                </p>
                <div className="pt-2">
                  <div className="w-full py-2 bg-tx text-canvas text-center rounded-btn font-semibold text-xs">
                    Learn More
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border text-[10px] text-tx-subtle font-sans">
                {lead.name} · Meta Verified Preview
              </div>
            </div>
          </div>

          {/* Right Column (Span 7): Ad Intelligence & Cold Outreach Pitch */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <h3 className="font-serif text-lg font-semibold text-tx mb-3">Ad intelligence</h3>
              <div className="divide-y divide-border text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-tx-muted">Meta Pixel</span>
                  <Pill active={isMetaIntegrated} className="text-[10px]">
                    {isMetaIntegrated ? 'Active' : 'Missing (Untapped Opportunity)'}
                  </Pill>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-tx-muted">Estimated ad budget</span>
                  <span className="font-mono text-tx font-semibold">
                    {isAdsRunning ? '$1,200–$3,800/mo' : '$0 / month (No Active Ads)'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-tx-muted">Target audience</span>
                  <span className="text-tx font-medium">{lead.city || 'Dubai'}, High-Intent Buyers</span>
                </div>
              </div>
            </div>

            {/* Cold Outreach Pitch Editor */}
            <div>
              <h3 className="font-serif text-lg font-semibold text-tx mb-2">Cold outreach</h3>
              <Textarea
                value={pitchText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPitchText(e.target.value)}
                rows={4}
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

              <div className="mt-4 pt-3 border-t border-border">
                <a
                  href={adLibraryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-tx font-medium hover:underline inline-flex items-center gap-1"
                >
                  <span>Double-check Meta Ad Library ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
