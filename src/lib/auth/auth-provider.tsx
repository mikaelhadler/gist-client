import { createContext, useContext, useEffect, useState } from 'react';
import { Octokit } from '@octokit/rest';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  token: string | null;
  octokit: Octokit | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
  octokit: null,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [octokit, setOctokit] = useState<Octokit | null>(null);

  // Check for token in localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('github_token');
    if (storedToken) {
      login(storedToken)
        .catch((error) => {
          console.error('Auto-login failed:', error);
          localStorage.removeItem('github_token');
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (newToken: string) => {
    try {
      setIsLoading(true);
      const newOctokit = new Octokit({ auth: newToken });

      // Verify the token by fetching the user info
      const { data: userData } = await newOctokit.users.getAuthenticated();

      // Store token and user data
      localStorage.setItem('github_token', newToken);
      setToken(newToken);
      setUser(userData);
      setOctokit(newOctokit);
      setIsAuthenticated(true);
      toast.success(`Welcome, ${userData.login}!`);
    } catch (error) {
      toast.error('Authentication failed. Please check your token and try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('github_token');
    setToken(null);
    setUser(null);
    setOctokit(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        token,
        octokit,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}