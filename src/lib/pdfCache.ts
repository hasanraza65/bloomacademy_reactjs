/**
 * Utility to cache PDF materials using the Browser's Cache API.
 * This ensures that large files are only downloaded once per user.
 */

const CACHE_NAME = 'bloom-pdf-cache-v1';

/**
 * Checks if a PDF is already in the cache and returns its local object URL.
 */
export async function getCachedPdfUrl(url: string): Promise<string | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url);
    if (response) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error('[Cache] Error matching cache:', error);
  }
  return null;
}

/**
 * Saves a PDF response to the cache.
 */
export async function savePdfToCache(url: string, blob: Blob): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': blob.size.toString(),
      }
    });
    await cache.put(url, response);
    console.log(`[Cache] Successfully cached PDF: ${url}`);
  } catch (error) {
    console.error('[Cache] Error saving to cache:', error);
  }
}

/**
 * Clean up object URLs created from the cache.
 */
export function revokeCachedUrl(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
