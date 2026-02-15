export function normalizeRelativePath(input = '') {
  return input.replaceAll('\\', '/').replace(/^\/+/, '');
}

export function isPathInsideRoot(rootAbsolutePath, candidateAbsolutePath) {
  if (candidateAbsolutePath === rootAbsolutePath) {
    return true;
  }

  return candidateAbsolutePath.startsWith(`${rootAbsolutePath}/`);
}

export function parentDirectoryPath(relPath = '') {
  const normalized = normalizeRelativePath(relPath);
  if (!normalized || !normalized.includes('/')) {
    return '';
  }

  return normalized.split('/').slice(0, -1).join('/');
}

export function replacePathPrefix(targetPath, oldPrefix, newPrefix) {
  const normalizedTarget = normalizeRelativePath(targetPath);
  const normalizedOld = normalizeRelativePath(oldPrefix);
  const normalizedNew = normalizeRelativePath(newPrefix);

  if (normalizedTarget === normalizedOld) {
    return normalizedNew;
  }

  if (normalizedTarget.startsWith(`${normalizedOld}/`)) {
    return `${normalizedNew}${normalizedTarget.slice(normalizedOld.length)}`;
  }

  return normalizedTarget;
}
