import { useState } from 'react';
import { DesignSystemProvider } from '@strapi/design-system';
import useHotkey from '../hooks/useHotkey';
import { useAdminTheme } from '../utils/theme';
import { SearchOverlay } from './SearchOverlay';

const isAuthenticated = (): boolean => {
  try {
    const raw = window.localStorage.getItem('jwtToken');
    if (!raw) return false;

    const parsed = JSON.parse(raw);

    return Boolean(parsed);
  } catch (error) {
    return Boolean(window.localStorage.getItem('jwtToken'));
  }
};

/**
 * Root of the always-available palette. This component owns its own React root
 * (mounted from `bootstrap()`) and therefore its own DesignSystemProvider, kept
 * in sync with the admin's light/dark setting.
 */
const GlobalSearchPortal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useAdminTheme();

  useHotkey(() => setIsOpen((open) => (open ? false : isAuthenticated())));

  return (
    <DesignSystemProvider theme={theme} locale="en">
      {isOpen ? <SearchOverlay onClose={() => setIsOpen(false)} /> : null}
    </DesignSystemProvider>
  );
};

export { GlobalSearchPortal };
