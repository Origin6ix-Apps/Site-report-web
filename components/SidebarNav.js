"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Shared sidebar navigation used by all three dashboards. On desktop it's a
// plain vertical list (see .app-sidebar-nav CSS, unaffected by this file).
// On mobile it becomes a single toggle button showing the current section —
// tapping it drops down the full list of tabs to choose from, which is a
// clearer, more standard mobile pattern than a horizontal scroll carousel.
export default function SidebarNav({ tabs, activeTab, onSelect }) {
  const [open, setOpen] = useState(false);
  const active = tabs.find((t) => t.id === activeTab) || tabs[0];
  const ActiveIcon = active?.icon;

  function choose(id) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <>
      {/* Desktop: plain vertical list, always visible */}
      <nav className="app-sidebar-nav app-sidebar-nav-desktop">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={`app-sidebar-item ${activeTab === t.id ? "active" : ""}`} onClick={() => onSelect(t.id)}>
              {Icon && <Icon size={16} />} {t.label}
            </button>
          );
        })}
      </nav>

      {/* Mobile: toggle button + dropdown */}
      <div className="sidebar-mobile-nav">
        <button className="sidebar-mobile-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {ActiveIcon && <ActiveIcon size={16} />} {active?.label}
          </span>
          <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </button>
        {open && (
          <>
            <div className="sidebar-mobile-backdrop" onClick={() => setOpen(false)} />
            <div className="sidebar-mobile-dropdown">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} className={`sidebar-mobile-dropdown-item ${activeTab === t.id ? "active" : ""}`} onClick={() => choose(t.id)}>
                    {Icon && <Icon size={16} />} {t.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
