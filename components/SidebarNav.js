"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Shared sidebar navigation used by all three dashboards. On desktop it's a
// plain vertical list. On mobile (<=860px, see .app-sidebar-nav CSS) it
// becomes a horizontally-scrolling row — this component adds the affordances
// that make that scrollability obvious: edge fade gradients, tap-to-scroll
// chevrons that only appear when there's actually more to see in that
// direction, and auto-scrolling the active tab into view whenever it changes.
export default function SidebarNav({ tabs, activeTab, onSelect }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [tabs.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector(`[data-tab-id="${activeTab}"]`);
    if (activeEl && activeEl.scrollIntoView) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
    const t = setTimeout(updateArrows, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function scrollByAmount(amount) {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div className="sidebar-scroll-wrap">
      <div className={`sidebar-fade left ${showLeft ? "visible" : ""}`} />
      {showLeft && (
        <button className="sidebar-scroll-arrow left" onClick={() => scrollByAmount(-140)} aria-label="Scroll tabs left">
          <ChevronLeft size={15} />
        </button>
      )}

      <nav className="app-sidebar-nav" ref={scrollRef}>
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              data-tab-id={t.id}
              className={`app-sidebar-item ${activeTab === t.id ? "active" : ""}`}
              onClick={() => onSelect(t.id)}
            >
              {Icon && <Icon size={16} />} {t.label}
            </button>
          );
        })}
      </nav>

      {showRight && (
        <button className="sidebar-scroll-arrow right" onClick={() => scrollByAmount(140)} aria-label="Scroll tabs right">
          <ChevronRight size={15} />
        </button>
      )}
      <div className={`sidebar-fade right ${showRight ? "visible" : ""}`} />
    </div>
  );
}
