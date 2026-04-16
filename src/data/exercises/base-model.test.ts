import { describe, expect, it } from 'vitest';

import { baseModelExercise } from './base-model';

describe('baseModelExercise', () => {
  it('uses the amazon CSV fixture and a matching example summary', () => {
    expect(baseModelExercise.fileCsvConfig.files).toEqual([
      {
        id: 'products',
        fileCsvPath: 'fixtures/amazon.csv',
        previewColumns: ['product_id', 'product_name', 'category', 'rating'],
      },
    ]);
    expect(baseModelExercise.templateCode).toContain('/data/amazon.csv');
    expect(baseModelExercise.example?.code).toContain('sample_valid_rows');
    expect(baseModelExercise.example?.code).toContain('B07JW9H4J1');
  });

  it('uses ProductReview as the learner-facing model name', () => {
    expect(baseModelExercise.templateCode).toContain('ProductReview.model_validate(row)');
    expect(baseModelExercise.templateCode).toContain('{{MODEL_SCHEMA}}');
    expect(baseModelExercise.placeholders[0]?.id).toBe('MODEL_SCHEMA');
    expect(baseModelExercise.placeholders[0]?.label).toBe('Define ProductReview');
    expect(baseModelExercise.placeholders[0]?.defaultCode).toContain(
      'class ProductReview(BaseModel):',
    );
    expect(baseModelExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'class ProductReview(BaseModel):',
    );
    expect(baseModelExercise.visualizationConfig?.modelClassName).toBe(
      'ProductReview',
    );
    expect(baseModelExercise.visualizationConfig?.modelPlaceholderId).toBe(
      'MODEL_SCHEMA',
    );
  });

  it('declares allowed CSV preview columns in config', () => {
    expect(baseModelExercise.fileCsvConfig.files[0]?.previewColumns).toEqual([
      'product_id',
      'product_name',
      'category',
      'rating',
    ]);
  });
});
