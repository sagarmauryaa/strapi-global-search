'use strict';

const schema = require('./schema');
const query = require('./query');
const ranking = require('./ranking');
const permissions = require('./permissions');
const settings = require('./settings');
const search = require('./search');

module.exports = {
  schema,
  query,
  ranking,
  permissions,
  settings,
  search,
};
