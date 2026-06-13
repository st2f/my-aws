import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as client from '../graphql/client';
import { HomeRoute } from './home';

describe('Home route', () => {
  it('queries accountInfo through GraphQL', async () => {
    const request = vi.spyOn(client, 'graphqlRequest').mockResolvedValue({
      accountInfo: { accountId: '123456789012', alias: 'learning-account', region: 'eu-north-1' },
    });

    render(<HomeRoute />);

    await waitFor(() => expect(request).toHaveBeenCalledWith(expect.stringContaining('accountInfo'), undefined, expect.any(Object)));
  });

  it('renders loading state', () => {
    vi.spyOn(client, 'graphqlRequest').mockImplementation(() => new Promise(() => undefined));

    render(<HomeRoute />);

    expect(screen.getByText('Checking local credentials')).toBeInTheDocument();
  });

  it('renders account info when connected', async () => {
    vi.spyOn(client, 'graphqlRequest').mockResolvedValue({
      accountInfo: { accountId: '123456789012', alias: 'learning-account', region: 'eu-north-1' },
    });

    render(<HomeRoute />);

    expect(await screen.findAllByText('learning-account')).toHaveLength(2);
    expect(screen.getByText('123456789012')).toBeInTheDocument();
    expect(screen.getByText('eu-north-1')).toBeInTheDocument();
  });

  it('renders a readable error state', async () => {
    vi.spyOn(client, 'graphqlRequest').mockRejectedValue(new Error('No credentials'));

    render(<HomeRoute />);

    expect(await screen.findByText('No credentials')).toBeInTheDocument();
  });
});
