import { DEFAULT_APP_LOCALE, type AppLocale } from './messages';

export type PythonErrorHintKey =
  | 'imports'
  | 'importsAndModules'
  | 'schema'
  | 'syntax';

export interface PythonErrorMessages {
  schemaDefinition: string;
  missingField: (fieldName: string) => string;
  addFieldAndRetry: (fieldName: string) => string;
  walkthroughModelUnavailable: string;
  walkthroughFieldsUnavailable: string;
  walkthroughFieldUnavailable: (fieldName: string) => string;
  hints: Record<PythonErrorHintKey, string>;
}

const pythonErrorMessages: Record<AppLocale, PythonErrorMessages> = {
  en: {
    schemaDefinition: 'Schema definition error.',
    missingField: (fieldName) =>
      `Your Pydantic class is missing the field "${fieldName}" required by this exercise.`,
    addFieldAndRetry: (fieldName) =>
      `Add "${fieldName}" to the class you are defining and try again.`,
    walkthroughModelUnavailable:
      'The walkthrough could not prepare your Pydantic class. Check the class definition and try again.',
    walkthroughFieldsUnavailable:
      'The walkthrough could not inspect the fields on your Pydantic class. Check the class definition and try again.',
    walkthroughFieldUnavailable: (fieldName) =>
      `The walkthrough could not inspect the field "${fieldName}" on your Pydantic class. Check that field and try again.`,
    hints: {
      imports:
        'Check that every type, helper, or validator you use is imported.',
      importsAndModules:
        'Check your imports and the modules available in this exercise.',
      schema:
        'Check the field types, Field(...) options, and validators in your model.',
      syntax: 'Check the Python syntax and indentation in your schema.',
    },
  },
  vi: {
    schemaDefinition: 'Lỗi định nghĩa schema.',
    missingField: (fieldName) =>
      `Class Pydantic của bạn đang thiếu field "${fieldName}" mà bài tập này cần.`,
    addFieldAndRetry: (fieldName) =>
      `Hãy thêm "${fieldName}" vào class bạn đang định nghĩa rồi chạy lại.`,
    walkthroughModelUnavailable:
      'Không thể chuẩn bị class Pydantic của bạn cho phần minh họa validation. Hãy kiểm tra lại class rồi thử lại.',
    walkthroughFieldsUnavailable:
      'Không thể đọc các field trong class Pydantic của bạn cho phần minh họa validation. Hãy kiểm tra lại class rồi thử lại.',
    walkthroughFieldUnavailable: (fieldName) =>
      `Không thể chuẩn bị field "${fieldName}" trong class Pydantic của bạn cho bài tập này. Hãy kiểm tra lại field đó rồi thử lại.`,
    hints: {
      imports:
        'Hãy kiểm tra xem bạn đã import đầy đủ các type, helper hoặc validator chưa.',
      importsAndModules:
        'Hãy kiểm tra lại các import và những module được phép dùng trong bài tập này.',
      schema:
        'Hãy kiểm tra lại field type, tùy chọn Field(...), và các validator trong model của bạn.',
      syntax: 'Hãy kiểm tra lại cú pháp Python và thụt lề trong schema của bạn.',
    },
  },
};

export function getPythonErrorMessages(locale: AppLocale) {
  return pythonErrorMessages[locale] ?? pythonErrorMessages[DEFAULT_APP_LOCALE];
}
