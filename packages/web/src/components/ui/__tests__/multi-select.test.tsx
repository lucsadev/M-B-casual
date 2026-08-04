/**
 * MultiSelect component tests.
 *
 * Covers: placeholder rendering, chip rendering, toggle selection via
 * onChange, chip removal without opening the panel, search filtering,
 * empty state, and Escape to close.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { MultiSelect, type MultiSelectOption } from '../multi-select';

const options: MultiSelectOption[] = [
  { value: 's1', label: 'Textil Ríos' },
  { value: 's2', label: 'Algodonera Sur' },
  { value: 's3', label: 'Distribuidora Norte' },
];

function setup(
  props: Partial<ComponentProps<typeof MultiSelect>> = {},
  onChange = vi.fn(),
) {
  const utils = render(
    <MultiSelect
      value={props.value ?? []}
      onChange={props.onChange ?? onChange}
      options={props.options ?? options}
      placeholder={props.placeholder}
      emptyMessage={props.emptyMessage}
    />,
  );
  return { onChange, ...utils };
}

describe('MultiSelect', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders the placeholder when nothing is selected', () => {
    setup({ placeholder: 'Choose suppliers' });

    expect(screen.getByText('Choose suppliers')).toBeInTheDocument();
    expect(screen.queryByText('Textil Ríos')).not.toBeInTheDocument();
  });

  it('renders selected values as removable chips', () => {
    setup({ value: ['s1', 's2'] });

    expect(screen.getByText('Textil Ríos')).toBeInTheDocument();
    expect(screen.getByText('Algodonera Sur')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Textil Ríos' }),
    ).toBeInTheDocument();
  });

  it('opens the panel on trigger click and toggles an option via onChange', () => {
    const { onChange, rerender } = setup();

    fireEvent.click(screen.getByRole('combobox'));
    expect(
      screen.getByRole('option', { name: 'Textil Ríos' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: 'Textil Ríos' }));
    expect(onChange).toHaveBeenCalledWith(['s1']);

    // Re-render with the new selection, then toggle it off
    rerender(
      <MultiSelect
        value={['s1']}
        onChange={onChange}
        options={options}
      />,
    );
    fireEvent.click(screen.getByRole('option', { name: 'Textil Ríos' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('removes a chip via × without opening the panel', () => {
    const { onChange } = setup({ value: ['s1', 's2'] });

    fireEvent.click(screen.getByRole('button', { name: 'Remove Textil Ríos' }));

    expect(onChange).toHaveBeenCalledWith(['s2']);
    // Clicking the remove button must not toggle the dropdown
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows a checkmark on selected options in the panel', () => {
    setup({ value: ['s1'] });

    fireEvent.click(screen.getByRole('combobox'));

    expect(screen.getByRole('option', { name: 'Textil Ríos' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      screen.getByRole('option', { name: 'Algodonera Sur' }),
    ).toHaveAttribute('aria-selected', 'false');
  });

  it('filters options by search query (case-insensitive)', () => {
    setup();

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.change(screen.getByLabelText('Search options'), {
      target: { value: 'norte' },
    });

    expect(
      screen.getByRole('option', { name: 'Distribuidora Norte' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Textil Ríos' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Algodonera Sur' }),
    ).not.toBeInTheDocument();
  });

  it('shows the empty message when there are no options', () => {
    setup({ options: [], emptyMessage: 'No active suppliers' });

    fireEvent.click(screen.getByRole('combobox'));

    expect(screen.getByText('No active suppliers')).toBeInTheDocument();
  });

  it('uses the default empty message when none is provided', () => {
    setup({ options: [] });

    fireEvent.click(screen.getByRole('combobox'));

    expect(screen.getByText('No options')).toBeInTheDocument();
  });

  it('closes the panel on Escape', () => {
    setup();

    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the panel when clicking outside', () => {
    setup();

    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
