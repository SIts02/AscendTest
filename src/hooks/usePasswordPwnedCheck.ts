import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PasswordCheckResult {
    isPwned: boolean;
    count: number;
    message: string;
}

export const usePasswordPwnedCheck = () => {
    const [isChecking, setIsChecking] = useState(false);
    const [result, setResult] = useState<PasswordCheckResult | null>(null);

    const checkPassword = useCallback(async (password: string): Promise<PasswordCheckResult> => {
        try {
            setIsChecking(true);
            setResult(null);

            const { data, error } = await supabase.functions.invoke('check-password-pwned', {
                body: { password }
            });

            if (error) {
                console.error('Password pwned check error:', error);

                const fallbackResult = {
                    isPwned: false,
                    count: 0,
                    message: 'Não foi possível verificar a senha. Prosseguindo por segurança.'
                };
                setResult(fallbackResult);
                return fallbackResult;
            }

            const checkResult = data as PasswordCheckResult;
            setResult(checkResult);
            return checkResult;
        } catch (error) {
            console.error('Password pwned check exception:', error);

            const fallbackResult = {
                isPwned: false,
                count: 0,
                message: 'Erro ao verificar senha. Prosseguindo por segurança.'
            };
            setResult(fallbackResult);
            return fallbackResult;
        } finally {
            setIsChecking(false);
        }
    }, []);

    return { checkPassword, isChecking, result };
};