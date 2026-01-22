import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type AuditAction = 
  | 'login'
  | 'logout'
  | 'signup'
  | 'password_reset'
  | 'profile_update'
  | 'transaction_create'
  | 'transaction_update'
  | 'transaction_delete'
  | 'budget_create'
  | 'budget_update'
  | 'goal_create'
  | 'goal_update'
  | 'goal_delete'
  | 'settings_update'
  | 'mfa_enable'
  | 'mfa_disable'
  | 'mfa_verify'
  | 'export_data'
  | 'import_data'
  | 'report_create'
  | 'report_delete';

interface AuditMetadata {
  [key: string]: unknown;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logEvent = useCallback(async (
    action: AuditAction,
    resource?: string,
    metadata?: AuditMetadata
  ): Promise<void> => {
    if (!user?.id) return;

    try {
      // Client-side logging - can be extended to send to an analytics service
      // or a dedicated audit log table when available
      console.debug('[Audit]', {
        userId: user.id,
        action,
        resource,
        metadata: metadata ? sanitizeMetadata(metadata) : undefined,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Silently fail - audit logging should not block user actions
      console.error('Audit log error:', error);
    }
  }, [user?.id]);

  return { logEvent };
}

// Remove sensitive fields from metadata before logging
function sanitizeMetadata(metadata: AuditMetadata): Record<string, unknown> {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credit_card', 'cvv', 'ssn'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as AuditMetadata);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
