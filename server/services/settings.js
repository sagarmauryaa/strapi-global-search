'use strict';

const { PLUGIN_ID } = require('../utils/constants');
const { defaults, validator } = require('../config');

const STORE_KEY = 'settings';

const getStore = (strapi) => strapi.store({ type: 'plugin', name: PLUGIN_ID });

module.exports = ({ strapi }) => ({
  /**
   * Resolution order: values saved from the Settings page, then `config/plugins.js`,
   * then the built-in defaults. Every key always resolves to something usable.
   */
  async get() {
    const fromFile = strapi.config.get(`plugin.${PLUGIN_ID}`, {}) || {};
    const fromStore = (await getStore(strapi).get({ key: STORE_KEY })) || {};

    return { ...defaults, ...fromFile, ...fromStore };
  },

  async set(patch = {}) {
    const allowedKeys = Object.keys(defaults);
    const sanitized = Object.entries(patch).reduce((acc, [key, value]) => {
      if (allowedKeys.includes(key) && value !== undefined) acc[key] = value;
      return acc;
    }, {});

    validator(sanitized);

    const current = (await getStore(strapi).get({ key: STORE_KEY })) || {};
    const next = { ...current, ...sanitized };

    await getStore(strapi).set({ key: STORE_KEY, value: next });

    // Field lists and depth feed the introspection cache — rebuild it.
    strapi.plugin(PLUGIN_ID).service('schema').clearCache();

    return this.get();
  },

  async reset() {
    await getStore(strapi).set({ key: STORE_KEY, value: {} });
    strapi.plugin(PLUGIN_ID).service('schema').clearCache();

    return this.get();
  },

  defaults,
});
