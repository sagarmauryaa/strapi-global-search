import { getFetchClient } from '@strapi/strapi/admin';
import pluginId from '../pluginId';

/**
 * `getFetchClient` reads the admin JWT itself and needs no React context, so the
 * same calls work from the plugin page and from the body-mounted palette.
 */
export const searchEntries = async (params, signal) => {
  const { get } = getFetchClient();
  const { data } = await get(`/${pluginId}/search`, { params, signal });

  return data;
};

export const fetchSearchableTypes = async () => {
  const { get } = getFetchClient();
  const { data } = await get(`/${pluginId}/schema`);

  return data;
};

export const fetchAllTypes = async () => {
  const { get } = getFetchClient();
  const { data } = await get(`/${pluginId}/schema/all`);

  return data;
};

export const fetchSettings = async () => {
  const { get } = getFetchClient();
  const { data } = await get(`/${pluginId}/settings`);

  return data;
};

export const updateSettings = async (body) => {
  const { put } = getFetchClient();
  const { data } = await put(`/${pluginId}/settings`, body);

  return data;
};

export const resetSettings = async () => {
  const { post } = getFetchClient();
  const { data } = await post(`/${pluginId}/settings/reset`);

  return data;
};

/** i18n is optional — a 404 here just means locales are not configured. */
export const fetchLocales = async () => {
  try {
    const { get } = getFetchClient();
    const { data } = await get('/i18n/locales');

    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};

export const isCanceled = (error) =>
  Boolean(error) && (error.name === 'CanceledError' || error.code === 'ERR_CANCELED');
