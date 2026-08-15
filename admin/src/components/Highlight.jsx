import React from 'react';
import { Typography } from '@strapi/design-system';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Marks every occurrence of the query inside a snippet, case-insensitively. */
const Highlight = ({ text, query = '', textColor = 'neutral600' }) => {
  if (!text) return null;
  if (!query) return <Typography textColor={textColor}>{text}</Typography>;

  const parts = String(text).split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  const lowered = query.toLowerCase();

  return (
    <Typography textColor={textColor}>
      {parts.map((part, index) =>
        part.toLowerCase() === lowered ? (
          <Typography key={`${part}-${index}`} fontWeight="bold" textColor="primary600">
            {part}
          </Typography>
        ) : (
          <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
        )
      )}
    </Typography>
  );
};

export { Highlight };
