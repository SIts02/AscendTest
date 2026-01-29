import { useUserPreferences } from "./useUserPreferences";

export const useFormatters = () => {
  const { preferences } = useUserPreferences();
  const currency = preferences.currency || "BRL";

  const formatCurrency = (value: number | string, options?: Intl.NumberFormatOptions) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    };

    return new Intl.NumberFormat(preferences.language || 'pt-BR', defaultOptions).format(numValue);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(preferences.language || 'pt-BR').format(dateObj);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat(preferences.language || 'pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  return {
    formatCurrency,
    formatDate,
    formatPercentage,
  };
};