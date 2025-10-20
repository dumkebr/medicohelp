/**
 * Exponential backoff retry utility for API calls
 * 
 * @param fn - Async function to retry
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 2000ms)
 * @param timeout - Timeout for each attempt in milliseconds (default: 45000ms)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 2000,
  timeout: number = 45000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: Request took too long")), timeout)
      );

      // Race between the function and timeout
      const result = await Promise.race([fn(), timeoutPromise]);
      
      // Success! Return result
      return result;
    } catch (error: any) {
      lastError = error;
      const isLastAttempt = attempt === maxAttempts - 1;

      console.error(`Attempt ${attempt + 1}/${maxAttempts} failed:`, error.message);

      // If this was the last attempt, throw the error
      if (isLastAttempt) {
        throw new Error(`Failed after ${maxAttempts} attempts: ${error.message}`);
      }

      // Calculate exponential backoff delay: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retrying in ${delay}ms...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error("Unknown error in retry logic");
}
