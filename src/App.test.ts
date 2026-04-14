import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('keeps the editor title visible in the learning layout', () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain('Editor');
  });
});
