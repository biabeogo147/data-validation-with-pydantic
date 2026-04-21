import { describe, expect, it } from 'vitest';

import { normalizePythonExecutionError } from './python-error';

describe('normalizePythonExecutionError', () => {
  it('condenses a top-level traceback into a short schema definition error', () => {
    const message = normalizePythonExecutionError(
      [
        'Python execution failed: Traceback (most recent call last):',
        '  File "<exec>", line 4, in <module>',
        '    class ProductReview(BaseModel):',
        "NameError: name 'StrictInt' is not defined",
      ].join('\n'),
    );

    expect(message).toContain('Schema definition error.');
    expect(message).toContain("NameError: name 'StrictInt' is not defined");
    expect(message).toContain('Check that every type, helper, or validator you use is imported.');
    expect(message).not.toContain('Traceback');
    expect(message).not.toContain('line 4');
  });

  it('rewrites internal walkthrough field errors into learner-facing schema guidance', () => {
    const message = normalizePythonExecutionError(
      [
        'Python execution failed: Traceback (most recent call last):',
        '  File "<exec>", line 45, in <module>',
        '    __visualizer_field_schemas = {',
        `KeyError: "Field 'product_id' was not found on the visualization model."`,
      ].join('\n'),
    );

    expect(message).toContain('Schema definition error.');
    expect(message).toContain(
      'Your Pydantic class is missing the field "product_id" required by this exercise.',
    );
    expect(message).toContain(
      'Add "product_id" to the class you are defining and try again.',
    );
    expect(message).not.toContain('visualization model');
    expect(message).not.toContain('line 45');
  });

  it('localizes schema-definition guidance when the app is using Vietnamese', () => {
    const message = normalizePythonExecutionError(
      [
        'Python execution failed: Traceback (most recent call last):',
        '  File "<exec>", line 4, in <module>',
        '    class ProductReview(BaseModel):',
        "NameError: name 'StrictInt' is not defined",
      ].join('\n'),
      'vi',
    );

    expect(message).toContain('Lỗi định nghĩa schema.');
    expect(message).toContain("NameError: name 'StrictInt' is not defined");
    expect(message).toContain(
      'Hãy kiểm tra xem bạn đã import đầy đủ các type, helper hoặc validator chưa.',
    );
  });

  it('leaves short non-traceback errors readable', () => {
    expect(normalizePythonExecutionError('Pyodide boot failed')).toBe(
      'Pyodide boot failed',
    );
  });
});
