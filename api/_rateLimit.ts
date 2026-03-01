import type { VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_auth.js';

interface RateLimitResult {
  limited: boolean;
  retryAfter?: number;
}

const LIMITS: Record<string, { maxRequests: number; windowMinutes: number }> = {
  '/api/gemini': { maxRequests: 20, windowMinutes: 1 },
  '/api/tse': { maxRequests: 30, windowMinutes: 1 },
  '/api/news': { maxRequests: 10, windowMinutes: 1 },
  '/api/trends': { maxRequests: 10, windowMinutes: 1 },
};

export async function checkRateLimit(
  userId: string,
  endpoint: string,
): Promise<RateLimitResult> {
  const config = LIMITS[endpoint] || { maxRequests: 20, windowMinutes: 1 };
  const { maxRequests, windowMinutes } = config;

  const supabase = getSupabaseAdmin();
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  // Count requests in the current window
  const { count, error: countError } = await supabase
    .from('api_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart);

  if (countError) {
    // If rate limit table doesn't exist yet, allow the request
    console.warn('Rate limit check failed:', countError.message);
    return { limited: false };
  }

  const currentCount = count || 0;

  if (currentCount >= maxRequests) {
    return {
      limited: true,
      retryAfter: windowMinutes * 60,
    };
  }

  // Log this request
  const { error: insertError } = await supabase
    .from('api_rate_limits')
    .insert({ user_id: userId, endpoint });

  if (insertError) {
    console.warn('Rate limit insert failed:', insertError.message);
  }

  return { limited: false };
}

export function sendRateLimitResponse(res: VercelResponse, retryAfter: number): void {
  res.setHeader('Retry-After', String(retryAfter));
  res.status(429).json({
    error: 'Muitas requisições. Tente novamente em breve.',
    retryAfter,
  });
}
