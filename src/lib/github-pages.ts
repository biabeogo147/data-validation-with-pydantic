const ABSOLUTE_URL_PATTERN = /^(?:[a-z]+:)?\/\//i;

export function normalizeBasePath(basePath: string = '/'): string {
  const normalized = basePath.trim() || '/';
  const withLeadingSlash = normalized.startsWith('/')
    ? normalized
    : `/${normalized}`;

  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export function withBasePath(path: string, basePath: string = '/'): string {
  if (ABSOLUTE_URL_PATTERN.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/^\/+/, '');
  const normalizedBase = normalizeBasePath(basePath);

  return normalizedPath ? `${normalizedBase}${normalizedPath}` : normalizedBase;
}

export function getRuntimeBasePath(): string {
  return normalizeBasePath(import.meta.env.BASE_URL || '/');
}
