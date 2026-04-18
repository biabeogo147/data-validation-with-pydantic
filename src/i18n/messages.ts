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
      eyebrow: 'Nền tảng học tương tác',
      title: 'Data Validation với Pydantic',
      description:
        'Luyện tập qua các bài có hướng dẫn, phản hồi tức thì, và môi trường code gọn nhẹ ngay trong trình duyệt.',
      languageLabel: 'Ngôn ngữ',
      noExercisesTitle: 'Hiện chưa có bài tập nào.',
      noExercisesDescription:
        'Thêm một cấu hình bài tập mới trong src/data/exercises và bài đó sẽ tự xuất hiện.',
      editorTitle: 'Editor',
      reset: 'Đặt lại',
      defaultRun: 'Chạy',
      showReferenceSolution: 'Hiện lời giải tham khảo',
      hideReferenceSolution: 'Ẩn lời giải tham khảo',
      referenceSolution: 'Lời giải tham khảo',
    },
    exerciseList: {
      title: 'Bài tập',
      difficulty: {
        beginner: 'cơ bản',
        intermediate: 'trung cấp',
        advanced: 'nâng cao',
      },
    },
    exerciseDetails: {
      learningGoals: 'Mục tiêu học tập',
      hints: 'Gợi ý',
      exampleOutput: 'Ví dụ đầu ra',
      minutes: (minutes) => `${minutes} phút`,
    },
    editor: {
      availableImports: 'Import có sẵn',
      codeEditorAriaLabel: 'Trình soạn mã',
    },
    csvPreview: {
      title: 'Xem trước CSV',
      description: 'Xem nhanh dữ liệu CSV trong repo trước khi chạy bài tập.',
      showingColumns: (shown, total) => `Đang hiển thị ${shown} / ${total} cột`,
      totalRows: (count) => `${count.toLocaleString()} hàng`,
      showingFirstRows: (count) => `Đang hiển thị ${count} hàng đầu tiên`,
      showingAllRows: (count) => `Đang hiển thị toàn bộ ${count} hàng`,
      download: 'Tải CSV',
      shortenedNote:
        'Bảng đã được rút gọn để dễ đọc trên web. Hãy dùng Tải CSV nếu bạn muốn xem toàn bộ dữ liệu.',
      loading: 'Đang tải CSV...',
      noCsvConfigured: 'Chưa cấu hình file CSV.',
      rowHeader: 'Hàng',
    },
    visualizer: {
      walkthroughEyebrow: 'Diễn giải validate',
      walkthroughChoiceTitle: 'Chọn cách chạy validation',
      visualizeLabel: 'Visualize',
      visualizeDescription:
        'Mở walkthrough và tự động chạy qua toàn bộ luồng validate CSV.',
      playbackLabel: 'Tốc độ',
      playbackDescription: {
        '1x': 'Một field mỗi giây.',
        '2x': 'Minh họa nhanh hơn, nửa giây cho mỗi field.',
        '4x': 'Minh họa rất nhanh với nhịp một phần tư giây.',
      },
      directRunLabel: 'Chạy trực tiếp',
      skipLabel: 'Bỏ qua',
      directRunDescription:
        'Chạy validate toàn bộ ngay lập tức mà không cần phần minh họa trực quan.',
      previousLabel: 'Trước',
      nextLabel: 'Tiếp',
      pauseLabel: 'Tạm dừng',
      resumeLabel: 'Tiếp tục',
      directResultEyebrow: 'Kết quả validate',
      directResultTitle: 'Validate toàn bộ CSV không qua phần minh họa',
      preparedErrorEyebrow: 'Lỗi minh họa',
      preparedErrorTitle: 'Không thể chuẩn bị phần walkthrough',
      animatedRows: (shown, total) => `Đang minh họa ${shown} / ${total} hàng`,
      walkthroughTitle: (modelClassName) => `${modelClassName} đang validate toàn bộ file CSV`,
      validatedOutputEyebrow: 'Đầu ra đã validate',
      currentFieldResultTitle: 'Kết quả field hiện tại',
      rowFieldTitle: (rowIndex, fieldName) => `Hàng ${rowIndex + 1} - ${fieldName}`,
      accepted: 'hợp lệ',
      error: 'lỗi',
      rawValue: 'Giá trị thô',
      pydanticOutput: 'Đầu ra Pydantic',
      pickPlaybackSpeed: 'Chọn tốc độ phát để đi qua từng field.',
      pydanticClassEyebrow: 'Pydantic Class',
      highlightedModelLinesTitle: 'Các dòng model đang được nhấn mạnh',
      relatedCodeContinuesBelow: 'Đoạn code liên quan tiếp tục ở bên dưới',
      rawInputEyebrow: 'Dữ liệu thô',
      currentCsvRowsTitle: 'Hàng CSV hiện tại',
      rowInFocus: (rowIndex) => `Đang tập trung vào hàng ${rowIndex + 1}`,
      rowStatusInProgress: 'đang xử lý',
      rowStatusComplete: 'đã xong',
      rowStatusInvalid: 'hàng lỗi',
      activeCsvRowsPlaceholder:
        'Các hàng CSV đang hoạt động sẽ xuất hiện ở đây khi walkthrough bắt đầu.',
      wholeFileEyebrow: 'Kết quả toàn file',
      wholeFileTitle: 'Kết quả validate trên toàn bộ CSV',
      passedRows: (count) => `Hàng hợp lệ: ${count}`,
      failedRows: (count) => `Hàng lỗi: ${count}`,
      showingResultRows: (shown, total) => `Đang hiển thị ${shown} / ${total} hàng`,
      pendingRows: (count) => `Hàng chờ xử lý: ${count}`,
      rowLabel: (rowIndex) => `Hàng ${rowIndex + 1}`,
      rowValid: 'hợp lệ',
      rowInvalid: 'không hợp lệ',
      rawCsvRow: 'Hàng CSV thô',
      validationResult: 'Kết quả validate',
      validationErrors: 'Các lỗi validate',
      hiddenRowsSummary: (count, maxDisplayedRows) =>
        `... còn ${count} ${count === 1 ? 'hàng' : 'hàng'} đang được ẩn khỏi phần preview này. Walkthrough chỉ hiển thị ${maxDisplayedRows} hàng đầu tiên ở đây.`,
      failedRowsEyebrow: 'Các hàng lỗi',
      failedRowsTitle: 'Những hàng gây ra lỗi validate',
      showingFailedRows: (shown, total) => `Đang hiển thị ${shown} / ${total} hàng lỗi`,
      hiddenFailedRowsSummary: (count) =>
        `... còn ${count} hàng lỗi khác đang được ẩn khỏi phần preview này.`,
      directResultEmpty:
        'Kết quả theo từng hàng sẽ xuất hiện ở đây ngay khi lần chạy trực tiếp hoàn tất.',
      walkthroughResultEmpty:
        'Kết quả theo từng hàng sẽ được nối thêm vào đây ngay khi mỗi hàng CSV validate xong.',
      finalResultEyebrow: 'Kết quả cuối cùng',
      finalResultTitle: 'Kết quả bài tập',
      stderrTitle: 'Stderr / Lỗi',
    },
    common: {
      close: 'Đóng',
      pass: 'đạt',
      fail: 'trượt',
      running: 'đang chạy',
      valid: 'hợp lệ',
      invalid: 'không hợp lệ',
    },
  },
};

export const DEFAULT_APP_LOCALE: AppLocale = 'vi';
