import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '@/services/api';
import type { PSPDashboardResponse, CompanyOption } from '@/services/api';

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
  companies: CompanyOption[];
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isTemporaryPassword: boolean;
  isLoading: boolean;
  dashboardData: DashboardData;
  login: (user: User, psp: PSP, accessToken: string, refreshToken: string, isTemporaryPassword?: boolean) => Promise<void>;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  switchCompany: (pspId: string) => Promise<void>;
  fetchDashboardData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [psp, setPsp] = useState<PSP | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
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

          const storedCompanies = localStorage.getItem('companies');
          if (storedCompanies) {
            try { setCompanies(JSON.parse(storedCompanies)); } catch { /* ignore */ }
          }

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

    // The login response carries the list of companies this account can access.
    const loginCompanies: CompanyOption[] = (newUser as any).companies ?? [];
    setCompanies(loginCompanies);

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('psp', JSON.stringify(newPsp));
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('isTemporaryPassword', String(tempPassword));
    localStorage.setItem('companies', JSON.stringify(loginCompanies));

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
    setCompanies([]);
    setAccessToken(null);
    setRefreshToken(null);
    setIsTemporaryPassword(false);
    setDashboardData({ pspInfo: null, lastFetched: null });

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('psp');
    localStorage.removeItem('companies');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isTemporaryPassword');
    localStorage.removeItem('dashboardData');
  };

  /**
   * Switch the active company. Gets a fresh token scoped to the target company,
   * updates the stored token + company, refreshes the companies list, then does
   * a full reload so every screen refetches data for the newly-active company.
   */
  const switchCompany = async (pspId: string) => {
    if (!accessToken) throw new Error('Not authenticated');

    const res = await apiService.switchCompany(accessToken, pspId);

    // New token scoped to the chosen company.
    localStorage.setItem('accessToken', res.accessToken);

    // Update the cached company so the header reflects the switch immediately.
    const storedPsp = localStorage.getItem('psp');
    const basePsp = storedPsp ? JSON.parse(storedPsp) : {};
    const updatedPsp = {
      ...basePsp,
      _id: res.activeCompany.pspId,
      companyName: res.activeCompany.companyName,
    };
    localStorage.setItem('psp', JSON.stringify(updatedPsp));

    // Refresh the companies list (covers a just-created company) with the new token.
    try {
      const list = await apiService.getMyCompanies(res.accessToken);
      localStorage.setItem('companies', JSON.stringify(list.companies ?? []));
    } catch {
      /* non-fatal — keep the existing list */
    }

    // Drop per-company cached dashboard data and reload into the new company.
    localStorage.removeItem('dashboardData');
    window.location.href = '/dashboard';
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
        companies,
        accessToken,
        refreshToken,
        isAuthenticated,
        isTemporaryPassword,
        isLoading,
        dashboardData,
        login,
        logout,
        updateTokens,
        switchCompany,
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
