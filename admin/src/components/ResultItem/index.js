import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Badge, Box, Flex, Typography } from '@strapi/design-system';
import Highlight from '../Highlight';

const Row = styled(Box)`
  cursor: pointer;
  border-left: 3px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary600 : 'transparent')};
  background: ${({ theme, $active }) => ($active ? theme.colors.primary100 : 'transparent')};

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? theme.colors.primary100 : theme.colors.neutral100};
  }
`;

/** One hit in the Cmd+K palette: identity first, then what actually matched. */
const ResultItem = ({ hit, query, isActive, onSelect, onHover }) => (
  <Row
    $active={isActive}
    paddingTop={3}
    paddingBottom={3}
    paddingLeft={4}
    paddingRight={4}
    onClick={() => onSelect(hit)}
    onMouseEnter={onHover}
    role="option"
    aria-selected={isActive}
    id={`global-search-option-${hit.contentTypeUid}-${hit.id}`}
  >
    <Flex justifyContent="space-between" gap={4} alignItems="flex-start">
      <Box style={{ minWidth: 0, flex: 1 }}>
        <Flex gap={2} alignItems="center">
          <Typography fontWeight="semiBold" textColor="neutral800" ellipsis>
            {hit.title}
          </Typography>
          <Typography variant="pi" textColor="neutral500">
            #{hit.documentId || hit.id}
          </Typography>
        </Flex>

        {hit.matchedSnippet && hit.matchedField !== hit.mainField ? (
          <Box paddingTop={1}>
            <Typography variant="pi" textColor="neutral500">
              {hit.matchedFieldLabel}:{' '}
            </Typography>
            <Typography variant="pi" as="span">
              <Highlight text={hit.matchedSnippet} query={query} />
            </Typography>
          </Box>
        ) : null}
      </Box>

      <Flex gap={2} alignItems="center" shrink={0}>
        {hit.locale ? (
          <Typography variant="pi" textColor="neutral500">
            {hit.locale}
          </Typography>
        ) : null}
        {hit.status ? (
          <Badge backgroundColor={hit.status === 'published' ? 'success100' : 'secondary100'}>
            {hit.status}
          </Badge>
        ) : null}
        <Typography variant="pi" textColor="neutral600">
          {hit.contentTypeLabel}
        </Typography>
      </Flex>
    </Flex>
  </Row>
);

ResultItem.defaultProps = {
  onHover: () => {},
};

ResultItem.propTypes = {
  hit: PropTypes.object.isRequired,
  query: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onHover: PropTypes.func,
};

export default ResultItem;
