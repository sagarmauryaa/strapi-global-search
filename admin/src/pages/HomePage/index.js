import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import {
  Badge,
  Box,
  Button,
  ContentLayout,
  Flex,
  HeaderLayout,
  Loader,
  Main,
  Option,
  Searchbar,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Typography,
} from '@strapi/design-system';
import { useFocusWhenNavigate } from '@strapi/helper-plugin';
import useGlobalSearch from '../../hooks/useGlobalSearch';
import useSearchableTypes from '../../hooks/useSearchableTypes';
import { fetchLocales } from '../../api/searchApi';
import Highlight from '../../components/Highlight';

const ClickableRow = styled(Tr)`
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.neutral100};
  }
`;

const Chip = styled(Box)`
  cursor: pointer;
  border-radius: 16px;
  border: 1px solid
    ${({ theme, $selected }) => ($selected ? theme.colors.primary600 : theme.colors.neutral200)};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary100 : theme.colors.neutral0};
`;

const PAGE_SIZES = [10, 20, 50];

const HomePage = () => {
  useFocusWhenNavigate();

  const history = useHistory();
  const { contentTypes, settings, status: schemaStatus } = useSearchableTypes();
  const [pageSize, setPageSize] = useState(20);
  const [locales, setLocales] = useState([]);

  const search = useGlobalSearch({
    debounce: settings.debounce || 250,
    minChars: settings.minChars || 2,
    pageSize,
  });

  useEffect(() => {
    let cancelled = false;

    fetchLocales().then((data) => {
      if (!cancelled) setLocales(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const { results, groups, pagination, meta } = search.data;
  const minChars = settings.minChars || 2;
  const trimmed = search.query.trim();

  const renderResults = () => {
    if (search.status === 'error') {
      return (
        <Box padding={8} background="neutral0" hasRadius>
          <Typography textColor="danger600">
            Search failed. Check that you have permission to read content, and see the server logs
            for details.
          </Typography>
        </Box>
      );
    }

    if (search.isBelowMinChars || (search.status === 'idle' && !trimmed)) {
      return (
        <Box padding={8} background="neutral0" hasRadius>
          <Typography variant="delta" textColor="neutral600">
            {search.isBelowMinChars
              ? `Type at least ${minChars} characters to search.`
              : 'Search every collection type and single type in this project.'}
          </Typography>
          <Box paddingTop={2}>
            <Typography textColor="neutral500">
              Results are ordered by id, then name, then any other field — including fields nested
              inside components. Press Ctrl/Cmd + K anywhere in the admin to open the quick palette.
            </Typography>
          </Box>
        </Box>
      );
    }

    if (search.status === 'loading' && !results.length) {
      return (
        <Flex justifyContent="center" padding={8}>
          <Loader>Searching…</Loader>
        </Flex>
      );
    }

    if (!results.length) {
      return (
        <Box padding={8} background="neutral0" hasRadius>
          <Typography variant="delta" textColor="neutral600">
            No results for “{trimmed}”.
          </Typography>
          <Box paddingTop={2}>
            <Typography textColor="neutral500">
              {search.selectedTypes.length
                ? 'Try clearing the content type filters.'
                : 'Try a shorter or different term.'}
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Table colCount={7} rowCount={results.length}>
        <Thead>
          <Tr>
            <Th>
              <Typography variant="sigma">Type</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Id</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Name</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Matched</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Locale</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Status</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Updated</Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {results.map((hit) => (
            <ClickableRow
              key={`${hit.contentTypeUid}-${hit.id}-${hit.locale || ''}`}
              onClick={() => history.push(hit.adminUrl)}
            >
              <Td>
                <Typography textColor="neutral800">{hit.contentTypeLabel}</Typography>
              </Td>
              <Td>
                <Typography textColor="neutral600">{hit.documentId || hit.id}</Typography>
              </Td>
              <Td>
                <Typography fontWeight="semiBold" textColor="neutral800">
                  <Highlight text={String(hit.title)} query={trimmed} textColor="neutral800" />
                </Typography>
              </Td>
              <Td>
                {hit.matchedField ? (
                  <Box maxWidth="32rem">
                    <Typography variant="pi" textColor="neutral500">
                      {hit.matchedFieldLabel}
                    </Typography>
                    <Box>
                      <Typography variant="pi">
                        <Highlight text={hit.matchedSnippet || ''} query={trimmed} />
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography textColor="neutral400">—</Typography>
                )}
              </Td>
              <Td>
                <Typography textColor="neutral600">{hit.locale || '—'}</Typography>
              </Td>
              <Td>
                {hit.status ? (
                  <Badge
                    backgroundColor={hit.status === 'published' ? 'success100' : 'secondary100'}
                  >
                    {hit.status}
                  </Badge>
                ) : (
                  <Typography textColor="neutral400">—</Typography>
                )}
              </Td>
              <Td>
                <Typography textColor="neutral600">
                  {hit.updatedAt ? new Date(hit.updatedAt).toLocaleDateString() : '—'}
                </Typography>
              </Td>
            </ClickableRow>
          ))}
        </Tbody>
      </Table>
    );
  };

  return (
    <Main aria-busy={search.status === 'loading'}>
      <HeaderLayout
        title="Global Search"
        subtitle={
          schemaStatus === 'success'
            ? `Searching ${contentTypes.length} content type${contentTypes.length === 1 ? '' : 's'} · press Ctrl/Cmd + K anywhere`
            : 'Discovering content types…'
        }
      />

      <ContentLayout>
        <Flex direction="column" alignItems="stretch" gap={4}>
          <Flex gap={2} alignItems="flex-end">
            <Box grow={1}>
              <Searchbar
                name="global-search"
                value={search.query}
                onChange={(event) => search.setQuery(event.target.value)}
                onClear={() => search.setQuery('')}
                clearLabel="Clear search"
                placeholder="Search by id, name, or any text field…"
              >
                Search all content
              </Searchbar>
            </Box>

            {locales.length > 1 ? (
              <Box minWidth="16rem">
                <Select
                  label="Locale"
                  value={search.locale}
                  onChange={search.setLocale}
                  size="S"
                >
                  <Option value="all">All locales</Option>
                  {locales.map((locale) => (
                    <Option key={locale.code} value={locale.code}>
                      {locale.name || locale.code}
                    </Option>
                  ))}
                </Select>
              </Box>
            ) : null}
          </Flex>

          {contentTypes.length ? (
            <Flex gap={2} wrap="wrap" alignItems="center">
              <Chip
                $selected={search.selectedTypes.length === 0}
                paddingLeft={3}
                paddingRight={3}
                paddingTop={1}
                paddingBottom={1}
                onClick={search.clearTypes}
              >
                <Typography variant="pi" fontWeight="semiBold">
                  All
                </Typography>
              </Chip>

              {contentTypes.map((type) => {
                const selected = search.selectedTypes.includes(type.uid);
                const group = groups.find((item) => item.uid === type.uid);

                return (
                  <Chip
                    key={type.uid}
                    $selected={selected}
                    paddingLeft={3}
                    paddingRight={3}
                    paddingTop={1}
                    paddingBottom={1}
                    onClick={() => search.toggleType(type.uid)}
                  >
                    <Typography variant="pi" fontWeight={selected ? 'semiBold' : 'regular'}>
                      {type.displayName}
                      {group ? ` (${group.count}${group.truncated ? '+' : ''})` : ''}
                    </Typography>
                  </Chip>
                );
              })}
            </Flex>
          ) : null}

          {renderResults()}

          {results.length ? (
            <Flex justifyContent="space-between" alignItems="center">
              <Flex gap={2} alignItems="center">
                <Typography textColor="neutral600" variant="pi">
                  {pagination.total}
                  {meta.capped ? '+' : ''} result{pagination.total === 1 ? '' : 's'} across{' '}
                  {groups.length} content type{groups.length === 1 ? '' : 's'}
                  {meta.truncatedTypes && meta.truncatedTypes.length
                    ? ' · some types returned more than the per-type limit'
                    : ''}
                </Typography>
                <Box minWidth="7rem">
                  <Select
                    aria-label="Results per page"
                    value={pageSize}
                    onChange={setPageSize}
                    size="S"
                  >
                    {PAGE_SIZES.map((size) => (
                      <Option key={size} value={size}>
                        {`${size} / page`}
                      </Option>
                    ))}
                  </Select>
                </Box>
              </Flex>

              <Flex gap={2} alignItems="center">
                <Button
                  variant="tertiary"
                  disabled={pagination.page <= 1}
                  onClick={() => search.setPage(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Typography variant="pi" textColor="neutral600">
                  Page {pagination.page} of {pagination.pageCount || 1}
                </Typography>
                <Button
                  variant="tertiary"
                  disabled={pagination.page >= pagination.pageCount}
                  onClick={() => search.setPage(pagination.page + 1)}
                >
                  Next
                </Button>
              </Flex>
            </Flex>
          ) : null}
        </Flex>
      </ContentLayout>
    </Main>
  );
};

export default HomePage;
