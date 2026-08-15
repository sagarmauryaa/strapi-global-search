import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  ContentLayout,
  Flex,
  Grid,
  GridItem,
  HeaderLayout,
  Main,
  NumberInput,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  ToggleInput,
  Tr,
  Typography,
} from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { LoadingIndicatorPage, useNotification, useRBAC } from '@strapi/helper-plugin';
import { fetchAllTypes, fetchSettings, resetSettings, updateSettings } from '../../api/searchApi';
import { invalidateSearchableTypes } from '../../hooks/useSearchableTypes';
import pluginPermissions from '../../permissions';

const NUMBER_FIELDS = [
  { name: 'minChars', label: 'Minimum characters', hint: 'Shorter queries are not sent to the server.' },
  { name: 'debounce', label: 'Debounce (ms)', hint: 'How long to wait after the last keystroke.' },
  { name: 'perTypeLimit', label: 'Results per content type', hint: 'Rows fetched from each type.' },
  { name: 'maxResults', label: 'Maximum results', hint: 'Hard cap on the merged, ranked list.' },
  { name: 'maxDepth', label: 'Component depth', hint: 'How many component levels to search into.' },
  { name: 'queryTimeout', label: 'Query timeout (ms)', hint: 'A slower content type is skipped.' },
];

const SettingsPage = () => {
  const toggleNotification = useNotification();
  const { allowedActions } = useRBAC(pluginPermissions);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [contentTypes, setContentTypes] = useState([]);

  const canEdit = allowedActions.canSettings !== false;

  const load = async () => {
    setIsLoading(true);

    try {
      const [nextSettings, schema] = await Promise.all([fetchSettings(), fetchAllTypes()]);

      setSettings(nextSettings);
      setContentTypes(schema.contentTypes || []);
    } catch (error) {
      toggleNotification({ type: 'warning', message: 'Could not load global search settings.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (name, value) => setSettings((previous) => ({ ...previous, [name]: value }));

  const toggleContentType = (uid) => {
    setSettings((previous) => {
      const excluded = previous.excludedContentTypes || [];

      return {
        ...previous,
        excludedContentTypes: excluded.includes(uid)
          ? excluded.filter((item) => item !== uid)
          : [...excluded, uid],
      };
    });
  };

  const save = async () => {
    setIsSaving(true);

    try {
      const saved = await updateSettings(settings);

      setSettings(saved);
      invalidateSearchableTypes();
      toggleNotification({ type: 'success', message: 'Global search settings saved.' });
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.error &&
          error.response.data.error.message) ||
        'Could not save global search settings.';

      toggleNotification({ type: 'warning', message });
    } finally {
      setIsSaving(false);
    }
  };

  const restoreDefaults = async () => {
    setIsSaving(true);

    try {
      setSettings(await resetSettings());
      invalidateSearchableTypes();
      toggleNotification({ type: 'success', message: 'Defaults restored.' });
    } catch (error) {
      toggleNotification({ type: 'warning', message: 'Could not restore defaults.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) return <LoadingIndicatorPage />;

  const excluded = settings.excludedContentTypes || [];

  return (
    <Main>
      <HeaderLayout
        title="Global Search"
        subtitle="Tune how the search page and the Ctrl/Cmd + K palette query your content."
        primaryAction={
          <Flex gap={2}>
            <Button variant="tertiary" onClick={restoreDefaults} disabled={!canEdit || isSaving}>
              Restore defaults
            </Button>
            <Button startIcon={<Check />} onClick={save} loading={isSaving} disabled={!canEdit}>
              Save
            </Button>
          </Flex>
        }
      />

      <ContentLayout>
        <Flex direction="column" alignItems="stretch" gap={6}>
          <Box background="neutral0" padding={6} hasRadius shadow="tableShadow">
            <Typography variant="delta">Search behaviour</Typography>

            <Box paddingTop={4}>
              <Grid gap={4}>
                {NUMBER_FIELDS.map((field) => (
                  <GridItem key={field.name} col={4} s={12}>
                    <NumberInput
                      name={field.name}
                      label={field.label}
                      hint={field.hint}
                      value={settings[field.name]}
                      onValueChange={(value) => setField(field.name, value)}
                      disabled={!canEdit}
                    />
                  </GridItem>
                ))}

                <GridItem col={4} s={12}>
                  <ToggleInput
                    name="deep"
                    label="Search inside components"
                    hint="Also match fields nested in components."
                    onLabel="On"
                    offLabel="Off"
                    checked={Boolean(settings.deep)}
                    onChange={(event) => setField('deep', event.target.checked)}
                    disabled={!canEdit}
                  />
                </GridItem>

                <GridItem col={4} s={12}>
                  <ToggleInput
                    name="includeDrafts"
                    label="Include drafts"
                    hint="Search unpublished entries too."
                    onLabel="On"
                    offLabel="Off"
                    checked={Boolean(settings.includeDrafts)}
                    onChange={(event) => setField('includeDrafts', event.target.checked)}
                    disabled={!canEdit}
                  />
                </GridItem>
              </Grid>
            </Box>
          </Box>

          <Box background="neutral0" padding={6} hasRadius shadow="tableShadow">
            <Typography variant="delta">Content types</Typography>
            <Box paddingTop={1} paddingBottom={4}>
              <Typography textColor="neutral600" variant="pi">
                Every API content type is discovered automatically. Turn one off to exclude it from
                search results.
              </Typography>
            </Box>

            <Table colCount={5} rowCount={contentTypes.length}>
              <Thead>
                <Tr>
                  <Th>
                    <Typography variant="sigma">Content type</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Kind</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Main field</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Searchable fields</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Enabled</Typography>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {contentTypes.map((type) => (
                  <Tr key={type.uid}>
                    <Td>
                      <Box>
                        <Typography textColor="neutral800" fontWeight="semiBold">
                          {type.displayName}
                        </Typography>
                        <Box>
                          <Typography variant="pi" textColor="neutral500">
                            {type.uid}
                          </Typography>
                        </Box>
                      </Box>
                    </Td>
                    <Td>
                      <Typography textColor="neutral600">
                        {type.kind === 'singleType' ? 'Single' : 'Collection'}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography textColor="neutral600">{type.mainField}</Typography>
                    </Td>
                    <Td>
                      <Typography textColor={type.searchable ? 'neutral600' : 'danger600'}>
                        {type.searchable ? type.fieldCount : 'none'}
                      </Typography>
                    </Td>
                    <Td>
                      <ToggleInput
                        name={`enabled-${type.uid}`}
                        aria-label={`Enable search for ${type.displayName}`}
                        label=""
                        onLabel="On"
                        offLabel="Off"
                        checked={!excluded.includes(type.uid)}
                        onChange={() => toggleContentType(type.uid)}
                        disabled={!canEdit || !type.searchable}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Flex>
      </ContentLayout>
    </Main>
  );
};

export default SettingsPage;
