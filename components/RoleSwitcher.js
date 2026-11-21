"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const ROLES = [
  {
    key: 'customer',
    label: 'Customer',
    desc: 'Browse menu, cart & checkout',
    path: '/customer',
    iconBg: 'bg-emerald-500 text-white',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  {
    key: 'kitchen',
    label: 'Kitchen',
    desc: 'Accept, cook & dispatch orders',
    path: '/kitchen',
    iconBg: 'bg-amber-500 text-white',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    )
  },
  {
    key: 'delivery',
    label: 'DeliveryMan',
    desc: 'Assigned deliveries & status',
    path: '/delivery',
    iconBg: 'bg-sky-500 text-white',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    key: 'admin',
    label: 'Admin',
    desc: 'Full system, menu & role control',
    path: '/admin',
    iconBg: 'bg-indigo-600 text-white',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
];

export default function RoleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(null);

  // Directly derive active role from current URL path
  const activeRole = pathname.startsWith('/admin')
    ? 'admin'
    : pathname.startsWith('/kitchen')
    ? 'kitchen'
    : pathname.startsWith('/delivery')
    ? 'delivery'
    : pathname.startsWith('/customer')
    ? 'customer'
    : null;

  const handleRoleSwitch = async (roleKey) => {
    if (switchingRole) return;
    setSwitchingRole(roleKey);

    try {
      const res = await fetch('/api/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleKey })
      });

      const data = await res.json();

      if (data.success) {
        // Synchronize client storage for components reading localStorage
        if (typeof window !== 'undefined') {
          try {
            if (data.user) {
              localStorage.setItem('user', JSON.stringify({
                Email: data.user.email,
                Role: data.user.role,
                id: data.user.id,
                name: data.user.name
              }));
              localStorage.setItem('userName', data.user.name);
            }
            localStorage.setItem('role', data.role);
          } catch {}
        }

        const targetUrl = data.redirectUrl || `/${data.role}`;
        setIsOpen(false);
        // Smoothly navigate to role's dashboard
        router.push(targetUrl);
        router.refresh();

        // Fallback hard refresh if client router retains stale cached dashboard state
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
            window.location.assign(targetUrl);
          }
        }, 150);
      } else {
        alert(data.message || 'Unable to switch demo role');
        setSwitchingRole(null);
      }
    } catch (err) {
      console.error('[RoleSwitcher] Switch error:', err);
      alert('Network error switching role. Please try again.');
      setSwitchingRole(null);
    }
  };

  const currentRoleObj = ROLES.find(r => r.key === activeRole);

  return (
    <aside aria-label="Demo Role Switcher" className="fixed bottom-4 right-4 z-50 font-sans">
      {/* Collapsed State: Compact, High-Contrast Pill Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 bg-slate-900/95 hover:bg-slate-900 text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-2xl hover:shadow-slate-900/30 border border-slate-700/80 backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          title="Click to switch between demo roles"
        >
          {/* Animated Switcher Icon */}
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </span>

          <span className="text-xs font-semibold tracking-wide text-slate-100">
            Demo Role Switcher
          </span>

          {currentRoleObj ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950 shadow-xs">
              {currentRoleObj.label}
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
              Demo
            </span>
          )}
        </button>
      )}

      {/* Expanded State: Clean Popover Card */}
      {isOpen && (
        <div className="w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 text-slate-900 overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
              <div>
                <h3 className="text-xs font-bold tracking-tight text-white leading-tight">
                  Quick Role Switch (Demo)
                </h3>
                <p className="text-[10px] text-slate-300 leading-tight">
                  Switch views instantly for evaluation
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Close switcher"
              aria-label="Close Role Switcher"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Role List */}
          <div className="p-2 space-y-1.5">
            {ROLES.map((role) => {
              const isActive = activeRole === role.key;
              const isSwitchingThis = switchingRole === role.key;

              return (
                <button
                  key={role.key}
                  disabled={switchingRole !== null}
                  onClick={() => handleRoleSwitch(role.key)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-slate-50 border-slate-300 ring-2 ring-slate-900/10 shadow-xs'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  } ${switchingRole !== null ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {/* Icon Avatar */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 shadow-xs ${role.iconBg}`}>
                    {isSwitchingThis ? (
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      role.icon
                    )}
                  </div>

                  {/* Role Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {role.label}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 text-white shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate leading-tight">
                      {role.desc}
                    </p>
                  </div>

                  {/* Arrow Indicator */}
                  {!isActive && !isSwitchingThis && (
                    <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              One-click instant login
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Minimize
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
