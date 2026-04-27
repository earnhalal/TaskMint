import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'PKR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  formatAmount: (amount: number) => string;
  convertAmount: (amount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CONVERSION_RATE = 280;

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('PKR');

  useEffect(() => {
    // Check localStorage
    const saved = localStorage.getItem('taskmint_currency');
    if (saved === 'PKR' || saved === 'USD') {
      setCurrency(saved);
      return;
    }

    // IP Detection
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code === 'PK') {
          setCurrency('PKR');
        } else {
          setCurrency('USD');
        }
      })
      .catch(() => setCurrency('PKR')); // Default to PKR on error
  }, []);

  const toggleCurrency = () => {
    setCurrency(prev => {
      const next = prev === 'PKR' ? 'USD' : 'PKR';
      localStorage.setItem('taskmint_currency', next);
      return next;
    });
  };

  const convertAmount = (amount: number): number => {
    return currency === 'USD' ? amount / CONVERSION_RATE : amount;
  };

  const formatAmount = (amount: number): string => {
    const converted = convertAmount(amount);
    return currency === 'USD' 
      ? `$${converted.toFixed(2)}` 
      : `Rs ${converted.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatAmount, convertAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
