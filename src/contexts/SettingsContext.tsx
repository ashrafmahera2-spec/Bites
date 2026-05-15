import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface Settings {
  restaurantName: string;
  logoUrl?: string;
  whatsappNumber: string;
  walletNumber: string;
  instapayHandle?: string;
  cardDetails?: string;
  deliveryFee: number;
  paymentMethods: {
    cash: boolean;
    instapay: boolean;
    card: boolean;
    wallet: boolean;
  };
  restaurantAddress: string;
  openingHours: {
    start: string;
    end: string;
    isOpen: boolean;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
  features: {
    enableCoupons: boolean;
    enablePoints: boolean;
    requireLogin: boolean;
    orderMethod: 'whatsapp' | 'platform';
    menuTheme: 'classic' | 'bottom-nav' | 'sidebar';
  };
  pointsConfig: {
    pointsPerCurrency: number;
    currencyPerPoint: number;
    minPointsToRedeem: number;
  };
  taxConfig: {
    enableTax: boolean;
    taxRate: number;
    enableServiceCharge: boolean;
    serviceChargeRate: number;
  };
  tables?: { id: string; name: string }[];
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
