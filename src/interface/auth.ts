export interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  logout: () => void;
}
