import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '@/services/api';
import type { PSPDashboardResponse } from '@/services/api';

interface User {
  _id: string;
  email: string;
  role: string;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
}

interface PSP {
  _id: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  isActive: boolean;
  website?: string;
  supportEmail?: string;
  supportPhone?: string;
}

interface DashboardData {
  pspInfo: PSPDashboardResponse | null;
  lastFetched: string | null;
}

interface AuthContextType {
  user: User | null;
  psp: PSP | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isTemporaryPassword: boolean;
  isLoading: boolean;
  dashboardData: DashboardData;
  login: (user: User, psp: PSP, accessToken: string, refreshToken: string, isTemporaryPassword?: boolean) => Promise<void>;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  fetchDashboardData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [psp, setPsp] = useState<PSP | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isTemporaryPassword, setIsTemporaryPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pspInfo: null,
    lastFetched: null,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      console.log('[AuthContext] Loading auth state from localStorage...');
      try {
        const storedUser = localStorage.getItem('user');
        const storedPsp = localStorage.getItem('psp');
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedIsTemporaryPassword = localStorage.getItem('isTemporaryPassword');
        const storedDashboardData = localStorage.getItem('dashboardData');

        console.log('[AuthContext] Found in localStorage:', {
          hasUser: !!storedUser,
          hasPsp: !!storedPsp,
          hasAccessToken: !!storedAccessToken,
          hasRefreshToken: !!storedRefreshToken,
        });

        // Only require user, psp, and accessToken - refreshToken is optional
        if (storedUser && storedPsp && storedAccessToken) {
          setUser(JSON.parse(storedUser));
          setPsp(JSON.parse(storedPsp));
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken || null);
          setIsTemporaryPassword(storedIsTemporaryPassword === 'true');

          if (storedDashboardData) {
            setDashboardData(JSON.parse(storedDashboardData));
          }
          console.log('[AuthContext] Auth state restored successfully');
        } else {
          console.log('[AuthContext] No complete auth state found in localStorage');
        }
      } catch (error) {
        console.error('[AuthContext] Error loading auth state:', error);
      } finally {
        setIsLoading(false);
        console.log('[AuthContext] Loading complete, isLoading set to false');
      }
    };

    loadAuthState();
  }, []);

  const fetchDashboardData = async () => {
    if (!accessToken) {
      console.error('No access token available');
      return;
    }

    try {
      const response = await apiService.getPSPDashboard(accessToken);
      const newDashboardData = {
        pspInfo: response,
        lastFetched: new Date().toISOString(),
      };

      setDashboardData(newDashboardData);
      localStorage.setItem('dashboardData', JSON.stringify(newDashboardData));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const login = async (
    newUser: User,
    newPsp: PSP,
    newAccessToken: string,
    newRefreshToken: string,
    tempPassword: boolean = false
  ) => {
    setUser(newUser);
    setPsp(newPsp);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setIsTemporaryPassword(tempPassword);

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('psp', JSON.stringify(newPsp));
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('isTemporaryPassword', String(tempPassword));

    // Fetch dashboard data if not temporary password
    if (!tempPassword) {
      try {
        const response = await apiService.getPSPDashboard(newAccessToken);
        const newDashboardData = {
          pspInfo: response,
          lastFetched: new Date().toISOString(),
        };

        setDashboardData(newDashboardData);
        localStorage.setItem('dashboardData', JSON.stringify(newDashboardData));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    }
  };

  const logout = () => {
    setUser(null);
    setPsp(null);
    setAccessToken(null);
    setRefreshToken(null);
    setIsTemporaryPassword(false);
    setDashboardData({ pspInfo: null, lastFetched: null });

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('psp');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isTemporaryPassword');
    localStorage.removeItem('dashboardData');
  };

  const updateTokens = (newAccessToken: string, newRefreshToken: string) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
  };

  const isAuthenticated = !!user && !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        psp,
        accessToken,
        refreshToken,
        isAuthenticated,
        isTemporaryPassword,
        isLoading,
        dashboardData,
        login,
        logout,
        updateTokens,
        fetchDashboardData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
