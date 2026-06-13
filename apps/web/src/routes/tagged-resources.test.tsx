import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as client from '../graphql/client';
import { TaggedResourcesRoute } from './tagged-resources';

const resourcesByTag = [
  {
    arn: 'arn:aws:s3:::ci-practice-reports-535337619181',
    service: 's3',
    type: null,
    region: null,
    accountId: null,
    name: 'ci-practice-reports-535337619181',
    tags: [
      { key: 'Project', value: 'ci-practice' },
      { key: 'Environment', value: 'lab' },
    ],
  },
  {
    arn: 'arn:aws:ecr:eu-north-1:535337619181:repository/ecr-repo-practice',
    service: 'ecr',
    type: 'repository',
    region: 'eu-north-1',
    accountId: '535337619181',
    name: 'ecr-repo-practice',
    tags: [{ key: 'Project', value: 'ci-practice' }],
  },
];

function renderTaggedResourcesRoute(path = '/tags/Project/ci-practice') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<TaggedResourcesRoute />} path="/tags/:key/:value" />
      </Routes>
    </MemoryRouter>,
  );
}

function mockTaggedResources() {
  return vi.spyOn(client, 'graphqlRequest').mockResolvedValue({ resourcesByTag });
}

describe('TaggedResourcesRoute', () => {
  it('queries resources by route tag key and value', async () => {
    const request = mockTaggedResources();

    renderTaggedResourcesRoute();

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        expect.stringContaining('resourcesByTag'),
        { key: 'Project', value: 'ci-practice' },
        expect.any(Object),
      ),
    );
  });

  it('renders matching resources', async () => {
    mockTaggedResources();

    renderTaggedResourcesRoute();

    expect(await screen.findByRole('heading', { name: 'Project=ci-practice' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ci-practice-reports-535337619181' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ecr-repo-practice' })).toBeInTheDocument();
    expect(screen.getByText('ecr / repository / eu-north-1')).toBeInTheDocument();
    expect(screen.getByText('arn:aws:s3:::ci-practice-reports-535337619181')).toBeInTheDocument();
  });

  it('renders resource tags', async () => {
    mockTaggedResources();

    renderTaggedResourcesRoute();

    await screen.findByRole('heading', { name: 'Project=ci-practice' });
    expect(screen.getAllByText('Project=ci-practice')).toHaveLength(3);
    expect(screen.getByText('Environment=lab')).toBeInTheDocument();
  });

  it('masks account ids in rendered resource text when screenshot privacy mode is enabled', async () => {
    const request = mockTaggedResources();
    vi.stubEnv('VITE_MY_AWS_MASK_ACCOUNT_IDS', 'true');

    renderTaggedResourcesRoute();

    expect(await screen.findByRole('heading', { name: 'ci-practice-reports-*****' })).toBeInTheDocument();
    expect(screen.getByText('arn:aws:ecr:eu-north-1:*****:repository/ecr-repo-practice')).toBeInTheDocument();
    expect(screen.getByText('*****')).toBeInTheDocument();
    expect(screen.queryByText('535337619181')).not.toBeInTheDocument();
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('resourcesByTag'),
      { key: 'Project', value: 'ci-practice' },
      expect.any(Object),
    );
  });

  it('renders loading state', () => {
    vi.spyOn(client, 'graphqlRequest').mockImplementation(() => new Promise(() => undefined));

    renderTaggedResourcesRoute();

    expect(screen.getByText('Loading tagged resources')).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    vi.spyOn(client, 'graphqlRequest').mockResolvedValue({ resourcesByTag: [] });

    renderTaggedResourcesRoute('/tags/Owner/stef');

    expect(await screen.findByText('No resources found.')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    vi.spyOn(client, 'graphqlRequest').mockRejectedValue(new Error('Resource request failed'));

    renderTaggedResourcesRoute();

    expect(await screen.findByText('Resource request failed')).toBeInTheDocument();
  });
});
