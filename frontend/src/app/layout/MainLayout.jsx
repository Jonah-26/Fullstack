// src/app/layout/Mainlayout.js
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useStore } from "../store/StoreProvider";
import { ACTIONS } from "../store/actions";

function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === "/"}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-700 hover:bg-slate-100",
        ].join(" ")
      }
    >
      <span className="text-base">•</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

export default function Mainlayout() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function logout() {
    localStorage.removeItem("token");
    dispatch({ type: ACTIONS.AUTH_LOGOUT });
    navigate("/login");
  }

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeSidebar}
          />
          {/* drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  HR Dashboard
                </p>
                <p className="text-xs text-slate-500">Admin Panel</p>
              </div>

              <button
                type="button"
                className="rounded-lg border px-3 py-2 text-sm"
                onClick={closeSidebar}
              >
                Close
              </button>
            </div>

            <nav className="mt-4 space-y-1">
              <NavItem to="/" label="Dashboard" onClick={closeSidebar} />
              <NavItem to="/employees" label="Employees" onClick={closeSidebar} />
              <NavItem to="/employment" label="Employment" onClick={closeSidebar} />
              <NavItem to="/salary" label="Salary" onClick={closeSidebar} />
              <NavItem to="/promotion" label="Promotion" onClick={closeSidebar} />
              <NavItem to="/credential" label="Credentials" onClick={closeSidebar} />
              <NavItem to="/leave-credit" label="Leave Credits" onClick={closeSidebar} />
              <NavItem to="/leave-request" label="Leave Requests" onClick={closeSidebar} />
            </nav>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  closeSidebar();
                  logout();
                }}
                className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-95"
              >
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:min-h-screen lg:w-72 lg:flex-col lg:border-r lg:bg-white">
          <div className="p-5">
            <p className="text-lg font-semibold text-slate-900">HR Dashboard</p>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>

          <nav className="px-3 pb-4 space-y-1">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/employees" label="Employees" />
            <NavItem to="/employment" label="Employment" />
            <NavItem to="/salary" label="Salary" />
            <NavItem to="/promotion" label="Promotion" />
            <NavItem to="/credential" label="Credentials" />
            <NavItem to="/leave-credit" label="Leave Credits" />
            <NavItem to="/leave-request" label="Leave Requests" />
          </nav>

          <div className="mt-auto p-4">
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-95"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-3 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                {/* Mobile hamburger */}
                <button
                  type="button"
                  className="lg:hidden rounded-xl border px-3 py-2 text-sm"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Employee Management System
                  </p>
                  <p className="text-xs text-slate-500">
                    Secure HR Admin Dashboard
                  </p>
                </div>
              </div>

              {/* Desktop logout */}
              <button
                type="button"
                onClick={logout}
                className="hidden sm:inline-flex rounded-xl border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="p-3 sm:p-6">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
