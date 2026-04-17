import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ValidationVisualizerModal } from './ValidationVisualizerModal';
import type { ValidationVisualizerState } from '../../hooks/useValidationVisualizer';

type RequestHighlightMap = NonNullable<
  ValidationVisualizerState['request']
>['highlights'];

const baseState: ValidationVisualizerState = {
  isOpen: true,
  status: 'playing',
  mode: 'walkthrough',
  exerciseId: 'csv-import',
  speed: '1x',
  request: {
    modelClassName: 'UserRecord',
    modelCode: ['class UserRecord(BaseModel):', '    age: int'].join('\n'),
    csvMountPath: '/data/users.csv',
    fieldSequence: ['age'],
    visibleColumns: ['age'],
    maxVisualizedRows: 1,
    highlights: {
      age: {
        fieldName: 'age',
        startLine: 2,
        endLine: 2,
      },
    },
    pythonSource: 'print("demo")',
  },
  rawRows: [
    {
      age: 'not-an-int',
    },
  ],
  steps: [
    {
      rowIndex: 0,
      fieldName: 'age',
      passed: false,
      rawValue: 'not-an-int',
      validatedValue: null,
      message: 'Input should be a valid integer',
    },
  ],
  rowResults: [
    {
      rowIndex: 0,
      passed: false,
      validatedRow: null,
      errors: [
        'Input should be a valid integer, unable to parse string as an integer',
      ],
    },
  ],
  runResult: null,
  currentStepIndex: 0,
  detail: 'Animating each row and field through the Pydantic model...',
  error: null,
};

