'use strict';

const { PLUGIN_ID } = require('../utils/constants');

module.exports = ({ strapi }) => ({
  async find(ctx) {
    ctx.body = await strapi.plugin(PLUGIN_ID).service('settings').get();
  },

  async update(ctx) {
    try {
      ctx.body = await strapi.plugin(PLUGIN_ID).service('settings').set(ctx.request.body || {});
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  async reset(ctx) {
    ctx.body = await strapi.plugin(PLUGIN_ID).service('settings').reset();
  },
});
