import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PlainCodeEditor } from './PlainCodeEditor';

describe('PlainCodeEditor', () => {
  it('renders only the import hint above the editor', () => {
    const markup = renderToStaticMarkup(
      PlainCodeEditor({
        label: 'Define model',
        importLines: ['from pydantic import BaseModel, StrictInt'],
        value: 'class User(BaseModel):\n    age: StrictInt',
        onChange: () => {},
      }),
    );

    expect(markup).not.toContain('Guidance');
    expect(markup).toContain('Available imports');
    expect(markup).toContain('from pydantic import BaseModel, StrictInt');
  });

  it('omits the visible label when none is provided', () => {
    const markup = renderToStaticMarkup(
      PlainCodeEditor({
        importLines: ['from pydantic import BaseModel'],
        value: 'class User(BaseModel):\n    name: str',
        onChange: () => {},
      }),
    );

    expect(markup).not.toContain('Define model');
    expect(markup).toContain('aria-label="Code editor"');
    expect(markup).toContain('Available imports');
  });
});
