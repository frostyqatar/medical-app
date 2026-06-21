import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/medications', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Activity className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">Care Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded-xl border p-6 shadow-sm">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2.5 text-sm min-h-[44px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter username"
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border bg-background pl-3 pr-11 py-2.5 text-sm min-h-[44px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary text-primary-foreground font-medium text-sm py-2.5 min-h-[44px] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
