'use strict';

const {
  PLUGIN_ID,
  SEARCHABLE_SCALAR_TYPES,
  SKIPPED_ATTRIBUTE_TYPES,
  BLOCKLISTED_ATTRIBUTE_NAMES,
  IDENTIFIER_FIELDS,
  MAIN_FIELD_FALLBACKS,
} = require('../utils/constants');

let cache = null;

module.exports = ({ strapi }) => ({
  /** Content types the plugin is allowed to look at: the app's own `api::` types. */
  listCandidateUids() {
    return Object.keys(strapi.contentTypes).filter((uid) => uid.startsWith('api::'));
  },

  isSearchableAttribute(name, attribute) {
    if (!attribute || BLOCKLISTED_ATTRIBUTE_NAMES.includes(name)) return false;
    if (attribute.private === true) return false;
    if (SKIPPED_ATTRIBUTE_TYPES.includes(attribute.type)) return false;

    return SEARCHABLE_SCALAR_TYPES.includes(attribute.type);
  },

  /**
   * Flattens an attribute map into dotted, searchable field paths, walking into
   * components up to `maxDepth`. `visited` breaks component cycles (a component
   * that, directly or not, contains itself).
   */
  collectFieldPaths(attributes = {}, { maxDepth, depth = 0, prefix = '', visited = new Set() } = {}) {
    const paths = [];

    Object.entries(attributes).forEach(([name, attribute]) => {
      const path = prefix ? `${prefix}.${name}` : name;

      if (this.isSearchableAttribute(name, attribute)) {
        paths.push(path);
        return;
      }

      if (attribute.type !== 'component' || depth >= maxDepth) return;

      const component = strapi.components[attribute.component];
      if (!component || visited.has(attribute.component)) return;

      paths.push(
        ...this.collectFieldPaths(component.attributes, {
          maxDepth,
          depth: depth + 1,
          prefix: path,
          visited: new Set([...visited, attribute.component]),
        })
      );
    });

    return paths;
  },

  /** Resolves the field the Content Manager uses to label an entry. */
  async resolveMainField(contentType) {
    try {
      const configuration = await strapi
        .plugin('content-manager')
        .service('content-types')
        .findConfiguration(contentType);

      const mainField = configuration && configuration.settings && configuration.settings.mainField;

      if (mainField && mainField !== 'id' && contentType.attributes[mainField]) {
        return mainField;
      }
    } catch (error) {
      strapi.log.debug(
        `[${PLUGIN_ID}] could not read Content-Manager configuration for ${contentType.uid}: ${error.message}`
      );
    }

    const fallback = MAIN_FIELD_FALLBACKS.find((name) =>
      this.isSearchableAttribute(name, contentType.attributes[name])
    );

    return fallback || 'id';
  },

  async describeContentType(uid, settings) {
    const contentType = strapi.contentTypes[uid];
    if (!contentType) return null;

    const attributes = contentType.attributes || {};
    const excludedForType = new Set(
      (settings.excludedFields || [])
        .filter((entry) => entry.startsWith(`${uid}:`))
        .map((entry) => entry.slice(uid.length + 1))
    );

    const allPaths = this.collectFieldPaths(attributes, { maxDepth: settings.maxDepth }).filter(
      (path) => !excludedForType.has(path)
    );

    const mainField = await this.resolveMainField(contentType);

    const idFields = [
      'documentId',
      ...IDENTIFIER_FIELDS.filter((name) => this.isSearchableAttribute(name, attributes[name])),
    ];

    const topLevelFields = allPaths.filter(
      (path) => !path.includes('.') && path !== mainField && !idFields.includes(path)
    );

    const nestedFields = settings.deep ? allPaths.filter((path) => path.includes('.')) : [];

    return {
      uid,
      kind: contentType.kind || 'collectionType',
      displayName:
        (contentType.info && (contentType.info.displayName || contentType.info.singularName)) || uid,
      apiName: contentType.apiName,
      mainField,
      idFields,
      topLevelFields,
      nestedFields,
      localized: Boolean(
        contentType.pluginOptions &&
          contentType.pluginOptions.i18n &&
          contentType.pluginOptions.i18n.localized
      ),
      draftAndPublish: Boolean(contentType.options && contentType.options.draftAndPublish),
      /** Nothing to match against — the type is listed but never queried. */
      searchable:
        idFields.length > 0 ||
        topLevelFields.length > 0 ||
        nestedFields.length > 0 ||
        this.isSearchableAttribute(mainField, attributes[mainField]),
    };
  },

  async getSearchableContentTypes({ force = false } = {}) {
    const settings = await strapi.plugin(PLUGIN_ID).service('settings').get();

    if (cache && !force && cache.signature === JSON.stringify(settings)) {
      return cache.types;
    }

    const excluded = new Set(settings.excludedContentTypes || []);

    const described = await Promise.all(
      this.listCandidateUids()
        .filter((uid) => !excluded.has(uid))
        .map((uid) => this.describeContentType(uid, settings))
    );

    const types = described
      .filter((type) => type && type.searchable)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    cache = { signature: JSON.stringify(settings), types };

    return types;
  },

  /** Every `api::` type, searchable or not — the Settings page needs the full list. */
  async getAllContentTypes() {
    const settings = await strapi.plugin(PLUGIN_ID).service('settings').get();
    const described = await Promise.all(
      this.listCandidateUids().map((uid) => this.describeContentType(uid, settings))
    );

    return described.filter(Boolean).sort((a, b) => a.displayName.localeCompare(b.displayName));
  },

  clearCache() {
    cache = null;
  },
});
