import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

interface DashboardLayoutProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ title, actions, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <header style={{
        background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
        color: "#fff",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "2rem"
      }}>
        <div>
          <strong>Sales Dashboard</strong>
          {title && <span style={{ marginLeft: "0.75rem", fontWeight: 300 }}>{title}</span>}
        </div>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <NavLink to="/customers" style={({ isActive }) => ({ color: "#fff", fontWeight: isActive ? 700 : 400 })}>
            Customers
          </NavLink>
          <NavLink to="/products" style={({ isActive }) => ({ color: "#fff", fontWeight: isActive ? 700 : 400 })}>
            Products
          </NavLink>
          <NavLink to="/orders" style={({ isActive }) => ({ color: "#fff", fontWeight: isActive ? 700 : 400 })}>
            Orders
          </NavLink>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span>
            {user?.fullName}
            {user?.role && (
              <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem", opacity: 0.85 }}>({user.role})</span>
            )}
          </span>
          <button type="button" className="secondary-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main>
        {actions && (
          <div className="section-title">
            <div>{title && <h2>{title}</h2>}</div>
            <div>{actions}</div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
