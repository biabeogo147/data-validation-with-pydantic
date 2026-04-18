export type AppLocale = 'en' | 'vi';

export interface AppMessages {
  shell: {
    eyebrow: string;
    title: string;
    description: string;
    languageLabel: string;
    noExercisesTitle: string;
    noExercisesDescription: string;
    editorTitle: string;
    reset: string;
    defaultRun: string;
    showReferenceSolution: string;
    hideReferenceSolution: string;
    referenceSolution: string;
  };
  exerciseList: {
    title: string;
    difficulty: Record<'beginner' | 'intermediate' | 'advanced', string>;
  };
  exerciseDetails: {
    learningGoals: string;
    hints: string;
    exampleOutput: string;
    minutes: (minutes: number) => string;
  };
  editor: {
    availableImports: string;
    codeEditorAriaLabel: string;
  };
  csvPreview: {
    title: string;
    description: string;
    showingColumns: (shown: number, total: number) => string;
    totalRows: (count: number) => string;
    showingFirstRows: (count: number) => string;
    showingAllRows: (count: number) => string;
    download: string;
    shortenedNote: string;
    loading: string;
    noCsvConfigured: string;
    rowHeader: string;
  };
  visualizer: {
    walkthroughEyebrow: string;
    walkthroughChoiceTitle: string;
    visualizeLabel: string;
    visualizeDescription: string;
    playbackLabel: string;
    playbackDescription: Record<'1x' | '2x' | '4x', string>;
    directRunLabel: string;
    skipLabel: string;
    directRunDescription: string;
    previousLabel: string;
    nextLabel: string;
    pauseLabel: string;
    resumeLabel: string;
    directResultEyebrow: string;
    directResultTitle: string;
    preparedErrorEyebrow: string;
    preparedErrorTitle: string;
    animatedRows: (shown: number, total: number) => string;
    walkthroughTitle: (modelClassName: string) => string;
    validatedOutputEyebrow: string;
    currentFieldResultTitle: string;
    rowFieldTitle: (rowIndex: number, fieldName: string) => string;
    accepted: string;
    error: string;
    rawValue: string;
    pydanticOutput: string;
    pickPlaybackSpeed: string;
    pydanticClassEyebrow: string;
    highlightedModelLinesTitle: string;
    relatedCodeContinuesBelow: string;
    rawInputEyebrow: string;
    currentCsvRowsTitle: string;
    rowInFocus: (rowIndex: number) => string;
    rowStatusInProgress: string;
    rowStatusComplete: string;
    rowStatusInvalid: string;
    activeCsvRowsPlaceholder: string;
    wholeFileEyebrow: string;
    wholeFileTitle: string;
    passedRows: (count: number) => string;
    failedRows: (count: number) => string;
    showingResultRows: (shown: number, total: number) => string;
    pendingRows: (count: number) => string;
    rowLabel: (rowIndex: number) => string;
    rowValid: string;
    rowInvalid: string;
    rawCsvRow: string;
    validationResult: string;
    validationErrors: string;
    hiddenRowsSummary: (count: number, maxDisplayedRows: number) => string;
    failedRowsEyebrow: string;
    failedRowsTitle: string;
    showingFailedRows: (shown: number, total: number) => string;
    hiddenFailedRowsSummary: (count: number) => string;
    directResultEmpty: string;
    walkthroughResultEmpty: string;
    finalResultEyebrow: string;
    finalResultTitle: string;
    stderrTitle: string;
  };
  common: {
    close: string;
    pass: string;
    fail: string;
    running: string;
    valid: string;
    invalid: string;
  };
}

