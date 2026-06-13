import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '../App';
import * as client from '../graphql/client';

function renderRoute(path: string) {
  vi.spyOn(client, 'graphqlRequest').mockImplementation(async (query) => {
    if (query.includes('tagKeys')) {
      return { tagKeys: [] };
    }

    if (query.includes('resourcesByTag')) {
      return { resourcesByTag: [] };
    }

    return {
      accountInfo: { accountId: '123456789012', alias: null, region: 'eu-north-1' },
    };
  });

  render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell />
    </MemoryRouter>,
  );
}

describe('Route navigation', () => {
  it('renders the home route at /', async () => {
    renderRoute('/');

    expect(await screen.findByRole('heading', { name: 'my-aws' })).toBeInTheDocument();
  });

  it('renders the tags route at /tags', async () => {
    renderRoute('/tags');

    expect(await screen.findByRole('heading', { name: 'My tags' })).toBeInTheDocument();
  });

  it('renders the tagged resources route at /tags/:key/:value', async () => {
    renderRoute('/tags/Project/ci-practice');

    expect(await screen.findByRole('heading', { name: 'Project=ci-practice' })).toBeInTheDocument();
  });

  it('renders the buckets route at /s3', () => {
    renderRoute('/s3');

    expect(screen.getByRole('heading', { name: 'My buckets' })).toBeInTheDocument();
  });

  it('renders the bucket route at /s3/:bucket', () => {
    renderRoute('/s3/reports');

    expect(screen.getByRole('heading', { name: 'reports' })).toBeInTheDocument();
  });

  it('renders the object route at /s3/:bucket/*key', () => {
    renderRoute('/s3/reports/path/to/index.html');

    expect(screen.getByRole('heading', { name: 'path/to/index.html' })).toBeInTheDocument();
  });
});
