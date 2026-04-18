import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import App from './App';
import { appMessages } from './i18n/messages';

describe('App', () => {
  it('keeps the editor title visible and renders a language toggle in the learning layout', () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain(appMessages.vi.shell.editorTitle);
    expect(markup).toContain(appMessages.vi.shell.languageLabel);
    expect(markup).toContain('data-language-toggle="true"');
    expect(markup).toContain('>EN<');
    expect(markup).toContain('>VI<');
  });
});
