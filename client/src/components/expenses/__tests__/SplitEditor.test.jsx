import React from 'react';
import { render, screen } from '@testing-library/react';
import SplitEditor from '../SplitEditor';

const mockMembers = [
  { userId: { _id: 'user1', name: 'User One', email: 'user1@example.com' } },
  { userId: { _id: 'user2', name: 'User Two', email: 'user2@example.com' } }
];

describe('SplitEditor Component', () => {
  test('renders equal split read-only inputs', () => {
    const handleChange = jest.fn();
    render(
      <SplitEditor
        members={mockMembers}
        amount={100}
        splitType="equal"
        splits={[]}
        onChange={handleChange}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(2);
    expect(inputs[0]).toHaveAttribute('readonly');
  });

  test('validates exact split sums', () => {
    const handleChange = jest.fn();
    const mockSplits = [
      { userId: 'user1', amount: 40 },
      { userId: 'user2', amount: 60 }
    ];

    render(
      <SplitEditor
        members={mockMembers}
        amount={100}
        splitType="exact"
        splits={mockSplits}
        onChange={handleChange}
      />
    );

    expect(screen.getByText(/Sum: 100.00 \/ 100.00/)).toBeInTheDocument();
  });
});
