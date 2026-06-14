import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as client from './graphql/client';
import { AppShell } from './App';

function renderShell(path = '/') {
  vi.spyOn(client, 'graphqlRequest').mockResolvedValue({
    accountInfo: { accountId: '123456789012', alias: null, region: 'eu-north-1' },
  });

  render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell />
    </MemoryRouter>,
  );
}

describe('App shell', () => {
  it('renders the left navigation', () => {
    renderShell();

    expect(screen.getAllByLabelText('Main')[0]).toBeInTheDocument();
  });

  it('links to My tags', () => {
    renderShell();

    expect(screen.getAllByRole('link', { name: 'My tags' })[0]).toHaveAttribute('href', '/tags');
  });

  it('links to Account', () => {
    renderShell('/tags');

    expect(screen.getAllByRole('link', { name: 'Account' })[0]).toHaveAttribute('href', '/');
  });

  it('links to My buckets', () => {
    renderShell();

    expect(screen.getAllByRole('link', { name: 'My buckets' })[0]).toHaveAttribute('href', '/s3');
  });

  it('renders the current route content', () => {
    renderShell('/s3');

    expect(screen.getByRole('heading', { name: 'My buckets' })).toBeInTheDocument();
  });
});
