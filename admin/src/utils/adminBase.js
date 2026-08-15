/**
 * The Cmd+K palette is mounted outside the admin's React tree, so it has no
 * router to push to and must build absolute URLs itself. The admin path is
 * configurable (`config/admin.js` -> `url`), but webpack's public path always
 * points at the admin build, which is exactly that base.
 */
export const getAdminBase = () => {
  try {
    // eslint-disable-next-line camelcase, no-undef
    const publicPath = typeof __webpack_public_path__ !== 'undefined' ? __webpack_public_path__ : '';

    if (typeof publicPath === 'string' && publicPath && publicPath !== 'auto') {
      return publicPath.endsWith('/') ? publicPath : `${publicPath}/`;
    }
  } catch (error) {
    // Not bundled by webpack — fall through to the default admin path.
  }

  return '/admin/';
};

export const toAdminUrl = (path) => `${getAdminBase()}${String(path).replace(/^\//, '')}`;
