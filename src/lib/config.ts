
export const SITE_ROOT = (import.meta as any).env.VITE_SITE_ROOT || 'https://academy.bloom-buddies.fr/backend/public';
export const BASE_URL = `${SITE_ROOT}/api/`;

/**
 * Builds a full URL for a classroom material file.
 * Prioritizes file_path if available.
 */
export const getFileUrl = (item: { file_path?: string; file_url?: string } | null | undefined): string => {
  if (!item) return '';

  // 1. If file_path exists, use the specific materials path
  if (item.file_path) {
    return `${SITE_ROOT}/classroom_materials/${item.file_path}`;
  }

  // 2. If file_url exists, normalize it
  if (item.file_url) {
    let url = item.file_url;

    // Normalize domain mixing if it's a full URL
    // This ensures we always use the defined SITE_ROOT domain/path
    const backendBase = 'https://academy.bloom-buddies.fr/backend/public';
    const domainBase = 'https://academy.bloom-buddies.fr';

    if (url.startsWith(backendBase)) {
      url = url.replace(backendBase, SITE_ROOT);
    } else if (url.startsWith(domainBase)) {
      // If it only has the domain but SITE_ROOT has /backend/public, 
      // we should be careful not to double-path it, but user wants SITE_ROOT as base.
      url = url.replace(domainBase, SITE_ROOT);
    }

    if (url.startsWith('http')) {
      return url;
    }

    // Prepend SITE_ROOT if relative
    const separator = url.startsWith('/') ? '' : '/';
    return `${SITE_ROOT}${separator}${url}`;
  }

  return '';
};
