import { useCallback } from 'react';
import { useRateLimit } from './useRateLimit';
import { useAuditLog } from './useAuditLog';
import { toast } from 'sonner';

interface SecureActionOptions {
  endpoint: string;
  action: Parameters<ReturnType<typeof useAuditLog>['logEvent']>[0];
  resource?: string;
  maxRequests?: number;
  windowMinutes?: number;
}

export function useSecureAction() {
  const { checkRateLimit } = useRateLimit();
  const { logEvent } = useAuditLog();

  const executeSecurely = useCallback(async <T,>(
    options: SecureActionOptions,
    action: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T | null> => {
    const { endpoint, action: auditAction, resource, maxRequests, windowMinutes } = options;

    // Check rate limit
    const allowed = await checkRateLimit(endpoint, { maxRequests, windowMinutes });
    if (!allowed) {
      toast.error('Muitas requisições. Por favor, aguarde um momento.');
      return null;
    }

    try {
      const result = await action();
      
      // Log successful action
      await logEvent(auditAction, resource, {
        ...metadata,
        success: true,
      });

      return result;
    } catch (error: unknown) {
      // Log failed action
      await logEvent(auditAction, resource, {
        ...metadata,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }, [checkRateLimit, logEvent]);

  return { executeSecurely };
}
