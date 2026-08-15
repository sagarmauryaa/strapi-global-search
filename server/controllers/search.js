'use strict';

const { PLUGIN_ID } = require('../utils/constants');

/** `?types[]=a&types[]=b` and `?types=a,b` are both accepted. */
const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

module.exports = ({ strapi }) => ({
  async find(ctx) {
    const { q, types, locale, page, pageSize } = ctx.request.query;

    try {
      ctx.body = await strapi.plugin(PLUGIN_ID).service('search').search({
        query: q,
        types: toArray(types),
        locale,
        page,
        pageSize,
        userAbility: ctx.state.userAbility,
      });
    } catch (error) {
      strapi.log.error(`[${PLUGIN_ID}] search request failed: ${error.stack || error.message}`);
      ctx.throw(500, 'Global search failed. Check the server logs for details.');
    }
  },
});
