import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./routes/Landing.js";
import { LoginPage } from "./routes/Login.js";
import { SignupPage } from "./routes/Signup.js";
import { GoogleCallbackPage } from "./routes/GoogleCallback.js";
import { DashboardPage } from "./routes/Dashboard.js";
import { WalletPage } from "./routes/Wallet.js";
import { WorkPage } from "./routes/Work.js";
import { useAuth } from "./contexts/AuthContext.js";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<GoogleCallbackPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work"
        element={
          <ProtectedRoute>
            <WorkPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function FullScreenSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="size-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <h1 className="font-display text-6xl font-bold">404</h1>
      <p className="mt-2 text-[var(--text-muted)]">This page doesn't exist.</p>
      <a href="/" className="btn-primary mt-6">
        Back home
      </a>
    </div>
  );
}
