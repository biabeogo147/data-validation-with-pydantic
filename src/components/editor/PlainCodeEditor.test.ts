import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PlainCodeEditor } from './PlainCodeEditor';
import { I18nProvider } from '../../i18n/I18nProvider';
import { appMessages, type AppLocale } from '../../i18n/messages';

function renderEditorWithLocale(
  locale: AppLocale,
  props: Parameters<typeof PlainCodeEditor>[0],
) {
  return renderToStaticMarkup(
    createElement(
      I18nProvider,
      { initialLocale: locale },
      createElement(PlainCodeEditor, props),
    ),
  );
}

describe('PlainCodeEditor', () => {
  it('renders only the import hint above the editor', () => {
    const markup = renderEditorWithLocale('en', {
      label: 'Define model',
      importLines: ['from pydantic import BaseModel, StrictInt'],
      value: 'class User(BaseModel):\n    age: StrictInt',
      onChange: () => {},
    });

    expect(markup).not.toContain('Guidance');
    expect(markup).toContain(appMessages.en.editor.availableImports);
    expect(markup).toContain('from pydantic import BaseModel, StrictInt');
  });

  it('omits the visible label when none is provided', () => {
    const markup = renderEditorWithLocale('en', {
      importLines: ['from pydantic import BaseModel'],
      value: 'class User(BaseModel):\n    name: str',
      onChange: () => {},
    });

    expect(markup).not.toContain('Define model');
    expect(markup).toContain(`aria-label="${appMessages.en.editor.codeEditorAriaLabel}"`);
    expect(markup).toContain(appMessages.en.editor.availableImports);
  });

  it('reads app-owned editor copy from the shared locale dictionary', () => {
    const markup = renderEditorWithLocale('vi', {
      importLines: ['from pydantic import BaseModel'],
      value: 'class User(BaseModel):\n    name: str',
      onChange: () => {},
    });

    expect(markup).toContain(appMessages.vi.editor.availableImports);
    expect(markup).toContain(`aria-label="${appMessages.vi.editor.codeEditorAriaLabel}"`);
  });
});
