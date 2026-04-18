import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ValidationVisualizerModal } from './ValidationVisualizerModal';
import type { ValidationVisualizerState } from '../../hooks/useValidationVisualizer';
import { I18nProvider } from '../../i18n/I18nProvider';

type RequestHighlightMap = NonNullable<
  ValidationVisualizerState['request']
>['highlights'];

const baseState: ValidationVisualizerState = {
  isOpen: true,
  status: 'playing',
  mode: 'walkthrough',
  exerciseId: 'csv-import',
  speed: '1x',
  isPlaybackPaused: false,
  request: {
    modelClassName: 'UserRecord',
    modelCode: ['class UserRecord(BaseModel):', '    age: int'].join('\n'),
    csvMountPath: '/data/users.csv',
    fieldSequence: ['age'],
    maxVisibleColumns: 1,
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

function renderEnglishModal(
  props: Partial<ComponentProps<typeof ValidationVisualizerModal>> & {
    state: ValidationVisualizerState;
  },
) {
  const resolvedProps: ComponentProps<typeof ValidationVisualizerModal> = {
    onClose: () => {},
    onSkip: () => {},
    onVisualize: () => {},
    onPauseToggle: () => {},
    onPreviousStep: () => {},
    onNextStep: () => {},
    onStartPlayback: () => {},
    ...props,
  };

  return renderToStaticMarkup(
    createElement(
      I18nProvider,
      {
        initialLocale: 'en',
      },
      createElement(ValidationVisualizerModal, resolvedProps),
    ),
  );
}

describe('ValidationVisualizerModal', () => {
  it('uses a wider desktop layout for the walkthrough columns', () => {
    const markup = renderEnglishModal({
      state: baseState,
    });

    expect(markup).toContain('w-full max-w-[1800px]');
    expect(markup).toContain(
      'xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_minmax(0,0.9fr)]',
    );
  });

  it('wraps long validation result text inside the result card', () => {
    const markup = renderEnglishModal({
      state: baseState,
    });

    expect(markup).toContain(
      'max-h-64 min-w-0 overflow-auto whitespace-pre-wrap break-all text-sm leading-6 text-slate-100',
    );
  });

  it('uses the validated field sequence as the single source of truth for walkthrough and whole-file columns', () => {
    const stateWithExtraColumns: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        fieldSequence: ['age', 'hidden'],
        maxVisibleColumns: null,
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

    const markup = renderEnglishModal({
      state: stateWithExtraColumns,
    });

    expect(markup).not.toContain('Showing 2 / 2 columns');
    expect(markup).toContain('>age<');
    expect(markup).toContain('>hidden<');
    expect(markup).toContain('current-row-only');
    expect(markup).toContain('whole-file-hidden');
  });

  it('defaults the walkthrough raw-input panel to only the first active row before playback advances', () => {
    const stateWithManyRows: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        maxVisualizedRows: 3,
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

    const markup = renderEnglishModal({
      state: stateWithManyRows,
    });

    expect(markup).toContain('visible-row-1');
    expect(markup).not.toContain('visible-row-2');
    expect(markup).not.toContain('hidden-row-3');
  });

  it('shows only the currently active row during playback even when more rows are animated', () => {
    const stateWithFocusedRow: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        fieldSequence: ['product_id', 'category'],
        maxVisibleColumns: null,
        maxVisualizedRows: 4,
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
        },
        {
          product_id: 'ROW-2',
          category: 'Category row 2',
        },
        {
          product_id: 'ROW-3',
          category: 'Category row 3',
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

    const markup = renderEnglishModal({
      state: stateWithFocusedRow,
    });

    expect(markup).toContain('ROW-2');
    expect(markup).toContain('Category row 2');
    expect(markup).not.toContain('ROW-1');
    expect(markup).not.toContain('Category row 1');
    expect(markup).not.toContain('ROW-3');
    expect(markup).not.toContain('Category row 3');
  });

  it('slides the visible raw-input columns with the active field and hides columns outside maxVisibleColumns', () => {
    const stateWithSlidingColumns: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        fieldSequence: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
        maxVisibleColumns: 4,
        maxVisualizedRows: 3,
        highlights: ({
          c5: {
            fieldName: 'c5',
            startLine: 2,
            endLine: 2,
          },
        } as unknown) as RequestHighlightMap,
      },
      rawRows: [
        {
          c1: 'VALUE-C1',
          c2: 'VALUE-C2',
          c3: 'VALUE-C3',
          c4: 'VALUE-C4',
          c5: 'VALUE-C5',
          c6: 'VALUE-C6',
        },
      ],
      steps: [
        {
          rowIndex: 0,
          fieldName: 'c5',
          passed: true,
          rawValue: 'VALUE-C5',
          validatedValue: 'VALUE-C5',
          message: 'Accepted as str',
        },
      ],
      rowResults: [],
      currentStepIndex: 0,
    };

    const markup = renderEnglishModal({
      state: stateWithSlidingColumns,
    });

    expect(markup).not.toContain('Showing 4 / 6 columns');
    expect(markup).not.toContain('Showing 1 / 1 rows');
    expect(markup).not.toContain('VALUE-C1');
    expect(markup).toContain('VALUE-C2');
    expect(markup).toContain('VALUE-C3');
    expect(markup).toContain('VALUE-C4');
    expect(markup).toContain('VALUE-C5');
    expect(markup).not.toContain('VALUE-C6');
  });

  it('renders each raw CSV column as its own row instead of responsive cards', () => {
    const stateWithRawRows: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        fieldSequence: ['sku', 'discount_percentage'],
        maxVisibleColumns: 2,
        highlights: ({
          sku: {
            fieldName: 'sku',
            startLine: 2,
            endLine: 2,
          },
        } as unknown) as RequestHighlightMap,
      },
      rawRows: [
        {
          sku: 'XXXXXXXX',
          discount_percentage: '64%',
        },
      ],
      steps: [
        {
          rowIndex: 0,
          fieldName: 'sku',
          passed: true,
          rawValue: 'XXXXXXXX',
          validatedValue: 'XXXXXXXX',
          message: 'Accepted as str',
        },
      ],
      currentStepIndex: 0,
    };

    const markup = renderEnglishModal({
      state: stateWithRawRows,
    });

    expect(markup).toContain('discount_percentage');
    expect(markup).toContain('&quot;XXXXXXXX&quot;');
    expect(markup).toContain('&quot;64%&quot;');
    expect(markup).not.toContain('sm:col-span-2 2xl:col-span-3');
  });

  it('marks only the active raw-input column as highlighted', () => {
    const markup = renderEnglishModal({
      state: {
        ...baseState,
        request: {
          ...baseState.request!,
          fieldSequence: ['age', 'rating_count'],
          maxVisibleColumns: 2,
          highlights: ({
            rating_count: {
              fieldName: 'rating_count',
              startLine: 2,
              endLine: 2,
            },
          } as unknown) as RequestHighlightMap,
        },
        rawRows: [
          {
            age: '19',
            rating_count: '1,234',
          },
        ],
        steps: [
          {
            rowIndex: 0,
            fieldName: 'rating_count',
            passed: true,
            rawValue: '1,234',
            validatedValue: 1234,
            message: 'Accepted as int',
          },
        ],
        rowResults: [],
        currentStepIndex: 0,
      },
    });

    expect(markup).toContain('data-active-column="true"');
    expect(markup).toContain('data-column-name="rating_count"');
    expect(markup).toContain('data-column-name="age"');
    expect(markup).toContain('data-active-column="false"');
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

    const markup = renderEnglishModal({
      state: stateWithContextualCode,
    });

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

    const markup = renderEnglishModal({
      state: stateWithShortContextualCode,
    });

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

    const markup = renderEnglishModal({
      state: stateWithManyResults,
    });

    expect(markup).toContain('Showing 2 / 3 rows');
    expect(markup).toContain('xl:grid-cols-3');
    expect(markup).toContain('Row 1');
    expect(markup).toContain('Row 2');
    expect(markup).not.toContain('Row 3');
    expect(markup).toContain('... 1 more row');
    expect(markup).not.toContain('hidden-result-3');
  });

  it('renders a dedicated failed-row area for quick inspection', () => {
    const markup = renderEnglishModal({
      state: {
        ...baseState,
        status: 'complete',
      },
    });

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

    const markup = renderEnglishModal({
      state: directState,
    });

    expect(markup).toContain('w-full max-w-[1800px]');
    expect(markup).toContain('Validation results across the full CSV');
    expect(markup).toContain('Row 1');
    expect(markup).toContain('invalid');
    expect(markup).not.toContain('Current field result');
    expect(markup).not.toContain('Pydantic Class');
    expect(markup).not.toContain('Exercise result');
  });

  it('shows only visualize and skip actions before the walkthrough starts', () => {
    const markup = renderEnglishModal({
      state: {
        ...baseState,
        status: 'choice',
        mode: 'choice',
        speed: null,
        request: null,
        rawRows: [],
        steps: [],
        rowResults: [],
        currentStepIndex: -1,
        detail: 'Choose whether to visualize the validation flow or skip it.',
      },
    });

    expect(markup).toContain('Visualize');
    expect(markup).toContain('Skip');
    expect(markup).not.toContain('>1x<');
    expect(markup).not.toContain('>2x<');
    expect(markup).not.toContain('>4x<');
  });

  it('renders playback controls for pause, previous, and next during the walkthrough', () => {
    const markup = renderEnglishModal({
      state: {
        ...baseState,
        steps: [
          {
            rowIndex: 0,
            fieldName: 'age',
            passed: true,
            rawValue: '19',
            validatedValue: 19,
            message: 'Accepted as int',
          },
          {
            rowIndex: 0,
            fieldName: 'rating_count',
            passed: true,
            rawValue: '1,234',
            validatedValue: 1234,
            message: 'Accepted as int',
          },
        ],
        currentStepIndex: 0,
      },
    });

    expect(markup).toContain('Pause');
    expect(markup).toContain('Previous');
    expect(markup).toContain('Next');
    expect(markup).toContain('>1x<');
    expect(markup).toContain('>2x<');
    expect(markup).toContain('>4x<');
  });

  it('switches the pause control to resume when walkthrough playback is paused', () => {
    const markup = renderEnglishModal({
      state: {
        ...baseState,
        isPlaybackPaused: true,
        steps: [
          {
            rowIndex: 0,
            fieldName: 'age',
            passed: true,
            rawValue: '19',
            validatedValue: 19,
            message: 'Accepted as int',
          },
          {
            rowIndex: 0,
            fieldName: 'rating_count',
            passed: true,
            rawValue: '1,234',
            validatedValue: 1234,
            message: 'Accepted as int',
          },
        ],
        currentStepIndex: 1,
      },
    });

    expect(markup).toContain('Resume');
    expect(markup).toContain('Previous');
    expect(markup).toContain('Next');
  });
});
