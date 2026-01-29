import CryptoJS from 'crypto-js';

const ENCRYPTION_VERSION = 1;
const KEY_SIZE = 256;
const ITERATIONS = 10000;

export class SecureDataEncryption {
    private static instance: SecureDataEncryption;
    private userKey: string | null = null;

    private constructor() { }

    static getInstance(): SecureDataEncryption {
        if (!SecureDataEncryption.instance) {
            SecureDataEncryption.instance = new SecureDataEncryption();
        }
        return SecureDataEncryption.instance;
    }

    async initializeUserKey(userId: string, userPassword?: string): Promise<void> {
        const storedKey = sessionStorage.getItem(`enc_key_${userId}`);

        if (storedKey) {
            this.userKey = storedKey;
            return;
        }

        const key = userPassword
            ? CryptoJS.PBKDF2(userPassword, userId, {
                keySize: KEY_SIZE / 32,
                iterations: ITERATIONS
            }).toString()
            : CryptoJS.lib.WordArray.random(KEY_SIZE / 8).toString();

        this.userKey = key;

        sessionStorage.setItem(`enc_key_${userId}`, key);
    }

    encryptData(data: string): string {
        if (!this.userKey) {
            throw new Error('Encryption key not initialized. Call initializeUserKey first.');
        }

        const encrypted = CryptoJS.AES.encrypt(data, this.userKey).toString();

        return JSON.stringify({
            version: ENCRYPTION_VERSION,
            data: encrypted,
            timestamp: Date.now()
        });
    }

    decryptData(encryptedData: string): string {
        if (!this.userKey) {
            throw new Error('Encryption key not initialized. Call initializeUserKey first.');
        }

        try {
            const parsed = JSON.parse(encryptedData);

            if (parsed.version !== ENCRYPTION_VERSION) {
                throw new Error('Incompatible encryption version');
            }

            const decrypted = CryptoJS.AES.decrypt(parsed.data, this.userKey);
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    encryptBalance(balance: number): string {
        return this.encryptData(balance.toString());
    }

    decryptBalance(encryptedBalance: string): number {
        const decrypted = this.decryptData(encryptedBalance);
        return parseFloat(decrypted);
    }

    encryptAccountNumber(accountNumber: string): string {
        return this.encryptData(accountNumber);
    }

    decryptAccountNumber(encryptedAccountNumber: string): string {
        return this.decryptData(encryptedAccountNumber);
    }

    maskAccountNumber(accountNumber: string): string {
        if (accountNumber.length <= 4) return accountNumber;

        const lastFour = accountNumber.slice(-4);
        const masked = '*'.repeat(accountNumber.length - 4);
        return masked + lastFour;
    }

    maskSensitiveData(data: string, visibleChars: number = 4): string {
        if (data.length <= visibleChars) return data;

        const visible = data.slice(-visibleChars);
        const masked = '*'.repeat(data.length - visibleChars);
        return masked + visible;
    }

    hashData(data: string): string {
        return CryptoJS.SHA256(data).toString();
    }

    generateSecureToken(): string {
        return CryptoJS.lib.WordArray.random(32).toString();
    }

    clearUserKey(userId: string): void {
        sessionStorage.removeItem(`enc_key_${userId}`);
        this.userKey = null;
    }

    isKeyInitialized(): boolean {
        return this.userKey !== null;
    }
}

export const secureData = SecureDataEncryption.getInstance();

export const sanitizeForDisplay = (data: any): any => {
    if (typeof data === 'string') {
        if (data.includes('encrypted') || data.length > 100) {
            return '[ENCRYPTED]';
        }
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(sanitizeForDisplay);
    }

    if (typeof data === 'object' && data !== null) {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(data)) {
            if (key.includes('token') || key.includes('password') || key.includes('secret') || key.includes('key')) {
                sanitized[key] = '[REDACTED]';
            } else if (key.includes('encrypted')) {
                sanitized[key] = '[ENCRYPTED]';
            } else if (key.includes('balance') && typeof value === 'number') {
                sanitized[key] = '***.**';
            } else {
                sanitized[key] = sanitizeForDisplay(value);
            }
        }
        return sanitized;
    }

    return data;
};

export const preventDataLeakage = () => {
    if (typeof window !== 'undefined') {
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;

        console.log = (...args: any[]) => {
            const sanitized = args.map(sanitizeForDisplay);
            originalConsoleLog(...sanitized);
        };

        console.error = (...args: any[]) => {
            const sanitized = args.map(sanitizeForDisplay);
            originalConsoleError(...sanitized);
        };

        console.warn = (...args: any[]) => {
            const sanitized = args.map(sanitizeForDisplay);
            originalConsoleWarn(...sanitized);
        };

        window.addEventListener('error', (event) => {
            if (event.message.includes('token') || event.message.includes('password')) {
                event.preventDefault();
                console.error('[Security] Sensitive data in error message blocked');
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason?.toString() || '';
            if (reason.includes('token') || reason.includes('password') || reason.includes('secret')) {
                event.preventDefault();
                console.error('[Security] Sensitive data in promise rejection blocked');
            }
        });
    }
};
