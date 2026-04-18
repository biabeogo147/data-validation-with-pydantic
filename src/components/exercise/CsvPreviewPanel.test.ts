import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CsvPreviewPanel, CsvPreviewTable, parseCsvPreview } from './CsvPreviewPanel';
import { I18nProvider } from '../../i18n/I18nProvider';
import { appMessages, type AppLocale } from '../../i18n/messages';

function renderWithLocale(locale: AppLocale, element: ReactElement) {
  return renderToStaticMarkup(
    createElement(I18nProvider, { initialLocale: locale }, element),
  );
}

describe('parseCsvPreview', () => {
  it('parses quoted CSV cells and truncates the preview row count', () => {
    const contents = [
      'product_id,product_name,rating',
      'A-1,"Keyboard, Wired",4.2',
      'A-2,"Mouse, Wireless",4.1',
      'A-3,Monitor,4.7',
      'A-4,Laptop Stand,4.5',
    ].join('\n');

    expect(parseCsvPreview(contents, 2)).toEqual({
      headers: ['product_id', 'product_name', 'rating'],
      rows: [
        ['A-1', 'Keyboard, Wired', '4.2'],
        ['A-2', 'Mouse, Wireless', '4.1'],
      ],
      totalColumns: 3,
      totalAvailableColumns: 3,
      totalDataRows: 4,
      shownDataRows: 2,
      isTruncated: true,
    });
  });

  it('keeps only configured preview columns when a whitelist is provided', () => {
    const contents = [
      'product_id,product_name,category,rating,product_link',
      'A-1,"Keyboard, Wired",Accessories,4.2,https://example.com/1',
      'A-2,"Mouse, Wireless",Accessories,4.1,https://example.com/2',
    ].join('\n');

    expect(
      parseCsvPreview(contents, 8, ['product_id', 'product_name', 'rating']),
    ).toEqual({
      headers: ['product_id', 'product_name', 'rating'],
      rows: [
        ['A-1', 'Keyboard, Wired', '4.2'],
        ['A-2', 'Mouse, Wireless', '4.1'],
      ],
      totalColumns: 3,
      totalAvailableColumns: 5,
      totalDataRows: 2,
      shownDataRows: 2,
      isTruncated: false,
    });
  });
});

describe('CsvPreviewTable', () => {
  it('renders download affordance and ellipsis-friendly cells', () => {
    const markup = renderWithLocale(
      'en',
      createElement(CsvPreviewTable, {
        downloadUrl: '/fixtures/amazon.csv',
        fileCsvPath: 'fixtures/amazon.csv',
        preview: {
          headers: ['very_long_column_name_that_should_be_truncated'],
          rows: [['A very long cell value that should be truncated in the web preview']],
          totalColumns: 1,
          totalAvailableColumns: 1,
          totalDataRows: 1,
          shownDataRows: 1,
          isTruncated: false,
        },
      }),
    );

    expect(markup).toContain(appMessages.en.csvPreview.download);
    expect(markup).toContain('/fixtures/amazon.csv');
    expect(markup).toContain('download="amazon.csv"');
    expect(markup).toContain('truncate');
    expect(markup).toContain('title="very_long_column_name_that_should_be_truncated"');
    expect(markup).toContain(
      'title="A very long cell value that should be truncated in the web preview"',
    );
  });

  it('uses a screen-contained grid layout for wide CSV files', () => {
    const markup = renderWithLocale(
      'en',
      createElement(CsvPreviewTable, {
        downloadUrl: '/fixtures/amazon.csv',
        fileCsvPath: 'fixtures/amazon.csv',
        preview: {
          headers: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
          rows: [['v1', 'v2', 'v3', 'v4', 'v5', 'v6']],
          totalColumns: 6,
          totalAvailableColumns: 12,
          totalDataRows: 1,
          shownDataRows: 1,
          isTruncated: false,
        },
      }),
    );

    expect(markup).toContain(appMessages.en.csvPreview.showingColumns(6, 12));
    expect(markup).toContain('grid-template-columns:72px repeat(6, minmax(0, 1fr))');
    expect(markup).toContain('w-full');
    expect(markup).toContain('min-w-0');
    expect(markup).not.toContain('min-w-max');
  });
});

describe('CsvPreviewPanel', () => {
  it('renders the preview area without a toggle button', () => {
    const markup = renderWithLocale(
      'en',
      createElement(CsvPreviewPanel, {
        exercise: {
          id: 'csv-preview',
          title: 'CSV Preview',
          description: 'Preview a CSV file.',
          templateCode: '{{MODEL}}',
          placeholders: [{ id: 'MODEL', defaultCode: 'class ProductReview: pass' }],
          runConfig: {},
          checks: [],
          fileCsvConfig: {
            files: [
              {
                id: 'products',
                fileCsvPath: 'fixtures/amazon.csv',
                previewColumns: ['product_id', 'product_name'],
              },
            ],
          },
        },
      }),
    );

    expect(markup).toContain(appMessages.en.csvPreview.title);
    expect(markup).toContain(appMessages.en.csvPreview.loading);
    expect(markup).not.toContain('View CSV');
    expect(markup).not.toContain('Hide CSV');
  });

  it('localizes the CSV preview chrome from the shared dictionary', () => {
    const markup = renderWithLocale(
      'vi',
      createElement(CsvPreviewTable, {
        downloadUrl: '/fixtures/amazon.csv',
        fileCsvPath: 'fixtures/amazon.csv',
        preview: {
          headers: ['product_id'],
          rows: [['A-1']],
          totalColumns: 1,
          totalAvailableColumns: 3,
          totalDataRows: 10,
          shownDataRows: 8,
          isTruncated: true,
        },
      }),
    );

    expect(markup).toContain(appMessages.vi.csvPreview.showingColumns(1, 3));
    expect(markup).toContain(appMessages.vi.csvPreview.download);
    expect(markup).toContain(appMessages.vi.csvPreview.showingFirstRows(8));
  });
});
