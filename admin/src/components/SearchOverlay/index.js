import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Box,
  Divider,
  Flex,
  Loader,
  ModalBody,
  ModalLayout,
  TextInput,
  Typography,
  VisuallyHidden,
} from '@strapi/design-system';
import { Search } from '@strapi/icons';
import useGlobalSearch from '../../hooks/useGlobalSearch';
import useSearchableTypes from '../../hooks/useSearchableTypes';
import { toAdminUrl } from '../../utils/adminBase';
import ResultItem from '../ResultItem';

const ResultsScroller = styled(Box)`
  max-height: 45vh;
  overflow-y: auto;
`;

const PALETTE_PAGE_SIZE = 30;

/**
 * Straplight-style command palette. It is rendered outside the admin's React
 * tree, so navigation is a full URL assignment rather than a router push.
 */
const SearchOverlay = ({ onClose }) => {
  const { settings } = useSearchableTypes();
  const search = useGlobalSearch({
    debounce: settings.debounce || 250,
    minChars: settings.minChars || 2,
    pageSize: PALETTE_PAGE_SIZE,
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const results = useMemo(() => search.data.results || [], [search.data]);

  // The design system's focus trap grabs focus first; take it back on the next tick.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current && inputRef.current.focus(), 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [search.query, results.length]);

  const open = (hit, newTab = false) => {
    if (!hit) return;

    const url = toAdminUrl(hit.adminUrl);

    if (newTab) {
      window.open(url, '_blank', 'noopener');
      return;
    }

    onClose();
    window.location.assign(url);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (results.length ? (index - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      open(results[activeIndex], event.metaKey || event.ctrlKey);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  const renderBody = () => {
    if (search.isBelowMinChars) {
      return (
        <Box padding={6}>
          <Typography textColor="neutral500">
            Type at least {settings.minChars || 2} characters to search.
          </Typography>
        </Box>
      );
    }

    if (search.status === 'idle') {
      return (
        <Box padding={6}>
          <Typography textColor="neutral500">
            Search every collection type and single type by id, name, or any text field.
          </Typography>
        </Box>
      );
    }

    if (search.status === 'error') {
      return (
        <Box padding={6}>
          <Typography textColor="danger600">
            Search failed. Check that you have permission to read content, and see the server logs.
          </Typography>
        </Box>
      );
    }

    if (search.status === 'loading' && !results.length) {
      return (
        <Flex justifyContent="center" padding={6}>
          <Loader small>Searching…</Loader>
        </Flex>
      );
    }

    if (!results.length) {
      return (
        <Box padding={6}>
          <Typography textColor="neutral500">No results for “{search.query}”.</Typography>
        </Box>
      );
    }

    return (
      <ResultsScroller role="listbox" aria-label="Search results">
        {results.map((hit, index) => (
          <ResultItem
            key={`${hit.contentTypeUid}-${hit.id}-${hit.locale || ''}`}
            hit={hit}
            query={search.query.trim()}
            isActive={index === activeIndex}
            onSelect={open}
            onHover={() => setActiveIndex(index)}
          />
        ))}
      </ResultsScroller>
    );
  };

  return (
    <ModalLayout onClose={onClose} labelledBy="global-search-palette-title">
      <Box onKeyDown={onKeyDown}>
        {/* `labelledBy` needs an element with text, which an input has none of. */}
        <VisuallyHidden>
          <Typography id="global-search-palette-title">Global search</Typography>
        </VisuallyHidden>

        <Box paddingLeft={4} paddingRight={4} paddingTop={4} paddingBottom={3}>
          <TextInput
            ref={inputRef}
            name="global-search-palette"
            id="global-search-palette-input"
            aria-label="Global search"
            placeholder="Search all content…"
            startAction={<Search aria-hidden />}
            value={search.query}
            onChange={(event) => search.setQuery(event.target.value)}
            autoComplete="off"
          />
        </Box>

        <Divider />

        <ModalBody padding={0}>{renderBody()}</ModalBody>

        <Divider />

        <Flex justifyContent="space-between" padding={3} paddingLeft={4} paddingRight={4}>
          <Typography variant="pi" textColor="neutral500">
            ↑ ↓ navigate · ↵ open · ⌘/Ctrl + ↵ new tab · esc close
          </Typography>
          {search.status === 'success' && search.data.pagination.total > 0 ? (
            <Typography variant="pi" textColor="neutral500">
              {search.data.pagination.total} result{search.data.pagination.total === 1 ? '' : 's'}
              {search.data.meta.capped ? '+' : ''}
            </Typography>
          ) : null}
        </Flex>
      </Box>
    </ModalLayout>
  );
};

SearchOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default SearchOverlay;
