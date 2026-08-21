import { MAX_QUERY_LENGTH, SNIPPET_RADIUS } from './constants';

/**
 * `$containsi` is compiled to `LIKE %value%` with the value bound as a parameter,
 * so there is no injection surface — but `%` is still a wildcard inside the bound
 * value and a lone `%` would match every row. Strip it and cap the length.
 */
export const sanitizeQuery = (raw: unknown): string => {
  if (typeof raw !== 'string') return '';
  return raw.replace(/%/g, '').trim().slice(0, MAX_QUERY_LENGTH);
};

/** Rough plain-text projection of richtext/HTML, used for result snippets only. */
export const toPlainText = (value: unknown): string =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_>`~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Walks a dotted path, transparently flattening arrays so repeatable components
 * yield every one of their values.
 */
export const collectValues = (node: unknown, parts: string[]): string[] => {
  if (node === null || node === undefined) return [];
  if (Array.isArray(node)) return node.flatMap((item) => collectValues(item, parts));
  if (parts.length === 0) {
    if (typeof node === 'string') return [node];
    if (typeof node === 'number') return [String(node)];
    return [];
  }
  if (typeof node !== 'object') return [];
  return collectValues((node as Record<string, unknown>)[parts[0]], parts.slice(1));
};

export const getValuesAtPath = (entry: unknown, path: string): string[] =>
  collectValues(entry, path.split('.'));

/** Extracts a short excerpt centred on the match, for highlighting in the UI. */
export const buildSnippet = (value: unknown, query: string): string => {
  const text = toPlainText(value);
  const index = text.toLowerCase().indexOf(query.toLowerCase());

  if (index === -1) {
    return text.length > SNIPPET_RADIUS * 2 ? `${text.slice(0, SNIPPET_RADIUS * 2)}…` : text;
  }

  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(text.length, index + query.length + SNIPPET_RADIUS);

  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
};

export const humanizeFieldPath = (path: string): string =>
  path
    .split('.')
    .map((segment) =>
      segment
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/^./, (c) => c.toUpperCase())
    )
    .join(' › ');
