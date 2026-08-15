import React, { useState } from 'react';
import { ThemeProvider } from '@strapi/design-system';
import { auth } from '@strapi/helper-plugin';
import useHotkey from '../../hooks/useHotkey';
import { useAdminTheme } from '../../utils/theme';
import SearchOverlay from '../SearchOverlay';

/**
 * Root of the always-available palette. Strapi v4 has no injection zone that
 * renders on every admin screen, so this component owns its own React root
 * (mounted from `bootstrap()`) and therefore its own ThemeProvider, kept in sync
 * with the admin's light/dark setting.
 */
const GlobalSearchPortal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useAdminTheme();

  // This root is mounted on every admin screen, the login page included — there
  // is nothing to search, and no token to search with, until someone is signed in.
  const isAuthenticated = () => {
    try {
      return Boolean(auth.getToken());
    } catch (error) {
      return false;
    }
  };

  useHotkey(() => setIsOpen((open) => (open ? false : isAuthenticated())));

  return (
    <ThemeProvider theme={theme}>
      {isOpen ? <SearchOverlay onClose={() => setIsOpen(false)} /> : null}
    </ThemeProvider>
  );
};

export default GlobalSearchPortal;
