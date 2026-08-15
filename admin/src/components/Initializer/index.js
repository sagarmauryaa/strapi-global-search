import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import pluginId from '../../pluginId';

/**
 * Strapi v4 unmounts initializers as soon as every plugin reports ready, so this
 * only flips the ready flag — the always-on Cmd+K palette is mounted from
 * `bootstrap()` into its own root instead. See components/GlobalSearchPortal.
 */
const Initializer = ({ setPlugin }) => {
  const ref = useRef(setPlugin);

  useEffect(() => {
    ref.current(pluginId);
  }, []);

  return null;
};

Initializer.propTypes = {
  setPlugin: PropTypes.func.isRequired,
};

export default Initializer;
