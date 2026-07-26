import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthState } from "../types";
import { api, getToken, removeToken } from "../lib/api";

interface AuthContextType extends AuthState {
  login: (credentials: any) => Promise<User>;
  register: (details: any) => Promise<User>;
  loginWithGoogle: (details: { email: string; name: string; id: string; photoURL?: string }) => Promise<User>;
  loginWithOtp: (phoneNumber: string, otp: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true
  });

  useEffect(() => {
    async function checkAuth() {
      const storedToken = getToken();
      if (!storedToken) {
        setState({ user: null, token: null, isLoading: false });
        return;
      }

      try {
        const data = await api.me();
        setState({
          user: data.user,
          token: storedToken,
          isLoading: false
        });
      } catch (err) {
        console.error("Token verification failed, logging out:", err);
        removeToken();
        setState({ user: null, token: null, isLoading: false });
      }
    }
    checkAuth();
  }, []);

  const login = async (credentials: any) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const data = await api.login(credentials);
      setState({
        user: data.user,
        token: data.token,
        isLoading: false
      });
      return data.user;
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const register = async (details: any) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const data = await api.register(details);
      setState({
        user: data.user,
        token: data.token,
        isLoading: false
      });
      return data.user;
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const loginWithGoogle = async (details: { email: string; name: string; id: string; photoURL?: string }) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const data = await api.googleLogin(details);
      setState({
        user: data.user,
        token: data.token,
        isLoading: false
      });
      return data.user;
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const loginWithOtp = async (phoneNumber: string, otp: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const data = await api.verifyOtp(phoneNumber, otp);
      setState({
        user: data.user,
        token: data.token,
        isLoading: false
      });
      return data.user;
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const logout = () => {
    removeToken();
    setState({ user: null, token: null, isLoading: false });
  };

  const refreshProfile = async () => {
    try {
      const data = await api.me();
      setState(prev => ({ ...prev, user: data.user }));
    } catch (err) {
      console.error("Failed to refresh user credentials:", err);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const data = await api.updateProfile(updates);
      setState(prev => ({ ...prev, user: data.user }));
      return data.user;
    } catch (err) {
      console.error("Failed to update user profile parameters:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, loginWithGoogle, loginWithOtp, logout, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
