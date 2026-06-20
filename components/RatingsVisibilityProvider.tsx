'use client';

import React, { createContext, useContext } from 'react';
import { useRatingsVisibility } from '@/hooks/useRatingsVisibility';

interface RatingsVisibilityContextType {
  ratingsVisible: boolean;
  isLoading: boolean;
  toggleRatingsVisibility: () => Promise<boolean>;
  canSeeRatings: (isUserAuthenticated?: boolean) => boolean;
}

const RatingsVisibilityContext = createContext<RatingsVisibilityContextType>({
  ratingsVisible: true,
  isLoading: true,
  toggleRatingsVisibility: async () => false,
  canSeeRatings: () => true,
});

export function useRatingsVisibilityContext() {
  return useContext(RatingsVisibilityContext);
}

export function RatingsVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ratingsVisibility = useRatingsVisibility();

  return (
    <RatingsVisibilityContext.Provider value={ratingsVisibility}>
      {children}
    </RatingsVisibilityContext.Provider>
  );
}
