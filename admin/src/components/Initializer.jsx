import { useEffect, useRef } from 'react';
import pluginId from '../pluginId';

/**
 * Strapi unmounts initializers as soon as every plugin reports ready, so this
 * only flips the ready flag — the always-on Cmd+K palette is mounted from
 * `bootstrap()` into its own root instead.
 */
const Initializer = ({ setPlugin }) => {
  const ref = useRef(setPlugin);

  useEffect(() => {
    ref.current(pluginId);
  }, []);

  return null;
};

export { Initializer };
