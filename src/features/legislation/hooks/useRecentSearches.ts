import { useState, useEffect } from 'react';
import { LegislationSearchParams } from '../types/legislation';

const STORAGE_KEY = 'lexml-recent-searches';
const MAX_RECENT_SEARCHES = 10;

interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
  filters?: Partial<LegislationSearchParams>;
}

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const searches = JSON.parse(stored) as RecentSearch[];
        setRecentSearches(searches);
      }
    } catch (error) {
      console.warn('Error loading recent searches:', error);
    }
  }, []);

  // Save recent searches to localStorage
  const saveToStorage = (searches: RecentSearch[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (error) {
      console.warn('Error saving recent searches:', error);
    }
  };

  // Add a new search to recent searches
  const addRecentSearch = (params: LegislationSearchParams) => {
    if (!params.query?.trim()) return;

    const newSearch: RecentSearch = {
      id: `${Date.now()}-${Math.random()}`,
      query: params.query.trim(),
      timestamp: Date.now(),
      filters: {
        type: params.type,
        authority: params.authority,
        location: params.location,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo
      }
    };

    setRecentSearches(prev => {
      // Remove duplicate queries
      const filtered = prev.filter(search => 
        search.query.toLowerCase() !== newSearch.query.toLowerCase()
      );
      
      // Add new search at the beginning and limit to MAX_RECENT_SEARCHES
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      saveToStorage(updated);
      return updated;
    });
  };

  // Remove a search from recent searches
  const removeRecentSearch = (id: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(search => search.id !== id);
      saveToStorage(updated);
      return updated;
    });
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Get formatted recent searches for display
  const getFormattedSearches = () => {
    return recentSearches.map(search => ({
      ...search,
      displayText: search.query,
      timeAgo: formatTimeAgo(search.timestamp)
    }));
  };

  return {
    recentSearches: getFormattedSearches(),
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches
  };
};

// Helper function to format time ago
const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  
  return new Date(timestamp).toLocaleDateString('pt-BR');
};