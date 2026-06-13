import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as client from '../graphql/client';
import { TagsRoute } from './tags';

const tagKeys = [
  { key: 'Project', valueCount: 1 },
  { key: 'Environment', valueCount: 1 },
];

const tagValuesByKey = {
  Environment: [{ key: 'Environment', value: 'lab', resourceCount: 4 }],
  Project: [{ key: 'Project', value: 'ci-practice', resourceCount: 4 }],
};

function renderTagsRoute() {
  render(
    <MemoryRouter>
      <TagsRoute />
    </MemoryRouter>,
  );
}

function mockTagGroups() {
  return vi.spyOn(client, 'graphqlRequest').mockImplementation(async (query, variables) => {
    if (query.includes('tagKeys')) {
      return { tagKeys };
    }

    return {
      tagValues: tagValuesByKey[variables?.key as keyof typeof tagValuesByKey] ?? [],
    };
  });
}

describe('TagsRoute', () => {
  it('loads tag keys', async () => {
    const request = mockTagGroups();

    renderTagsRoute();

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(expect.stringContaining('tagKeys'), undefined, expect.any(Object)),
    );
  });

  it('loads values for each tag key', async () => {
    const request = mockTagGroups();

    renderTagsRoute();

    await screen.findByRole('heading', { name: 'My tags' });
    expect(request).toHaveBeenCalledWith(expect.stringContaining('tagValues'), { key: 'Project' }, expect.any(Object));
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('tagValues'),
      { key: 'Environment' },
      expect.any(Object),
    );
  });

  it('renders tag key/value groups', async () => {
    mockTagGroups();

    renderTagsRoute();

    expect(await screen.findByRole('heading', { name: 'Project' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Environment' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ci-practice' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'lab' })).toBeInTheDocument();
  });

  it('links values to /tags/:key/:value', async () => {
    mockTagGroups();

    renderTagsRoute();

    expect(await screen.findByRole('link', { name: 'ci-practice' })).toHaveAttribute(
      'href',
      '/tags/Project/ci-practice',
    );
    expect(screen.getByRole('link', { name: 'lab' })).toHaveAttribute('href', '/tags/Environment/lab');
  });

  it('renders loading state', () => {
    vi.spyOn(client, 'graphqlRequest').mockImplementation(() => new Promise(() => undefined));

    renderTagsRoute();

    expect(screen.getByText('Loading tags')).toBeInTheDocument();
  });

  it('renders empty state', async () => {
    vi.spyOn(client, 'graphqlRequest').mockResolvedValue({ tagKeys: [] });

    renderTagsRoute();

    expect(await screen.findByText('No tags found.')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    vi.spyOn(client, 'graphqlRequest').mockRejectedValue(new Error('Tag request failed'));

    renderTagsRoute();

    expect(await screen.findByText('Tag request failed')).toBeInTheDocument();
  });
});
