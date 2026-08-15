'use strict';

const { PLUGIN_ID } = require('../utils/constants');

/** Field paths are internal detail; the admin only needs counts and labels. */
const toSummary = (type) => ({
  uid: type.uid,
  kind: type.kind,
  displayName: type.displayName,
  mainField: type.mainField,
  localized: type.localized,
  draftAndPublish: type.draftAndPublish,
  fieldCount: type.idFields.length + type.topLevelFields.length + type.nestedFields.length,
  searchable: type.searchable,
});

module.exports = ({ strapi }) => ({
  /** Powers the content-type filter chips on the search page. */
  async find(ctx) {
    const types = await strapi.plugin(PLUGIN_ID).service('schema').getSearchableContentTypes();
    const readable = strapi
      .plugin(PLUGIN_ID)
      .service('permissions')
      .filterReadableTypes(types, ctx.state.userAbility);

    const settings = await strapi.plugin(PLUGIN_ID).service('settings').get();

    ctx.body = {
      contentTypes: readable.map(toSummary),
      settings: { minChars: settings.minChars, debounce: settings.debounce },
    };
  },

  /** Full picture, including excluded and unsearchable types, for Settings. */
  async findAll(ctx) {
    const types = await strapi.plugin(PLUGIN_ID).service('schema').getAllContentTypes();
    const settings = await strapi.plugin(PLUGIN_ID).service('settings').get();

    ctx.body = {
      contentTypes: types.map((type) => ({
        ...toSummary(type),
        excluded: (settings.excludedContentTypes || []).includes(type.uid),
        fields: [...type.idFields, ...type.topLevelFields, ...type.nestedFields],
      })),
    };
  },
});
