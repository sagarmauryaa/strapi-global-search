'use strict';

/** Rejects if `factory()` has not settled within `ms`. Always clears its timer. */
const withTimeout = (factory, ms, label) => {
  let timer;

  return Promise.race([
    Promise.resolve()
      .then(factory)
      .finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`GLOBAL_SEARCH_TIMEOUT:${label}`)), ms);
    }),
  ]);
};

/**
 * Runs `worker` over `items` with at most `concurrency` in flight, so an app with
 * 60 content types cannot exhaust the database pool on a single keystroke.
 */
const mapWithConcurrency = async (items, concurrency, worker) => {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);

  return results;
};

module.exports = { withTimeout, mapWithConcurrency };
