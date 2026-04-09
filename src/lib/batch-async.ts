/**
 * Process an array in fixed-size batches with optional delay between batches.
 * Keeps concurrent outbound requests under control.
 */
export async function batchAsync<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
  delayBetweenBatchesMs = 0,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (delayBetweenBatchesMs > 0 && i + batchSize < items.length) {
      await new Promise((r) => setTimeout(r, delayBetweenBatchesMs));
    }
  }
  return results;
}
