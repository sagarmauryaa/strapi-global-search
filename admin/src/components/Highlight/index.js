import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@strapi/design-system';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Marks every occurrence of the query inside a snippet, case-insensitively. */
const Highlight = ({ text, query, textColor }) => {
  if (!text) return null;
  if (!query) return <Typography textColor={textColor}>{text}</Typography>;

  const parts = String(text).split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  const lowered = query.toLowerCase();

  return (
    <Typography textColor={textColor}>
      {parts.map((part, index) =>
        part.toLowerCase() === lowered ? (
          // eslint-disable-next-line react/no-array-index-key
          <Typography key={index} fontWeight="bold" textColor="primary600">
            {part}
          </Typography>
        ) : (
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </Typography>
  );
};

Highlight.defaultProps = {
  query: '',
  textColor: 'neutral600',
};

Highlight.propTypes = {
  text: PropTypes.string.isRequired,
  query: PropTypes.string,
  textColor: PropTypes.string,
};

export default Highlight;
