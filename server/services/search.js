'use strict';

const { PLUGIN_ID } = require('../utils/constants');
const { sanitizeQuery } = require('../utils/text');
const { withTimeout, mapWithConcurrency } = require('../utils/async');

const service = (strapi, name) => strapi.plugin(PLUGIN_ID).service(name);

module.exports = ({ strapi }) => ({
  /** Content Manager deep-link for a hit. */
  buildAdminUrl(descriptor, entry) {
    const localeQuery = entry.locale ? `?locale=${entry.locale}` : '';

    if (descriptor.kind === 'singleType') {
      return `/content-manager/single-types/${descriptor.uid}${localeQuery}`;
    }

    const documentId = entry.documentId || entry.id;

    return `/content-manager/collection-types/${descriptor.uid}/${documentId}${localeQuery}`;
  },

  async queryContentType(descriptor, { query, locale, settings }) {
    const params = service(strapi, 'query').buildParams(descriptor, {
      query,
      locale,
      limit: settings.perTypeLimit,
      includeDrafts: settings.includeDrafts,
    });

    if (!params) return [];

    const result = await strapi.documents(descriptor.uid).findMany(params);

    return Array.isArray(result) ? result : [result].filter(Boolean);
  },

  toHit(descriptor, entry, query, settings) {
    const scored = service(strapi, 'ranking').score(entry, descriptor, query);
    const extraFields = (settings.displayFields[descriptor.uid] || []).slice(0, 2);

    return {
      ...scored,
      contentTypeUid: descriptor.uid,
      contentTypeLabel: descriptor.displayName,
      kind: descriptor.kind,
      id: entry.id,
      documentId: entry.documentId || null,
      title:
        (descriptor.mainField && entry[descriptor.mainField]) ||
        entry.name ||
        entry.title ||
        `#${entry.documentId || entry.id}`,
      mainField: descriptor.mainField,
      extra: extraFields.map((field) => ({ field, value: entry[field] ?? null })),
      locale: entry.locale || null,
      status: descriptor.draftAndPublish ? (entry.publishedAt ? 'published' : 'draft') : null,
      updatedAt: entry.updatedAt || null,
      adminUrl: this.buildAdminUrl(descriptor, entry),
    };
  },

  /**
   * Fans out across every permitted content type, ranks the merged set, then
   * paginates in memory.
   *
   * `total` is the size of the *capped* merged set (`perTypeLimit` rows per type,
   * `maxResults` overall), not a database count — searching for a common word in a
   * 100k-row table must not turn into a full-table `COUNT`.
   */
  async search({ query: rawQuery, types, locale, page = 1, pageSize = 20, userAbility } = {}) {
    const settings = await service(strapi, 'settings').get();
    const query = sanitizeQuery(rawQuery);

    const empty = {
      query,
      results: [],
      groups: [],
      pagination: { page: 1, pageSize, total: 0, pageCount: 0 },
      meta: { searchedTypes: 0, truncatedTypes: [], failedTypes: [], minChars: settings.minChars },
    };

    if (query.length < settings.minChars) return empty;

    const searchable = await service(strapi, 'schema').getSearchableContentTypes();
    const requested = Array.isArray(types) && types.length ? new Set(types) : null;

    const candidates = service(strapi, 'permissions')
      .filterReadableTypes(searchable, userAbility)
      .filter((descriptor) => !requested || requested.has(descriptor.uid));

    if (!candidates.length) return { ...empty, query };

    const truncatedTypes = [];
    const failedTypes = [];

    const perType = await mapWithConcurrency(candidates, settings.concurrency, async (descriptor) => {
      try {
        const entries = await withTimeout(
          () => this.queryContentType(descriptor, { query, locale, settings }),
          settings.queryTimeout,
          descriptor.uid
        );

        if (entries.length >= settings.perTypeLimit) truncatedTypes.push(descriptor.uid);

        return entries.map((entry) => this.toHit(descriptor, entry, query, settings));
      } catch (error) {
        // One broken or slow content type must never fail the whole search.
        failedTypes.push({ uid: descriptor.uid, message: error.message });
        strapi.log.warn(`[${PLUGIN_ID}] search failed for ${descriptor.uid}: ${error.message}`);

        return [];
      }
    });

    const ranked = service(strapi, 'ranking')
      .sort(perType.flat())
      .slice(0, settings.maxResults);

    const total = ranked.length;
    const safePageSize = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
    const pageCount = Math.ceil(total / safePageSize) || 0;
    const safePage = Math.min(Math.max(Number(page) || 1, 1), pageCount || 1);
    const start = (safePage - 1) * safePageSize;
    const results = ranked.slice(start, start + safePageSize);

    // Group headers are built from the full ranked set, not the current page, so
    // the counts stay stable while paging.
    const groups = candidates
      .map((descriptor) => ({
        uid: descriptor.uid,
        label: descriptor.displayName,
        kind: descriptor.kind,
        count: ranked.filter((hit) => hit.contentTypeUid === descriptor.uid).length,
        truncated: truncatedTypes.includes(descriptor.uid),
      }))
      .filter((group) => group.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      query,
      results,
      groups,
      pagination: { page: safePage, pageSize: safePageSize, total, pageCount },
      meta: {
        searchedTypes: candidates.length,
        truncatedTypes,
        failedTypes,
        minChars: settings.minChars,
        capped: total >= settings.maxResults,
      },
    };
  },
});
