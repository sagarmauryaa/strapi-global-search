'use strict';

const PLUGIN_ID = 'global-search';

/**
 * Attribute types whose stored value is a plain string, i.e. the ones the query
 * engine can match with `$containsi`.
 */
const SEARCHABLE_SCALAR_TYPES = ['string', 'text', 'richtext', 'uid', 'email', 'enumeration'];

/**
 * Attribute types we deliberately never walk into.
 * - dynamiczone / blocks: Strapi v4's query engine cannot filter polymorphic JSON.
 * - relation / media: would explode the join graph; relations are shown, not searched.
 */
const SKIPPED_ATTRIBUTE_TYPES = ['dynamiczone', 'blocks', 'json', 'relation', 'media', 'password'];

/** Attribute names that must never leave the server, whatever their type. */
const BLOCKLISTED_ATTRIBUTE_NAMES = [
  'password',
  'resetPasswordToken',
  'registrationToken',
  'confirmationToken',
];

/**
 * String attributes that identify an entry. `id` is handled separately because
 * it is numeric in v4. `documentId` is not native to v4 but is matched when a
 * schema happens to declare it, which keeps this plugin working on v5-style schemas.
 */
const IDENTIFIER_FIELDS = ['documentId', 'uid', 'slug', 'code', 'key'];

/** Used when the Content-Manager configuration has no mainField for a type. */
const MAIN_FIELD_FALLBACKS = [
  'name',
  'title',
  'label',
  'displayName',
  'heading',
  'subject',
  'slug',
];

/** Ranking tiers — lower wins. Mirrors the documented ordering rule. */
const TIER = {
  ID_EXACT: 0,
  ID_CONTAINS: 1,
  MAIN_EXACT: 2,
  MAIN_STARTS_WITH: 3,
  MAIN_CONTAINS: 4,
  FIELD_CONTAINS: 5,
  NESTED_CONTAINS: 6,
  UNKNOWN: 7,
};

const TIER_LABELS = {
  0: 'id:exact',
  1: 'id:partial',
  2: 'name:exact',
  3: 'name:starts-with',
  4: 'name:partial',
  5: 'field',
  6: 'nested-field',
  7: 'other',
};

const MAX_QUERY_LENGTH = 200;
const SNIPPET_RADIUS = 45;

module.exports = {
  PLUGIN_ID,
  SEARCHABLE_SCALAR_TYPES,
  SKIPPED_ATTRIBUTE_TYPES,
  BLOCKLISTED_ATTRIBUTE_NAMES,
  IDENTIFIER_FIELDS,
  MAIN_FIELD_FALLBACKS,
  TIER,
  TIER_LABELS,
  MAX_QUERY_LENGTH,
  SNIPPET_RADIUS,
};
