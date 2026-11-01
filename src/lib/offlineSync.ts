/**
 * Phase 7: Offline resilience and local caching layer
 */

export interface CachedLead {
  id: string;
  name: string;
  city: string;
  country: string;
  status: string;
  phoneNorm?: string;
  website?: string;
}

const CACHE_KEY = 'crm_leads_cache_v1';

export function saveLeadsToLocalCache(leads: CachedLead[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(leads));
  } catch {
    // quota exceeded or private mode
  }
}

export function getLeadsFromLocalCache(): CachedLead[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function initOfflineNetworkListener(onStatusChange: (isOnline: boolean) => void): () => void {
  const handleOnline = () => onStatusChange(true);
  const handleOffline = () => onStatusChange(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
