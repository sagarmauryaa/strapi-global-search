'use strict';

/** `seo.metaTitle` + condition -> `{ seo: { metaTitle: condition } }` */
const nest = (path, condition) =>
  path
    .split('.')
    .reverse()
    .reduce((acc, segment) => ({ [segment]: acc }), condition);

/**
 * Turns the component segments of the nested paths into a Document Service
 * populate tree, so the matched value is present on the returned entry and can
 * be ranked and excerpted. Only the components actually searched are populated.
 */
const buildPopulate = (paths) => {
  const tree = {};

  paths.forEach((path) => {
    const segments = path.split('.');
    segments.pop(); // drop the scalar field itself

    let node = tree;
    segments.forEach((segment) => {
      node[segment] = node[segment] || {};
      node = node[segment];
    });
  });

  const toPopulate = (node) =>
    Object.entries(node).reduce((acc, [key, child]) => {
      acc[key] = Object.keys(child).length ? { populate: toPopulate(child) } : true;
      return acc;
    }, {});

  return Object.keys(tree).length ? toPopulate(tree) : undefined;
};

module.exports = () => ({
  nest,
  buildPopulate,

  /** All field paths a hit could have matched, in ranking order. */
  searchablePaths(descriptor) {
    return [
      ...descriptor.idFields,
      ...(descriptor.mainField && descriptor.mainField !== 'id' ? [descriptor.mainField] : []),
      ...descriptor.topLevelFields,
      ...descriptor.nestedFields,
    ];
  },

  /**
   * One `$or` over every searchable path. `id` is numeric, so it is only added —
   * as an equality — when the query is a plain integer; `$containsi` on an
   * integer column is rejected by Postgres and misbehaves elsewhere.
   * `documentId` is always matched as a string.
   */
  buildFilters(descriptor, query) {
    const conditions = [{ documentId: { $containsi: query } }];

    if (/^\d+$/.test(query)) {
      conditions.push({ id: { $eq: Number(query) } });
    }

    this.searchablePaths(descriptor).forEach((path) => {
      if (path === 'documentId') return;
      conditions.push(nest(path, { $containsi: query }));
    });

    return conditions.length ? { $or: conditions } : null;
  },

  /** Bounded projection — never `populate: '*'`, never a full row. */
  buildParams(descriptor, { query, locale, limit, includeDrafts }) {
    const filters = this.buildFilters(descriptor, query);
    if (!filters) return null;

    const fields = Array.from(
      new Set(
        [
          'documentId',
          ...descriptor.idFields,
          descriptor.mainField,
          ...descriptor.topLevelFields,
          'createdAt',
          'updatedAt',
          ...(descriptor.draftAndPublish ? ['publishedAt'] : []),
          ...(descriptor.localized ? ['locale'] : []),
        ].filter((field) => field && field !== 'id')
      )
    );

    const params = {
      filters,
      fields,
      sort: { updatedAt: 'desc' },
      limit,
      start: 0,
    };

    const populate = buildPopulate(descriptor.nestedFields);
    if (populate) params.populate = populate;

    if (descriptor.draftAndPublish) {
      params.status = includeDrafts ? 'draft' : 'published';
    }

    if (descriptor.localized) {
      params.locale = locale && locale !== 'all' ? locale : '*';
    }

    return params;
  },
});
