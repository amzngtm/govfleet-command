/**
 * Government-Grade Authentication Context
 * Implements secure session management with automatic timeout
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { UserProfile, UserRole } from "../types";
import { generateSecureToken, hashData } from "./encryption";

// Session configuration
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes for government standard
const WARNING_BEFORE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes warning
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minute lockout

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  sessionToken: string | null;
  lastActivity: number;
  loginAttempts: number;
  isLockedOut: boolean;
  lockoutExpires: number | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  updateActivity: () => void;
  checkPermission: (requiredRoles: UserRole[]) => boolean;
  extendSession: () => void;
  getSecureSession: () => {
    token: string;
    userId: string;
    timestamp: number;
  } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  users: UserProfile[];
}> = ({ children, users }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    sessionToken: null,
    lastActivity: Date.now(),
    loginAttempts: 0,
    isLockedOut: false,
    lockoutExpires: null,
  });

  // Session timeout monitoring
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - authState.lastActivity;

      // Check for lockout
      if (
        authState.isLockedOut &&
        authState.lockoutExpires &&
        now > authState.lockoutExpires
      ) {
        setAuthState((prev) => ({
          ...prev,
          isLockedOut: false,
          lockoutExpires: null,
          loginAttempts: 0,
        }));
        return;
      }

      // Auto-logout on timeout
      if (timeSinceActivity > SESSION_TIMEOUT_MS) {
        logout();
        alert("Session expired due to inactivity. Please re-authenticate.");
      }
    }, 10000); // Check every 10 seconds

    // Activity tracking
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => updateActivity();

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      clearInterval(interval);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [
    authState.isAuthenticated,
    authState.lastActivity,
    authState.isLockedOut,
    authState.lockoutExpires,
  ]);

  const updateActivity = useCallback(() => {
    if (authState.isAuthenticated) {
      setAuthState((prev) => ({ ...prev, lastActivity: Date.now() }));
    }
  }, [authState.isAuthenticated]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.message || "Login failed");
          return false;
        }

        const data = await response.json();

        // Set user from response (server should validate and return user data)
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          sessionToken: data.token || null, // May not need client-side token if using cookies
          lastActivity: Date.now(),
          loginAttempts: 0,
          isLockedOut: false,
          lockoutExpires: null,
        });

        return true;
      } catch (error) {
        console.error("Login error:", error);
        alert("Login failed. Please try again.");
        return false;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const userName = authState.user?.name || "Unknown";

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    setAuthState({
      isAuthenticated: false,
      user: null,
      sessionToken: null,
      lastActivity: Date.now(),
      loginAttempts: 0,
      isLockedOut: false,
      lockoutExpires: null,
    });

    console.log(
      `[SECURITY] User ${userName} logged out at ${new Date().toISOString()}`,
    );
  }, []);

  const extendSession = useCallback(() => {
    if (authState.isAuthenticated) {
      updateActivity();
    }
  }, [authState.isAuthenticated, updateActivity]);

  const getSecureSession = useCallback(() => {
    if (!authState.sessionToken) return null;
    return {
      token: authState.sessionToken,
      userId: authState.user?.id || "",
      timestamp: authState.lastActivity,
    };
  }, [authState.sessionToken, authState.user, authState.lastActivity]);

  const checkPermission = useCallback(
    (requiredRoles: UserRole[]): boolean => {
      if (!authState.user) return false;
      if (authState.user.role === UserRole.SUPER_ADMIN) return true;
      return requiredRoles.includes(authState.user.role);
    },
    [authState.user],
  );

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        updateActivity,
        checkPermission,
        extendSession,
        getSecureSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Higher-Order Component for protected routes
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRoles?: UserRole[],
) => {
  return function WithAuthComponent(props: P) {
    const { isAuthenticated, user, checkPermission } = useAuth();

    if (!isAuthenticated) {
      return (
        <div className="h-screen w-screen bg-gov-900 flex items-center justify-center">
          <div className="bg-gov-800 p-8 rounded-lg border border-gov-700 shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-400 mb-6">
              Please log in to access this resource.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gov-accent hover:bg-sky-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      );
    }

    if (requiredRoles && !checkPermission(requiredRoles)) {
      return (
        <div className="h-screen w-screen bg-gov-900 flex items-center justify-center">
          <div className="bg-gov-800 p-8 rounded-lg border border-gov-700 shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-400 mb-6">
              You do not have permission to access this resource.
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gov-700 hover:bg-gov-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.DISPATCHER]: 80,
  [UserRole.AUDITOR]: 60,
  [UserRole.DRIVER]: 40,
  [UserRole.MECHANIC]: 30,
  [UserRole.RIDER]: 10,
};

export const hasRole = (
  user: UserProfile | null,
  minRole: UserRole,
): boolean => {
  if (!user) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
};
