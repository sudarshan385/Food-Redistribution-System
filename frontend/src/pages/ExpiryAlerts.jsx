import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { FiRefreshCw, FiSearch } from "react-icons/fi";

function ExpiryAlerts() {
    const [food, setFood] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("/inventory");
            setFood(response.data?.food || response.data?.inventory || []);
        } catch (e) {
            console.error(e);
            setError("Unable to load inventory for expiry monitoring.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const getDays = (date) => {
        if (!date) return null;
        const expiry = new Date(date);
        if (Number.isNaN(expiry.getTime())) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        return Math.ceil((expiry - today) / 86400000);
    };

    const rows = useMemo(() => {
        return food
            .map((item) => ({ ...item, days: getDays(item.expiry_date) }))
            .filter((item) => {
                const name = String(item.food_name || "").toLowerCase();
                return (!search || name.includes(search.toLowerCase())) &&
                    item.days !== null && item.days <= 7;
            })
            .sort((a, b) => a.days - b.days);
    }, [food, search]);

    const expired = rows.filter((x) => x.days < 0).length;
    const urgent = rows.filter((x) => x.days >= 0 && x.days <= 2).length;
    const upcoming = rows.filter((x) => x.days > 2 && x.days <= 7).length;

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <div className="eyebrow">INVENTORY SAFETY</div>
                        <h1>Expiry Alerts</h1>
                        <p>Monitor food approaching expiry and prioritize redistribution actions.</p>
                    </div>
                    <button className="btn btn-light" onClick={load} disabled={loading}>
                        <FiRefreshCw /> Refresh
                    </button>
                </div>

                {error && <div className="modern-alert danger">{error}</div>}

                <div className="stat-grid three">
                    <div className="stat-card danger">
                        <span>Expired</span>
                        <strong>{expired}</strong>
                        <small>Requires immediate disposal/check</small>
                    </div>
                    <div className="stat-card warning">
                        <span>Urgent Expiry</span>
                        <strong>{urgent}</strong>
                        <small>Expires within 2 days</small>
                    </div>
                    <div className="stat-card success">
                        <span>Upcoming Expiry</span>
                        <strong>{upcoming}</strong>
                        <small>Expires within 7 days</small>
                    </div>
                </div>

                <section className="modern-panel">
                    <div className="panel-toolbar">
                        <div>
                            <h2>Expiry Monitor</h2>
                            <span>Showing items with 7 days or less remaining</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }}>
                            <FiSearch style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }} />
                            <input
                                className="modern-input"
                                placeholder="Search food..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: "36px" }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: "40px", textAlignment: "center" }}>Loading expiry data...</div>
                    ) : rows.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">✓</div>
                            <h3>No critical expiry alerts</h3>
                            <p>No inventory items are within the selected 7-day expiry window.</p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Food</th>
                                        <th>Category</th>
                                        <th>Stock</th>
                                        <th>Expiry Date</th>
                                        <th>Time Remaining</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((item) => {
                                        const status = item.days < 0 ? "EXPIRED" : item.days <= 2 ? "URGENT" : "UPCOMING";
                                        return (
                                            <tr key={item.food_id}>
                                                <td>
                                                    <strong>{item.food_name}</strong>
                                                    <small>ID: {item.food_id}</small>
                                                </td>
                                                <td>
                                                    <span className="status-pill info">{item.category || "General"}</span>
                                                </td>
                                                <td><strong>{item.quantity ?? item.current_stock ?? 0}</strong> units</td>
                                                <td>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "—"}</td>
                                                <td>
                                                    <strong style={{ color: status === "EXPIRED" ? "var(--danger)" : status === "URGENT" ? "var(--warning)" : "var(--success)" }}>
                                                        {item.days < 0 ? `${Math.abs(item.days)} days overdue` : `${item.days} days left`}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${status === "EXPIRED" ? "danger" : status === "URGENT" ? "warning" : "success"}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default ExpiryAlerts;
