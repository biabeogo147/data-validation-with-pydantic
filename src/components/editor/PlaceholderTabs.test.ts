import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PlaceholderTabs } from './PlaceholderTabs';

describe('PlaceholderTabs', () => {
  it('renders nothing when the exercise has only one placeholder', () => {
    const markup = renderToStaticMarkup(
      PlaceholderTabs({
        placeholders: [
          {
            id: 'MODEL_A',
            label: 'Define model',
            defaultCode: 'class A: pass',
          },
        ],
        activePlaceholderId: 'MODEL_A',
        onSelect: () => {},
      }),
    );

    expect(markup).toBe('');
  });

  it('renders a compact switcher when the exercise has multiple placeholders', () => {
    const markup = renderToStaticMarkup(
      PlaceholderTabs({
        placeholders: [
          {
            id: 'MODEL_A',
            label: 'Model',
            defaultCode: 'class A: pass',
          },
          {
            id: 'CHECKS',
            label: 'Checks',
            defaultCode: 'print("ready")',
          },
        ],
        activePlaceholderId: 'MODEL_A',
        onSelect: () => {},
      }),
    );

    expect(markup).toContain('Model');
    expect(markup).toContain('Checks');
  });
});
