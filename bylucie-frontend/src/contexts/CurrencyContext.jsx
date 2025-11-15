import React, { createContext, useEffect, useState, useContext, useMemo } from 'react';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currencyCode, setCurrencyCode] = useState('KES');
  const [rates, setRates] = useState({ KES: 1, USD: 1 });

  useEffect(() => {
    async function detectCurrency() {
      try {
        const res = await fetch('https://ipapi.co/json');
        const data = await res.json();
        setCurrencyCode(data.currency || 'KES');
      } catch {
        setCurrencyCode('KES');
      }
    }

    async function fetchRates() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data.result === 'success') {
          setRates(data.rates);
        }
      } catch {
        setRates({ KES: 145, USD: 1 });
      }
    }

    detectCurrency();
    fetchRates();
  }, []);

  // Convert price from USD to selected currency
  function convertPrice(priceUSD) {
    const rate = rates[currencyCode] || 1;
    return priceUSD * rate;
  }

  // Format currency display with Intl API
  function formatPrice(amount) {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  const value = useMemo(() => ({
    currencyCode,
    convertPrice,
    formatPrice,
  }), [currencyCode, rates]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Custom hook to consume CurrencyContext
export function useCurrency() {
  return useContext(CurrencyContext);
}
