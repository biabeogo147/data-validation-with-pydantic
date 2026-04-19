import { describe, expect, it } from 'vitest';

import { baseModelExercise } from './base-model';
import { exerciseCatalog } from './index';
import { fieldConstraintExercise } from './field-constraint';
import { fieldValidatorExercise } from './field-validator';
import { fullAmazonSchemaExercise } from './full-amazon-schema';
import { modelValidatorExercise } from './model-validator';

describe('amazon exercise curriculum', () => {
  it('keeps the learning path in the intended progression order', () => {
    expect(exerciseCatalog.map((exercise) => exercise.id)).toEqual([
      'base-model-intro',
      'field-constraints-amazon',
      'field-validator-amazon',
      'model-validator-amazon',
      'full-amazon-schema',
    ]);
  });

  it('starts with a minimal BaseModel exercise focused on typed scalar fields', () => {
    expect(baseModelExercise.shortTitle).toBe('BaseModel');
    expect(baseModelExercise.fileCsvConfig.files[0]?.previewColumns).toEqual([
      'product_id',
      'product_name',
      'rating',
    ]);
    expect(baseModelExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'class ProductReview(BaseModel):',
    );
    expect(baseModelExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'rating: float',
    );
    expect(baseModelExercise.solutionCode?.MODEL_SCHEMA).not.toContain(
      'about_product',
    );
  });

  it('uses Field(...) to teach exact length, string shape, and numeric bounds', () => {
    expect(fieldConstraintExercise.fileCsvConfig.files[0]?.previewColumns).toEqual([
      'product_id',
      'product_name',
      'category',
      'rating',
    ]);
    expect(fieldConstraintExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'product_id: str = Field(min_length=10, max_length=10',
    );
    expect(fieldConstraintExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'category: str = Field(pattern=',
    );
    expect(fieldConstraintExercise.checks[0]?.kind).toBe('python_assert');
    expect(
      fieldConstraintExercise.checks
        .map((check) => ('code' in check ? check.code : ''))
        .join('\n'),
    ).toContain('invalid_count == 1');
    expect(fieldConstraintExercise.templateCode).not.toContain(
      '"product_id_length"',
    );
    expect(fieldConstraintExercise.templateCode).not.toContain(
      '"product_name_length"',
    );
    expect(fieldConstraintExercise.templateCode).not.toContain(
      '"has_category_path"',
    );
    expect(fieldConstraintExercise.example?.code).toContain('"product_id"');
    expect(fieldConstraintExercise.example?.code).toContain('"product_name"');
    expect(fieldConstraintExercise.example?.code).toContain('"rating"');
    expect(fieldConstraintExercise.example?.code).not.toContain('"category"');
  });

  it('uses field validators to normalize hierarchy and numeric strings without touching rating', () => {
    expect(fieldValidatorExercise.fileCsvConfig.files[0]?.previewColumns).toEqual([
      'product_id',
      'category',
      'discounted_price',
      'actual_price',
      'discount_percentage',
      'rating_count',
    ]);
    expect(fieldValidatorExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'category: list[str]',
    );
    expect(fieldValidatorExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'discount_percentage: int',
    );
    expect(fieldValidatorExercise.solutionCode?.MODEL_SCHEMA).not.toContain(
      'rating: float',
    );
    expect(
      fieldValidatorExercise.checks
        .map((check) => ('code' in check ? check.code : ''))
        .join('\n'),
    ).toContain('valid_count == 1465');
    expect(
      fieldValidatorExercise.checks
        .map((check) => ('code' in check ? check.code : ''))
        .join('\n'),
    ).toContain('invalid_count == 0');
  });

  it('uses model validators to introduce business-rule invalid rows', () => {
    expect(
      modelValidatorExercise.solutionCode?.MODEL_SCHEMA,
    ).toContain('@model_validator(mode="after")');
    expect(modelValidatorExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'discount_percentage: int',
    );
    const modelValidatorChecks = modelValidatorExercise.checks
      .map((check) => ('code' in check ? check.code : ''))
      .join('\n');
    expect(modelValidatorChecks).toContain('valid_count == 1462');
    expect(modelValidatorChecks).toContain('invalid_count == 3');
    expect(modelValidatorChecks).toContain('B08L12N5H1');
    expect(modelValidatorChecks).toContain('B0B94JPY2N');
    expect(modelValidatorChecks).toContain('B0BQRJ3C47');
  });

  it('finishes with a full-row schema that validates every Amazon column', () => {
    expect(fullAmazonSchemaExercise.editorImports).toContain(
      'from pydantic import BaseModel, Field, HttpUrl, field_validator, model_validator',
    );
    expect(fullAmazonSchemaExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'about_product: list[str]',
    );
    expect(fullAmazonSchemaExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'user_id: list[str]',
    );
    expect(fullAmazonSchemaExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'review_id: list[str]',
    );
    expect(fullAmazonSchemaExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'img_link: HttpUrl',
    );
    expect(fullAmazonSchemaExercise.solutionCode?.MODEL_SCHEMA).toContain(
      'product_link: HttpUrl',
    );
    const fullSchemaChecks = fullAmazonSchemaExercise.checks
      .map((check) => ('code' in check ? check.code : ''))
      .join('\n');
    expect(fullSchemaChecks).toContain('valid_count == 1462');
    expect(fullSchemaChecks).toContain('invalid_count == 3');
  });
});
