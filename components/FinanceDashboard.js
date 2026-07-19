"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ClipboardList, FileText, Wallet, BarChart3, Plus, X, Trash2, Package } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import { PaymentsTab } from "@/components/AdminDashboard";

const TABS = [
  { id: "workorders", label: "Work Orders", icon: ClipboardList },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "storeaccounts", label: "Store Accounts", icon: Package },
  { id: "reports", label: "Reports & Profit", icon: BarChart3 },
];

export default function FinanceDashboard({ user, profile, onLogout }) {
  const [tab, setTab] = useState("workorders");
  const [projects, setProjects] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    if (!hasLoadedOnce.current) setLoading(true);
    const [{ data: p }, { data: wo }, { data: vd }, { data: inv }, { data: pm }, { data: si }, { data: m }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("work_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("vendors").select("*"),
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("payment_date", { ascending: false }),
      supabase.from("stock_items").select("*").order("name", { ascending: true }),
      supabase.from("materials").select("*"),
    ]);
    setProjects(p || []);
    setWorkOrders(wo || []);
    setVendors(vd || []);
    setInvoices(inv || []);
    setPayments(pm || []);
    setStockItems(si || []);
    setMaterials(m || []);
    hasLoadedOnce.current = true;
    setLoading(false);
  }

  const totalRevenue = payments.reduce((s, pm) => s + Number(pm.amount || 0), 0);
  const totalWorkOrderCost = workOrders.reduce((s, wo) => s + Number(wo.cost || 0), 0);
  const totalMaterialCost = materials.reduce((s, m) => {
    const stock = stockItems.find((si) => si.name === m.name);
    return s + (Number(m.used) || 0) * Number(stock?.unit_price || 0);
  }, 0);
  const profit = totalRevenue - totalWorkOrderCost - totalMaterialCost;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <img src="/logo.png" alt="MES Portal" className="brand-mark small" />
          <span className="brand-name small">MES PORTAL</span>
        </div>
        <SidebarNav tabs={TABS} activeTab={tab} onSelect={setTab} />
      </aside>

      <div className="app-main">
        <header className="app-main-topbar">
          <span className="role-badge admin" style={{ marginRight: 10 }}>Finance</span>
          <span className="user-chip" style={{ marginRight: 12 }}>{user.email}</span>
          <button className="icon-btn" title="Log out" onClick={onLogout}>Log out</button>
        </header>

        <div className="app-main-content">
          <div className="dash-header">
            <h1 className="h1" style={{ marginBottom: 0 }}>Finance Dashboard</h1>
          </div>
          <p className="dash-sub">Work Orders → Invoices → Payments Received → Reports & Profit.</p>

          <div className="stat-grid">
            <div className="stat-card"><div className="stat-num">₹{totalRevenue.toLocaleString()}</div><div className="stat-label">Total Revenue</div></div>
            <div className="stat-card"><div className="stat-num">₹{totalWorkOrderCost.toLocaleString()}</div><div className="stat-label">Work Order Costs</div></div>
            <div className="stat-card"><div className="stat-num">₹{totalMaterialCost.toLocaleString()}</div><div className="stat-label">Material Costs</div></div>
            <div className="stat-card"><div className="stat-num" style={{ color: profit >= 0 ? "#15803D" : "#B91C1C" }}>₹{profit.toLocaleString()}</div><div className="stat-label">Profit</div></div>
          </div>

          {loading ? (
            <p className="dash-sub">Loading…</p>
          ) : (
            <>
              {tab === "workorders" && <FinanceWorkOrdersTab projects={projects} vendors={vendors} workOrders={workOrders} />}
              {tab === "invoices" && <InvoicesTab projects={projects} workOrders={workOrders} invoices={invoices} user={user} onChange={loadAll} />}
              {tab === "payments" && <PaymentsTab projects={projects} payments={payments} user={user} onChange={loadAll} />}
              {tab === "storeaccounts" && <StoreAccountsTab stockItems={stockItems} materials={materials} user={user} onChange={loadAll} />}
              {tab === "reports" && <ReportsProfitTab projects={projects} payments={payments} workOrders={workOrders} invoices={invoices} stockItems={stockItems} materials={materials} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FinanceWorkOrdersTab({ projects, vendors, workOrders }) {
  const STATUS_LABEL = { open: "Open", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled" };
  return (
    <div>
      <div className="dash-sub" style={{ marginBottom: 12 }}>Every Work Order set up by Admin — this is what you'll be invoicing clients for.</div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Project</th><th>Title</th><th>Vendor</th><th>Cost</th><th>Status</th><th>Due</th></tr></thead>
          <tbody>
            {workOrders.length === 0 && <tr><td colSpan={6} className="muted" style={{ padding: 20 }}>No work orders yet.</td></tr>}
            {workOrders.map((wo) => {
              const proj = projects.find((p) => p.id === wo.project_id);
              const vendor = vendors.find((v) => v.id === wo.vendor_id);
              return (
                <tr key={wo.id}>
                  <td>{proj?.name || "—"}</td>
                  <td><strong>{wo.title}</strong></td>
                  <td>{vendor?.name || <span className="muted">Internal</span>}</td>
                  <td>₹{Number(wo.cost || 0).toLocaleString()}</td>
                  <td><span className={`status-pill ${wo.status === "completed" ? "active" : wo.status === "cancelled" ? "absent" : "pending"}`}>{STATUS_LABEL[wo.status] || wo.status}</span></td>
                  <td>{wo.due_date || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvoicesTab({ projects, workOrders, invoices, user, onChange }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ project_id: projects[0]?.id || "", work_order_id: "", invoice_number: "", amount: "", status: "draft", issued_date: new Date().toISOString().slice(0, 10), due_date: "", notes: "" });
  const [error, setError] = useState("");

  const STATUS_LABEL = { draft: "Draft", sent: "Sent", paid: "Paid", overdue: "Overdue" };
  const STATUS_CLASS = { draft: "pending", sent: "pending", paid: "active", overdue: "absent" };

  async function save() {
    if (!form.invoice_number.trim() || !form.project_id || !form.amount) return;
    setError("");
    const payload = { ...form, work_order_id: form.work_order_id || null, amount: Math.max(0, Number(form.amount) || 0), due_date: form.due_date || null };
    const { error: insertError } = await supabase.from("invoices").insert({ ...payload, created_by: user.id });
    if (insertError) { setError(insertError.message); return; }
    setForm({ project_id: projects[0]?.id || "", work_order_id: "", invoice_number: "", amount: "", status: "draft", issued_date: new Date().toISOString().slice(0, 10), due_date: "", notes: "" });
    setShowNew(false);
    onChange();
  }

  async function quickSetStatus(id, status) {
    await supabase.from("invoices").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    onChange();
  }

  async function removeInvoice(id, number) {
    if (!confirm(`Delete invoice "${number}"? This can't be undone.`)) return;
    await supabase.from("invoices").delete().eq("id", id);
    onChange();
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="dash-sub" style={{ marginBottom: 0 }}>Generate an invoice against a project — optionally tied to a specific Work Order.</span>
        {projects.length > 0 && <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={16} /> New invoice</button>}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Invoice #</th><th>Project</th><th>Amount</th><th>Status</th><th>Issued</th><th>Due</th><th></th></tr></thead>
          <tbody>
            {invoices.length === 0 && <tr><td colSpan={7} className="muted" style={{ padding: 20 }}>No invoices generated yet.</td></tr>}
            {invoices.map((inv) => {
              const proj = projects.find((p) => p.id === inv.project_id);
              return (
                <tr key={inv.id}>
                  <td><strong>{inv.invoice_number}</strong></td>
                  <td>{proj?.name || "—"}</td>
                  <td>₹{Number(inv.amount).toLocaleString()}</td>
                  <td>
                    <select className="select-input" value={inv.status} onChange={(e) => quickSetStatus(inv.id, e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>
                  <td>{inv.issued_date}</td>
                  <td>{inv.due_date || "—"}</td>
                  <td><button className="icon-btn-sm" onClick={() => removeInvoice(inv.id, inv.invoice_number)}><Trash2 size={13} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2 className="h2" style={{ color: "var(--ink)" }}>New invoice</h2>
              <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <label className="field-label">Project</label>
            <select className="select-input" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value, work_order_id: "" })}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="field-label">Work Order (optional)</label>
            <select className="select-input" value={form.work_order_id} onChange={(e) => setForm({ ...form, work_order_id: e.target.value })}>
              <option value="">— Not tied to a specific work order —</option>
              {workOrders.filter((wo) => wo.project_id === form.project_id).map((wo) => <option key={wo.id} value={wo.id}>{wo.title}</option>)}
            </select>
            <label className="field-label">Invoice number</label>
            <input className="input" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} placeholder="e.g. INV-2026-001" autoFocus />
            <label className="field-label">Amount</label>
            <input type="number" min="0" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Issued date</label>
                <input type="date" className="input" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Due date</label>
                <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <label className="field-label">Notes</label>
            <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" disabled={!form.invoice_number.trim() || !form.amount} onClick={save}>Create invoice</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StoreAccountsTab({ stockItems, materials, user, onChange }) {
  function usedFor(name) {
    return materials.filter((m) => m.name === name).reduce((sum, m) => sum + (Number(m.used) || 0), 0);
  }

  async function updateUnitPrice(id, unitPrice) {
    await supabase.from("stock_items").update({ unit_price: Math.max(0, unitPrice), updated_at: new Date().toISOString() }).eq("id", id);
    onChange();
  }

  const totalStockValue = stockItems.reduce((sum, s) => sum + Number(s.quantity || 0) * Number(s.unit_price || 0), 0);
  const totalUsedValue = stockItems.reduce((sum, s) => sum + usedFor(s.name) * Number(s.unit_price || 0), 0);
  const totalRemainingValue = totalStockValue - totalUsedValue;

  return (
    <div>
      <div className="dash-sub" style={{ marginBottom: 12 }}>
        Admin and Supervisor only see stock in units — this shows what that stock is actually worth in money. Unit price can be set here or from Admin's Stores tab; either way it's the same number everywhere.
      </div>

      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card"><div className="stat-num">₹{totalStockValue.toLocaleString()}</div><div className="stat-label">Total Stock Value</div></div>
        <div className="stat-card"><div className="stat-num">₹{totalUsedValue.toLocaleString()}</div><div className="stat-label">Used Value</div></div>
        <div className="stat-card"><div className="stat-num">₹{totalRemainingValue.toLocaleString()}</div><div className="stat-label">Remaining Value</div></div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr><th>Material</th><th>Units in Stock</th><th>Unit Price</th><th>Total Stock Value</th><th>Used (units)</th><th>Used Value</th><th>Remaining (units)</th><th>Remaining Value</th></tr>
          </thead>
          <tbody>
            {stockItems.length === 0 && <tr><td colSpan={8} className="muted" style={{ padding: 20 }}>No stock items set up yet — add them from Admin's Stores tab, or set pricing here once they exist.</td></tr>}
            {stockItems.map((s) => {
              const used = usedFor(s.name);
              const remaining = s.quantity - used;
              const unitPrice = Number(s.unit_price || 0);
              return (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.quantity} {s.unit || ""}</td>
                  <td>
                    ₹<input
                      type="number" min="0" defaultValue={unitPrice}
                      onBlur={(e) => { const v = Number(e.target.value); if (v !== unitPrice) updateUnitPrice(s.id, v); }}
                      style={{ width: 80, border: "1px solid var(--line)", borderRadius: 3, padding: "3px 6px", fontSize: 12 }}
                    />
                  </td>
                  <td>₹{(s.quantity * unitPrice).toLocaleString()}</td>
                  <td>{used} {s.unit || ""}</td>
                  <td>₹{(used * unitPrice).toLocaleString()}</td>
                  <td>{remaining} {s.unit || ""}</td>
                  <td style={{ color: remaining <= 0 ? "#B91C1C" : "#15803D", fontWeight: 700 }}>₹{(remaining * unitPrice).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsProfitTab({ projects, payments, workOrders, invoices, stockItems, materials }) {
  function materialCostFor(list) {
    return list.reduce((sum, m) => {
      const stock = stockItems.find((s) => s.name === m.name);
      return sum + (Number(m.used) || 0) * Number(stock?.unit_price || 0);
    }, 0);
  }

  const totalRevenue = payments.reduce((s, pm) => s + Number(pm.amount || 0), 0);
  const totalWorkOrderCost = workOrders.reduce((s, wo) => s + Number(wo.cost || 0), 0);
  const totalMaterialCost = materialCostFor(materials);
  const totalCost = totalWorkOrderCost + totalMaterialCost;
  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;
  const outstandingInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + Number(i.amount || 0), 0);

  const perProject = projects.map((p) => {
    const revenue = payments.filter((pm) => pm.project_id === p.id).reduce((s, pm) => s + Number(pm.amount || 0), 0);
    const workOrderCost = workOrders.filter((wo) => wo.project_id === p.id).reduce((s, wo) => s + Number(wo.cost || 0), 0);
    const materialCost = materialCostFor(materials.filter((m) => m.project_id === p.id));
    const cost = workOrderCost + materialCost;
    return { name: p.name, revenue, cost, profit: revenue - cost };
  }).filter((p) => p.revenue > 0 || p.cost > 0);

  const uncostedMaterials = [...new Set(materials.map((m) => m.name))].filter((name) => {
    const stock = stockItems.find((s) => s.name === name);
    return !stock || Number(stock.unit_price || 0) === 0;
  });

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-num">₹{totalRevenue.toLocaleString()}</div><div className="stat-label">Total Revenue</div></div>
        <div className="stat-card"><div className="stat-num">₹{totalWorkOrderCost.toLocaleString()}</div><div className="stat-label">Work Order Costs</div></div>
        <div className="stat-card"><div className="stat-num">₹{totalMaterialCost.toLocaleString()}</div><div className="stat-label">Material Costs</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: profit >= 0 ? "#15803D" : "#B91C1C" }}>₹{profit.toLocaleString()}</div><div className="stat-label">Profit</div></div>
        <div className="stat-card"><div className="stat-num">{margin}%</div><div className="stat-label">Profit Margin</div></div>
        <div className="stat-card"><div className="stat-num">₹{outstandingInvoices.toLocaleString()}</div><div className="stat-label">Outstanding Invoices</div></div>
      </div>

      {uncostedMaterials.length > 0 && (
        <div className="dash-sub" style={{ marginBottom: 16 }}>
          {uncostedMaterials.length} material{uncostedMaterials.length === 1 ? "" : "s"} used on projects {uncostedMaterials.length === 1 ? "has" : "have"} no unit price set yet ({uncostedMaterials.join(", ")}) — its cost isn't counted above until you set a price in Store Accounts.
        </div>
      )}

      <h3 className="h2" style={{ fontSize: 14, marginBottom: 8 }}>Revenue vs. cost by project</h3>
      <table className="data-table">
        <thead><tr><th>Project</th><th>Revenue</th><th>Cost</th><th>Profit</th></tr></thead>
        <tbody>
          {perProject.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 20 }}>No revenue or costs recorded yet.</td></tr>}
          {perProject.map((p) => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td>₹{p.revenue.toLocaleString()}</td>
              <td>₹{p.cost.toLocaleString()}</td>
              <td style={{ color: p.profit >= 0 ? "#15803D" : "#B91C1C", fontWeight: 700 }}>₹{p.profit.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