export const appMessages: Record<AppLocale, AppMessages> = {
  en: {
    shell: {
      eyebrow: 'Interactive Learning Platform',
      title: 'Data Validation with Pydantic',
      description:
        'Practice with guided exercises, instant feedback, and a lightweight in-browser coding environment.',
      languageLabel: 'Language',
      noExercisesTitle: 'No exercises are available yet.',
      noExercisesDescription:
        'Add a new exercise config in src/data/exercises and it will appear automatically.',
      editorTitle: 'Editor',
      reset: 'Reset',
      defaultRun: 'Run',
      showReferenceSolution: 'Show reference solution',
      hideReferenceSolution: 'Hide reference solution',
      referenceSolution: 'Reference solution',
    },
    exerciseList: {
      title: 'Exercises',
      difficulty: {
        beginner: 'beginner',
        intermediate: 'intermediate',
        advanced: 'advanced',
      },
    },
    exerciseDetails: {
      learningGoals: 'Learning Goals',
      hints: 'Hints',
      exampleOutput: 'Example output',
      minutes: (minutes) => `${minutes} min`,
    },
    editor: {
      availableImports: 'Available imports',
      codeEditorAriaLabel: 'Code editor',
    },
    csvPreview: {
      title: 'CSV Preview',
      description: 'Inspect a readable preview of the repo CSV before you run the exercise.',
      showingColumns: (shown, total) => `Showing ${shown} / ${total} columns`,
      totalRows: (count) => `${count.toLocaleString()} rows`,
      showingFirstRows: (count) => `Showing first ${count} rows`,
      showingAllRows: (count) => `Showing all ${count} rows`,
      download: 'Download CSV',
      shortenedNote:
        'The table is shortened for faster reading on the web. Use Download CSV to inspect the full dataset.',
      loading: 'Loading CSV...',
      noCsvConfigured: 'No CSV file configured.',
      rowHeader: 'Row',
    },
    visualizer: {
      walkthroughEyebrow: 'Validation Walkthrough',
      walkthroughChoiceTitle: 'Choose how to run validation',
      visualizeLabel: 'Visualize',
      visualizeDescription:
        'Open the walkthrough and start animating the CSV validation flow automatically.',
      playbackLabel: 'Speed',
      playbackDescription: {
        '1x': 'One field every second.',
        '2x': 'A faster half-second walkthrough per field.',
        '4x': 'Quick teaching playback at quarter-second steps.',
      },
      directRunLabel: 'Direct Run',
      skipLabel: 'Skip',
      directRunDescription:
        'Run the full validation immediately without the visual teaching flow.',
      previousLabel: 'Previous',
      nextLabel: 'Next',
      pauseLabel: 'Pause',
      resumeLabel: 'Resume',
      directResultEyebrow: 'Validation Result',
      directResultTitle: 'Full CSV validation without the walkthrough',
      preparedErrorEyebrow: 'Visualization Error',
      preparedErrorTitle: 'The walkthrough could not be prepared',
      animatedRows: (shown, total) => `Animating ${shown} / ${total} rows`,
      walkthroughTitle: (modelClassName) => `${modelClassName} validates the full CSV file`,
      validatedOutputEyebrow: 'Validated Output',
      currentFieldResultTitle: 'Current field result',
      rowFieldTitle: (rowIndex, fieldName) => `Row ${rowIndex + 1} - ${fieldName}`,
      accepted: 'accepted',
      error: 'error',
      rawValue: 'Raw value',
      pydanticOutput: 'Pydantic output',
      pickPlaybackSpeed: 'Pick a playback speed to step through each field.',
      pydanticClassEyebrow: 'Pydantic Class',
      highlightedModelLinesTitle: 'Highlighted model lines',
      relatedCodeContinuesBelow: 'Related code continues below',
      rawInputEyebrow: 'Raw Input',
      currentCsvRowsTitle: 'Current CSV row',
      rowInFocus: (rowIndex) => `Row ${rowIndex + 1} in focus`,
      rowStatusInProgress: 'row in progress',
      rowStatusComplete: 'row complete',
      rowStatusInvalid: 'row invalid',
      activeCsvRowsPlaceholder:
        'The active CSV rows will appear here when the walkthrough starts.',
      wholeFileEyebrow: 'Whole File Result',
      wholeFileTitle: 'Validation results across the full CSV',
      passedRows: (count) => `Passed rows: ${count}`,
      failedRows: (count) => `Failed rows: ${count}`,
      showingResultRows: (shown, total) => `Showing ${shown} / ${total} rows`,
      pendingRows: (count) => `Pending rows: ${count}`,
      rowLabel: (rowIndex) => `Row ${rowIndex + 1}`,
      rowValid: 'valid',
      rowInvalid: 'invalid',
      rawCsvRow: 'Raw CSV row',
      validationResult: 'Validation result',
      validationErrors: 'Validation errors',
      hiddenRowsSummary: (count, maxDisplayedRows) =>
        `... ${count} more ${count === 1 ? 'row is' : 'rows are'} hidden from this preview. The walkthrough shows only the first ${maxDisplayedRows} rows here.`,
      failedRowsEyebrow: 'Failed Rows',
      failedRowsTitle: 'Rows that raised validation errors',
      showingFailedRows: (shown, total) => `Showing ${shown} / ${total} failed rows`,
      hiddenFailedRowsSummary: (count) =>
        `... ${count} more failed ${count === 1 ? 'row is' : 'rows are'} hidden from this preview.`,
      directResultEmpty:
        'The row-level results will appear here as soon as the direct validation finishes.',
      walkthroughResultEmpty:
        'The row-level results will append here as soon as each CSV row finishes validation.',
      finalResultEyebrow: 'Final Result',
      finalResultTitle: 'Exercise result',
      stderrTitle: 'Stderr / Error',
    },
    common: {
      close: 'Close',
      pass: 'pass',
      fail: 'fail',
      running: 'running',
      valid: 'valid',
      invalid: 'invalid',
    },
  },
  vi: {
    shell: {
      eyebrow: 'Interactive Learning Platform',
      title: 'Data Validation với Pydantic',
      description:
        'Thực hành với các bài tập có hướng dẫn, nhận feedback tức thì và môi trường code gọn nhẹ ngay trên trình duyệt.',
      languageLabel: 'Ngôn ngữ',
      noExercisesTitle: 'Chưa có bài tập nào.',
      noExercisesDescription:
        'Thêm config bài tập mới trong src/data/exercises và nó sẽ tự động hiển thị.',
      editorTitle: 'Editor',
      reset: 'Reset',
      defaultRun: 'Run',
      showReferenceSolution: 'Xem bài giải tham khảo',
      hideReferenceSolution: 'Ẩn bài giải tham khảo',
      referenceSolution: 'Bài giải tham khảo',
    },
    exerciseList: {
      title: 'Danh sách bài tập',
      difficulty: {
        beginner: 'Cơ bản',
        intermediate: 'Trung cấp',
        advanced: 'Nâng cao',
      },
    },
    exerciseDetails: {
      learningGoals: 'Mục tiêu bài học',
      hints: 'Gợi ý',
      exampleOutput: 'Output mẫu',
      minutes: (minutes) => `${minutes} phút`,
    },
    editor: {
      availableImports: 'Các import có sẵn',
      codeEditorAriaLabel: 'Code editor',
    },
    csvPreview: {
      title: 'Xem trước CSV',
      description: 'Xem trước file CSV dưới dạng dễ đọc trước khi bạn chạy bài tập.',
      showingColumns: (shown, total) => `Đang hiển thị ${shown} / ${total} cột`,
      totalRows: (count) => `${count.toLocaleString()} dòng`,
      showingFirstRows: (count) => `Đang hiển thị ${count} dòng đầu tiên`,
      showingAllRows: (count) => `Đang hiển thị toàn bộ ${count} dòng`,
      download: 'Tải xuống CSV',
      shortenedNote:
        'Bảng đã được thu gọn để tải nhanh hơn trên web. Sử dụng Tải xuống CSV để xem toàn bộ dữ liệu.',
      loading: 'Đang tải CSV...',
      noCsvConfigured: 'Chưa cấu hình file CSV nào.',
      rowHeader: 'Dòng',
    },
    visualizer: {
      walkthroughEyebrow: 'Hướng dẫn Validation',
      walkthroughChoiceTitle: 'Chọn cách chạy validation',
      visualizeLabel: 'Visualize',
      visualizeDescription:
        'Mở hướng dẫn và tự động diễn hoạt quá trình validation file CSV.',
      playbackLabel: 'Tốc độ',
      playbackDescription: {
        '1x': 'Một field mỗi giây.',
        '2x': 'Nhanh hơn với nửa giây cho mỗi field.',
        '4x': 'Phát cực nhanh với 0.25 giây cho mỗi bước.',
      },
      directRunLabel: 'Chạy trực tiếp',
      skipLabel: 'Skip',
      directRunDescription:
        'Chạy validation toàn bộ ngay lập tức mà không cần luồng hướng dẫn visualize.',
      previousLabel: 'Trước',
      nextLabel: 'Tiếp',
      pauseLabel: 'Pause',
      resumeLabel: 'Resume',
      directResultEyebrow: 'Kết quả Validation',
      directResultTitle: 'Chạy validation toàn bộ CSV bỏ qua hướng dẫn',
      preparedErrorEyebrow: 'Lỗi Visualize',
      preparedErrorTitle: 'Không thể chuẩn bị hướng dẫn',
      animatedRows: (shown, total) => `Đang diễn hoạt ${shown} / ${total} dòng`,
      walkthroughTitle: (modelClassName) => `${modelClassName} đang validate toàn bộ file CSV`,
      validatedOutputEyebrow: 'Output đã validate',
      currentFieldResultTitle: 'Kết quả của field hiện tại',
      rowFieldTitle: (rowIndex, fieldName) => `Dòng ${rowIndex + 1} - ${fieldName}`,
      accepted: 'accepted',
      error: 'error',
      rawValue: 'Giá trị gốc',
      pydanticOutput: 'Output của Pydantic',
      pickPlaybackSpeed: 'Chọn tốc độ phát để xem qua từng field.',
      pydanticClassEyebrow: 'Class Pydantic',
      highlightedModelLinesTitle: 'Các dòng model được highlight',
      relatedCodeContinuesBelow: 'Code liên quan tiếp tục bên dưới',
      rawInputEyebrow: 'Input gốc',
      currentCsvRowsTitle: 'Dòng CSV hiện tại',
      rowInFocus: (rowIndex) => `Đang focus vào dòng ${rowIndex + 1}`,
      rowStatusInProgress: 'đang xử lý',
      rowStatusComplete: 'đã xử lý xong',
      rowStatusInvalid: 'invalid',
      activeCsvRowsPlaceholder:
        'Các dòng CSV đang active sẽ hiển thị ở đây khi hướng dẫn bắt đầu.',
      wholeFileEyebrow: 'Kết quả toàn bộ file',
      wholeFileTitle: 'Kết quả validation của toàn bộ file CSV',
      passedRows: (count) => `Số dòng pass: ${count}`,
      failedRows: (count) => `Số dòng fail: ${count}`,
      showingResultRows: (shown, total) => `Đang hiển thị ${shown} / ${total} dòng`,
      pendingRows: (count) => `Số dòng pending: ${count}`,
      rowLabel: (rowIndex) => `Dòng ${rowIndex + 1}`,
      rowValid: 'valid',
      rowInvalid: 'invalid',
      rawCsvRow: 'Dòng CSV gốc',
      validationResult: 'Kết quả validation',
      validationErrors: 'Lỗi validation',
      hiddenRowsSummary: (count, maxDisplayedRows) =>
        `... ${count} dòng nữa được ẩn khỏi bản preview này. Hướng dẫn chỉ hiển thị ${maxDisplayedRows} dòng đầu tiên tại đây.`,
      failedRowsEyebrow: 'Các dòng fail',
      failedRowsTitle: 'Các dòng phát sinh lỗi validation',
      showingFailedRows: (shown, total) => `Đang hiển thị ${shown} / ${total} dòng fail`,
      hiddenFailedRowsSummary: (count) =>
        `... ${count} dòng fail nữa được ẩn khỏi bản preview này.`,
      directResultEmpty:
        'Kết quả của từng dòng sẽ hiển thị ở đây ngay khi quá trình chạy validation trực tiếp hoàn tất.',
      walkthroughResultEmpty:
        'Kết quả của từng dòng sẽ được nối vào đây ngay khi mỗi dòng CSV chạy validation xong.',
      finalResultEyebrow: 'Kết quả cuối cùng',
      finalResultTitle: 'Kết quả bài tập',
      stderrTitle: 'Stderr / Error',
    },
    common: {
      close: 'Đóng',
      pass: 'pass',
      fail: 'fail',
      running: 'running',
      valid: 'valid',
      invalid: 'invalid',
    },
  },
};

export const DEFAULT_APP_LOCALE: AppLocale = 'vi';
