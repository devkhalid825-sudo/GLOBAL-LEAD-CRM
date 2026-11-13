import React from 'react';
import { Compass, Users, Inbox, MessageSquare, Calendar, FileText, Clock, BarChart3 } from 'lucide-react';
import { Card, Pill } from '../components/ui/index.js';

interface PlaceholderProps {
  title: string;
  phase: string;
  icon: React.ElementType;
  description: string;
}

const PlaceholderPage: React.FC<PlaceholderProps> = ({ title, phase, icon: Icon, description }) => (
  <Card className="p-12 text-center max-w-2xl mx-auto my-12 space-y-4">
    <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border text-tx flex items-center justify-center mx-auto">
      <Icon className="w-8 h-8" />
    </div>
    <div>
      <Pill active className="text-xs font-mono">
        {phase}
      </Pill>
    </div>
    <h2 className="font-serif text-2xl font-bold text-tx">{title}</h2>
    <p className="text-tx-muted text-xs max-w-md mx-auto">{description}</p>
  </Card>
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
