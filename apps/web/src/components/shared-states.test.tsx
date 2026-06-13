import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState, ErrorState, LoadingState } from './shared-states';

describe('Shared states', () => {
  it('renders a loading state', () => {
    render(<LoadingState label="Loading buckets" />);

    expect(screen.getByText('Loading buckets')).toBeInTheDocument();
  });

  it('renders an empty state', () => {
    render(<EmptyState title="No buckets" detail="Nothing to show." />);

    expect(screen.getByRole('heading', { name: 'No buckets' })).toBeInTheDocument();
    expect(screen.getByText('Nothing to show.')).toBeInTheDocument();
  });

  it('renders an error state', () => {
    render(<ErrorState message="Request failed" />);

    expect(screen.getByText('Request failed')).toBeInTheDocument();
  });
});
