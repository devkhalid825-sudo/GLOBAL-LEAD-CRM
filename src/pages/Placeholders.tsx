import React from 'react';
import { Compass, Users, Inbox, MessageSquare, Calendar, FileText, Clock, BarChart3 } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  phase: string;
  icon: React.ElementType;
  description: string;
}

const PlaceholderPage: React.FC<PlaceholderProps> = ({ title, phase, icon: Icon, description }) => (
  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto my-12">
    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8" />
    </div>
    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
      {phase}
    </span>
    <h2 className="text-2xl font-bold text-white mt-4">{title}</h2>
    <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">{description}</p>
  </div>
);

export const LeadFinderPage = () => (
  <PlaceholderPage
    title="Global Lead Finder"
    phase="Scheduled for Phase 2"
    icon={Compass}
    description="Multi-country grid search, Google Places, SerpAPI, Apify, Overpass fallback, deduplication engine, and Excel export."
  />
);

export const LeadsPage = () => (
  <PlaceholderPage
    title="Leads Directory & Pipeline"
    phase="Scheduled for Phase 2 & 3"
    icon={Users}
    description="Country, city, category filters, AI lead scoring badges, bulk assignment, and owner pipeline."
  />
);

export const InboxPage = () => (
  <PlaceholderPage
    title="Unified Inbox"
    phase="Scheduled for Phase 4"
    icon={Inbox}
    description="Inbound & outbound Gmail OAuth, SMTP, and Brevo message synchronization with automated lead timeline linking."
  />
);

export const ChatPage = () => (
  <PlaceholderPage
    title="Team Chat & Channels"
    phase="Scheduled for Phase 3"
    icon={MessageSquare}
    description="Real-time Socket.IO direct messaging, per-lead channels, file uploads, and @mentions."
  />
);

export const MeetingsPage = () => (
  <PlaceholderPage
    title="Meetings & AI Transcription"
    phase="Scheduled for Phase 5"
    icon={Calendar}
    description="Google Calendar API integration with Meet link generation, in-browser recording, Whisper/Gemini transcription and summarization."
  />
);

export const ProposalsPage = () => (
  <PlaceholderPage
    title="Proposal Builder & Portal"
    phase="Scheduled for Phase 5"
    icon={FileText}
    description="Interactive proposal builder with price table, PDF generation, and public tokenized client portal."
  />
);

export const FollowupsPage = () => (
  <PlaceholderPage
    title="Automated Follow-ups"
    phase="Scheduled for Phase 4"
    icon={Clock}
    description="Rule engine with approval requirements, multi-step triggers, and suppression list enforcement."
  />
);

export const ReportsPage = () => (
  <PlaceholderPage
    title="Analytics & Reports"
    phase="Scheduled for Phase 3"
    icon={BarChart3}
    description="Conversion tracking, lead acquisition cost metrics, and performance analytics."
  />
);
