'use strict';

const { PLUGIN_ID } = require('./utils/constants');

module.exports = async ({ strapi }) => {
  // Warm the schema cache so the first keystroke does not pay for introspection,
  // and surface a misconfigured install in the boot logs rather than at search time.
  try {
    const types = await strapi.plugin(PLUGIN_ID).service('schema').getSearchableContentTypes();

    strapi.log.debug(
      `[${PLUGIN_ID}] indexed ${types.length} content type(s) for search: ${types
        .map((type) => type.uid)
        .join(', ')}`
    );
  } catch (error) {
    strapi.log.error(`[${PLUGIN_ID}] failed to introspect content types: ${error.message}`);
  }
};
