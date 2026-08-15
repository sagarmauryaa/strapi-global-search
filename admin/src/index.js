import { prefixPluginTranslations } from '@strapi/helper-plugin';
import React from 'react';
import { createRoot } from 'react-dom/client';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import pluginPermissions from './permissions';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
import GlobalSearchPortal from './components/GlobalSearchPortal';

const name = pluginPkg.strapi.name;
const PORTAL_ROOT_ID = 'global-search-portal-root';

export default {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'Global Search',
      },
      permissions: pluginPermissions.main,
      Component: async () => {
        const component = await import('./pages/App');

        return component;
      },
    });

    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: { id: `${pluginId}.settings.section`, defaultMessage: 'Global Search' },
      },
      [
        {
          intlLabel: { id: `${pluginId}.settings.link`, defaultMessage: 'Configuration' },
          id: `${pluginId}-settings`,
          to: `/settings/${pluginId}`,
          permissions: pluginPermissions.settings,
          Component: async () => {
            const component = await import('./pages/Settings');

            return component;
          },
        },
      ]
    );

    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });
  },

  /**
   * Strapi v4 has no injection zone that renders on every admin screen, and plugin
   * initializers are unmounted once the app is ready — so the Ctrl/Cmd + K palette
   * gets its own React root on `document.body`, outside the admin tree.
   */
  bootstrap() {
    if (typeof document === 'undefined' || document.getElementById(PORTAL_ROOT_ID)) return;

    const container = document.createElement('div');
    container.id = PORTAL_ROOT_ID;
    document.body.appendChild(container);

    createRoot(container).render(React.createElement(GlobalSearchPortal));
  },

  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map((locale) =>
        import(`./translations/${locale}.json`)
          .then(({ default: data }) => ({ data: prefixPluginTranslations(data, pluginId), locale }))
          .catch(() => ({ data: {}, locale }))
      )
    );

    return Promise.resolve(importedTrads);
  },
};
