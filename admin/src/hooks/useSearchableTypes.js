import { useEffect, useState } from 'react';
import { fetchSearchableTypes } from '../api/searchApi';

// The schema barely changes at runtime, and both the page and the palette ask
// for it — resolve it once per admin session.
let inFlight = null;

const load = () => {
  if (!inFlight) {
    inFlight = fetchSearchableTypes().catch((error) => {
      inFlight = null;
      throw error;
    });
  }

  return inFlight;
};

const useSearchableTypes = () => {
  const [state, setState] = useState({ status: 'loading', contentTypes: [], settings: {} });

  useEffect(() => {
    let cancelled = false;

    load()
      .then((data) => {
        if (cancelled) return;
        setState({
          status: 'success',
          contentTypes: data.contentTypes || [],
          settings: data.settings || {},
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: 'error', contentTypes: [], settings: {} });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};

export const invalidateSearchableTypes = () => {
  inFlight = null;
};

export default useSearchableTypes;