describe('ValidationVisualizerModal', () => {
  it('uses a wider desktop layout for the walkthrough columns', () => {
    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: baseState,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('w-full max-w-[1800px]');
    expect(markup).toContain(
      'xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_minmax(0,0.9fr)]',
    );
  });

  it('wraps long validation result text inside the result card', () => {
    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: baseState,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain(
      'max-h-64 min-w-0 overflow-auto whitespace-pre-wrap break-all text-sm leading-6 text-slate-100',
    );
  });

  it('shows every validated current-row column even when row-result rendering stays limited to configured columns', () => {
    const stateWithExtraColumns: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        fieldSequence: ['age', 'hidden'],
        visibleColumns: ['age'],
      },
      rawRows: [
        {
          age: '19',
          hidden: 'current-row-only',
        },
      ],
      rowResults: [
        {
          rowIndex: 0,
          passed: true,
          validatedRow: {
            age: 19,
            hidden: 'whole-file-hidden',
          },
          errors: [],
        },
      ],
      steps: [
        {
          rowIndex: 0,
          fieldName: 'age',
          passed: true,
          rawValue: '19',
          validatedValue: 19,
          message: 'Accepted as int',
        },
      ],
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithExtraColumns,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('Showing 2 / 2 columns');
    expect(markup).toContain('>age<');
    expect(markup).toContain('>hidden<');
    expect(markup).toContain('current-row-only');
    expect(markup).not.toContain('whole-file-hidden');
  });

  it('defaults the walkthrough raw-input panel to the first focused row before playback advances', () => {
    const stateWithManyRows: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        maxVisualizedRows: 2,
      },
      rawRows: [
        {
          age: 'visible-row-1',
        },
        {
          age: 'visible-row-2',
        },
        {
          age: 'hidden-row-3',
        },
      ],
      steps: [],
      rowResults: [],
      currentStepIndex: -1,
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithManyRows,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('visible-row-1');
    expect(markup).toContain('Row 1 in focus');
    expect(markup).not.toContain('visible-row-2');
    expect(markup).not.toContain('hidden-row-3');
  });

  it('shows only the active row in the walkthrough raw-input panel and lets columns wrap as cards', () => {
    const stateWithMultipleVisibleColumns: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        fieldSequence: ['product_id', 'category', 'discounted_price', 'rating_count'],
        visibleColumns: ['product_id', 'category', 'discounted_price', 'rating_count'],
        maxVisualizedRows: 2,
        highlights: ({
          category: {
            fieldName: 'category',
            startLine: 2,
            endLine: 2,
          },
        } as unknown) as RequestHighlightMap,
      },
      rawRows: [
        {
          product_id: 'ROW-1',
          category: 'Category row 1',
          discounted_price: '199',
          rating_count: '100',
        },
        {
          product_id: 'ROW-2',
          category: 'Category row 2',
          discounted_price: '299',
          rating_count: '200',
        },
      ],
      steps: [
        {
          rowIndex: 1,
          fieldName: 'category',
          passed: true,
          rawValue: 'Category row 2',
          validatedValue: ['Category row 2'],
          message: 'Accepted as list',
        },
      ],
      rowResults: [],
      currentStepIndex: 0,
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithMultipleVisibleColumns,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('Row 2 in focus');
    expect(markup).toContain('ROW-2');
    expect(markup).toContain('Category row 2');
    expect(markup).toContain('299');
    expect(markup).toContain('200');
    expect(markup).not.toContain('ROW-1');
    expect(markup).not.toContain('Category row 1');
  });

  it('renders long current-row values as full-width cards and clips their preview text', () => {
    const longCategoryValue = `${'CATEGORY-'.repeat(20)}THE-END`;
    const stateWithLongCurrentRowValues: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        fieldSequence: ['product_id', 'category', 'discounted_price'],
        visibleColumns: ['product_id', 'category', 'discounted_price'],
        highlights: ({
          category: {
            fieldName: 'category',
            startLine: 2,
            endLine: 2,
          },
        } as unknown) as RequestHighlightMap,
      },
      rawRows: [
        {
          product_id: 'ROW-1',
          category: longCategoryValue,
          discounted_price: '299',
        },
      ],
      steps: [
        {
          rowIndex: 0,
          fieldName: 'category',
          passed: true,
          rawValue: longCategoryValue,
          validatedValue: ['Phones', 'Chargers'],
          message: 'Accepted as list',
        },
      ],
      currentStepIndex: 0,
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithLongCurrentRowValues,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('sm:col-span-2 2xl:col-span-3');
    expect(markup).toContain('CATEGORY-CATEGORY-CATEGORY');
    expect(markup).not.toContain('CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-CATEGORY-THE-END&quot;</p>');
  });

  it('keeps short current-row labels and short values on one line without wrapping into neighbors', () => {
    const stateWithCompactCurrentRowCards: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        fieldSequence: ['sku', 'price', 'qty'],
        visibleColumns: ['sku', 'price', 'qty'],
        highlights: ({
          price: {
            fieldName: 'price',
            startLine: 2,
            endLine: 2,
          },
        } as unknown) as RequestHighlightMap,
      },
      rawRows: [
        {
          sku: 'XXXXXXXX',
          price: '12345',
          qty: '4321',
        },
      ],
      steps: [
        {
          rowIndex: 0,
          fieldName: 'price',
          passed: true,
          rawValue: '12345',
          validatedValue: 12345,
          message: 'Accepted as int',
        },
      ],
      currentStepIndex: 0,
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithCompactCurrentRowCards,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain(
      'block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm leading-6 text-slate-100',
    );
    expect(markup).toContain(
      'overflow-hidden text-ellipsis whitespace-nowrap text-xs uppercase tracking-[0.2em] text-slate-400',
    );
    expect(markup).toContain('&quot;XXXXXXXX&quot;');
    expect(markup).toContain('>sku<');
    expect(markup).toContain('>price<');
    expect(markup).toContain('>qty<');
  });

  it('renders current-row cards with long column names as full-width even when the value is short', () => {
    const stateWithLongColumnName: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        fieldSequence: ['discount_percentage', 'rating'],
        visibleColumns: ['discount_percentage', 'rating'],
        highlights: ({
          discount_percentage: {
            fieldName: 'discount_percentage',
            startLine: 2,
            endLine: 2,
          },
        } as unknown) as RequestHighlightMap,
      },
      rawRows: [
        {
          discount_percentage: '64%',
          rating: '4.2',
        },
      ],
      steps: [
        {
          rowIndex: 0,
          fieldName: 'discount_percentage',
          passed: true,
          rawValue: '64%',
          validatedValue: 64,
          message: 'Accepted as int',
        },
      ],
      currentStepIndex: 0,
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithLongColumnName,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('discount_percentage');
    expect(markup).toContain('sm:col-span-2 2xl:col-span-3');
    expect(markup).toContain(
      '<p class="text-xs uppercase tracking-[0.2em] text-slate-400 break-all" title="discount_percentage">discount_percentage</p>',
    );
  });

  it('promotes medium-length CSV column names like product_id to a full-width card before they truncate', () => {
    const stateWithMediumColumnName: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        fieldSequence: ['product_id', 'rating'],
        visibleColumns: ['product_id', 'rating'],
        highlights: ({
          product_id: {
            fieldName: 'product_id',
            startLine: 2,
            endLine: 2,
          },
        } as unknown) as RequestHighlightMap,
      },
      rawRows: [
        {
          product_id: 'B07JW9H4J1',
          rating: '4.2',
        },
      ],
      steps: [
        {
          rowIndex: 0,
          fieldName: 'product_id',
          passed: true,
          rawValue: 'B07JW9H4J1',
          validatedValue: 'B07JW9H4J1',
          message: 'Accepted as str',
        },
      ],
      currentStepIndex: 0,
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithMediumColumnName,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('title="product_id">product_id</p>');
    expect(markup).toContain('sm:col-span-2 2xl:col-span-3');
    expect(markup).not.toContain(
      'title="product_id">product...</p>',
    );
  });

  it('shows only the code lines related to the active field, including its validator block', () => {
    const stateWithContextualCode: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        modelCode: [
          'class AmazonPricingRecord(BaseModel):',
          '    product_id: str',
          '    category: list[str]',
          '    discounted_price: float',
          '',
          '    @field_validator("category", mode="before")',
          '    @classmethod',
          '    def parse_category(cls, value: str) -> list[str]:',
          '        return [part.strip() for part in str(value).split("|") if part.strip()]',
          '',
          '    @field_validator("discounted_price", mode="before")',
          '    @classmethod',
          '    def parse_price(cls, value: str) -> float:',
          '        return 1.0',
        ].join('\n'),
        fieldSequence: ['category'],
        highlights: ({
          category: {
            fieldName: 'category',
            startLine: 3,
            endLine: 9,
            ranges: [
              {
                startLine: 3,
                endLine: 3,
              },
              {
                startLine: 6,
                endLine: 9,
              },
            ],
          },
        } as unknown) as RequestHighlightMap,
      },
      steps: [
        {
          rowIndex: 0,
          fieldName: 'category',
          passed: true,
          rawValue: 'Phones|Chargers',
          validatedValue: ['Phones', 'Chargers'],
          message: 'Accepted as list',
        },
      ],
      currentStepIndex: 0,
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithContextualCode,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('category: list[str]');
    expect(markup).toContain('@field_validator(&quot;category&quot;, mode=&quot;before&quot;)');
    expect(markup).toContain('parse_category');
    expect(markup).not.toContain('discounted_price: float');
    expect(markup).not.toContain('parse_price');
  });

  it('shows the full model code when the class is short enough even if a field is active', () => {
    const shortModelCode = [
      'class ShortAmazonModel(BaseModel):',
      '    product_id: str',
      '    category: list[str]',
      '',
      '    @field_validator("category", mode="before")',
      '    @classmethod',
      '    def parse_category(cls, value: str) -> list[str]:',
      '        return [part.strip() for part in str(value).split("|") if part.strip()]',
    ].join('\n');

    const stateWithShortContextualCode: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        modelCode: shortModelCode,
        fieldSequence: ['category'],
        highlights: ({
          category: {
            fieldName: 'category',
            startLine: 3,
            endLine: 8,
            ranges: [
              {
                startLine: 3,
                endLine: 3,
              },
              {
                startLine: 5,
                endLine: 8,
              },
            ],
          },
        } as unknown) as RequestHighlightMap,
      },
      steps: [
        {
          rowIndex: 0,
          fieldName: 'category',
          passed: true,
          rawValue: 'Phones|Chargers',
          validatedValue: ['Phones', 'Chargers'],
          message: 'Accepted as list',
        },
      ],
      currentStepIndex: 0,
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithShortContextualCode,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('class ShortAmazonModel(BaseModel):');
    expect(markup).toContain('product_id: str');
    expect(markup).toContain('category: list[str]');
    expect(markup).toContain('parse_category');
    expect(markup).not.toContain('Related code continues below');
  });

  it('limits whole-file result cards to the configured row count and shows an ellipsis cue', () => {
    const stateWithManyResults: ValidationVisualizerState = {
      ...baseState,
      status: 'complete',
      request: {
        ...baseState.request!,
        maxVisualizedRows: 2,
      },
      rawRows: [
        {
          age: 'visible-result-1',
        },
        {
          age: 'visible-result-2',
        },
        {
          age: 'hidden-result-3',
        },
      ],
      steps: [],
      currentStepIndex: -1,
      rowResults: [
        {
          rowIndex: 0,
          passed: true,
          validatedRow: {
            age: 18,
          },
          errors: [],
        },
        {
          rowIndex: 1,
          passed: true,
          validatedRow: {
            age: 21,
          },
          errors: [],
        },
        {
          rowIndex: 2,
          passed: true,
          validatedRow: {
            age: 25,
          },
          errors: [],
        },
      ],
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithManyResults,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('Showing 2 / 3 rows');
    expect(markup).toContain('Row 1');
    expect(markup).toContain('Row 2');
    expect(markup).not.toContain('Row 3');
    expect(markup).toContain('... 1 more row');
    expect(markup).not.toContain('hidden-result-3');
  });

  it('renders a dedicated failed-row area for quick inspection', () => {
    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: {
          ...baseState,
          status: 'complete',
        },
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('Rows that raised validation errors');
    expect(markup).toContain('Showing 1 / 1 failed rows');
  });

  it('uses the whole-file result layout for direct runs without walkthrough-only panels', () => {
    const directState: ValidationVisualizerState = {
      ...baseState,
      mode: 'direct',
      status: 'complete',
      speed: null,
      request: null,
      rawRows: [
        {
          age: 'not-an-int',
        },
      ],
      steps: [],
      rowResults: [
        {
          rowIndex: 0,
          passed: false,
          validatedRow: null,
          errors: [
            'Input should be a valid integer, unable to parse string as an integer',
          ],
        },
      ],
      currentStepIndex: -1,
      detail: 'Direct run complete.',
      runResult: {
        status: 'pass',
        stdout: 'valid_rows=2',
        stderr: '',
        checks: [],
      },
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: directState,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('w-full max-w-[1800px]');
    expect(markup).toContain('Validation results across the full CSV');
    expect(markup).toContain('Row 1');
    expect(markup).toContain('invalid');
    expect(markup).not.toContain('Current field result');
    expect(markup).not.toContain('Pydantic Class');
    expect(markup).not.toContain('Exercise result');
  });
});
