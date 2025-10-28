'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all';

interface MapFilterState {
  readonly season: Season;
  readonly hour: number | null;
  readonly setSeason: (season: Season) => void;
  readonly setHour: (hour: number | null) => void;
}

const MapFiltersContext = createContext<MapFilterState | undefined>(undefined);

export function MapFiltersProvider({ children }: { readonly children: React.ReactNode }) {
  const [season, setSeason] = useState<Season>('all');
  const [hour, setHour] = useState<number | null>(null);

  const value = useMemo<MapFilterState>(
    () => ({
      season,
      hour,
      setSeason,
      setHour,
    }),
    [season, hour],
  );

  return <MapFiltersContext.Provider value={value}>{children}</MapFiltersContext.Provider>;
}

export function useMapFilters() {
  const context = useContext(MapFiltersContext);
  if (!context) {
    throw new Error('useMapFilters must be used within MapFiltersProvider');
  }
  return context;
}
