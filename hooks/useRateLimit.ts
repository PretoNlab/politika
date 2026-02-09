import { useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface RateLimitOptions {
  maxCalls: number;
  windowMs: number;
  errorMessage?: string;
}

interface CallRecord {
  timestamp: number;
}

/**
 * Hook para implementar rate limiting no cliente
 * Previne abuso de APIs limitando o número de chamadas em uma janela de tempo
 *
 * @param options - Configurações de rate limiting
 * @returns Função para verificar se a chamada é permitida
 *
 * @example
 * const checkRateLimit = useRateLimit({ maxCalls: 5, windowMs: 60000 });
 *
 * const handleSubmit = async () => {
 *   if (!checkRateLimit()) return;
 *   // Faz a chamada de API
 * };
 */
export const useRateLimit = (options: RateLimitOptions) => {
  const {
    maxCalls,
    windowMs,
    errorMessage = `Você está fazendo muitas requisições. Aguarde um momento.`
  } = options;

  const callsRef = useRef<CallRecord[]>([]);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();

    // Remove chamadas antigas fora da janela de tempo
    callsRef.current = callsRef.current.filter(
      call => now - call.timestamp < windowMs
    );

    // Verifica se excedeu o limite
    if (callsRef.current.length >= maxCalls) {
      const oldestCall = callsRef.current[0];
      const timeUntilReset = windowMs - (now - oldestCall.timestamp);
      const secondsUntilReset = Math.ceil(timeUntilReset / 1000);

      toast.error(
        `${errorMessage} Tente novamente em ${secondsUntilReset}s.`,
        { duration: 3000 }
      );

      return false;
    }

    // Registra a nova chamada
    callsRef.current.push({ timestamp: now });
    return true;
  }, [maxCalls, windowMs, errorMessage]);

  return checkRateLimit;
};

/**
 * Hook para debouncing de funções
 * Útil para inputs que disparam chamadas de API
 *
 * @param callback - Função a ser executada após o delay
 * @param delay - Tempo de espera em ms
 * @returns Função debounced
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedCallback;
};
