import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getReorderRecommendations, createReorder } from "../services/aiService.jsx";
import { FiRefreshCw, FiSearch } from "react-icons/fi";

function ReorderRequests() {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(null);
    const [message, setMessage] = useState("");

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getReorderRecommendations();
            const data = response?.data || response?.recommendations || response?.items || response;
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setError("Unable to load reorder recommendations from the AI service.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const rows = useMemo(() => items.filter((item) => {
        const name = String(item.food_name ?? item.name ?? "").toLowerCase();
        return !search || name.includes(search.toLowerCase());
    }), [items, search]);

    const value = (item, keys, fallback = "—") => {
        for (const key of keys) {
            if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
        }
        return fallback;
    };

    const handleCreate = async (item) => {
        const name = value(item, ["food_name", "name"], "");
        const quantity = Number(value(item, ["recommended_purchase", "recommended_quantity", "purchase_quantity"], 0));
        if (!name || !Number.isFinite(quantity) || quantity <= 0) return;

        setCreating(name);
        setMessage("");
        try {
            await createReorder(name, quantity);
            setMessage(`Approved reorder request for ${name}.`);
            // Optional: remove from list upon approval
            setItems(prev => prev.filter(i => value(i, ["food_name", "name"]) !== name));
        } catch (e) {
            console.error(e);
            setError("Unable to process the reorder request.");
        } finally {
            setCreating(null);
        }
    };

    const handleReject = (item) => {
        const name = value(item, ["food_name", "name"], "");
        setMessage(`Rejected reorder recommendation for ${name}.`);
        setItems(prev => prev.filter(i => value(i, ["food_name", "name"]) !== name));
    };

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <div className="eyebrow">INVENTORY SAFETY</div>
                        <h1>Reorder Requests</h1>
                        <p>Review AI-generated purchase recommendations before placing a request.</p>
                    </div>
                    <button className="btn btn-light" onClick={load} disabled={loading}>
                        <FiRefreshCw /> Refresh
                    </button>
                </div>

                {message && <div className="modern-alert success">{message}</div>}
                {error && <div className="modern-alert danger">{error}</div>}

                <section className="modern-panel">
                    <div className="panel-toolbar">
                        <div>
                            <h2>Recommended Purchases</h2>
                            <span>{rows.length} recommendation{rows.length === 1 ? "" : "s"} available</span>
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
                        <div style={{ padding: "40px", textAlignment: "center" }}>Loading recommendations...</div>
                    ) : rows.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">✓</div>
                            <h3>No reorder recommendations</h3>
                            <p>There are currently no records to display.</p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Food</th>
                                        <th>Current Stock</th>
                                        <th>7-Day Forecast</th>
                                        <th>Safety Stock</th>
                                        <th>Recommended Purchase</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((item, index) => {
                                        const name = value(item, ["food_name", "name"], `Item ${index + 1}`);
                                        const purchase = Number(value(item, ["recommended_purchase", "recommended_quantity", "purchase_quantity"], 0));
                                        const status = String(value(item, ["reorder_status", "status"], purchase > 0 ? "REORDER" : "SUFFICIENT")).toUpperCase();
                                        return (
                                            <tr key={`${name}-${item.food_id ?? index}`}>
                                                <td>
                                                    <strong>{name}</strong>
                                                    <small>{item.category || "General"}</small>
                                                </td>
                                                <td>{value(item, ["current_stock", "quantity"])} units</td>
                                                <td>{Number(value(item, ["forecasted_7_day_demand", "forecasted_demand"], 0)).toFixed(1)} units</td>
                                                <td>{Number(value(item, ["safety_stock"], 0)).toFixed(1)} units</td>
                                                <td><strong className="purchase-value">{purchase.toFixed(0)} units</strong></td>
                                                <td>
                                                    <span className={`status-pill ${status === "REORDER" ? "warning" : "success"}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {status === "REORDER" && purchase > 0 ? (
                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                onClick={() => handleCreate(item)}
                                                                disabled={creating === name}
                                                            >
                                                                {creating === name ? "Approving..." : "Approve"}
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-light"
                                                                onClick={() => handleReject(item)}
                                                                disabled={creating === name}
                                                                style={{ color: "var(--danger)" }}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="status-pill success">Sufficient</span>
                                                    )}
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

export default ReorderRequests;
