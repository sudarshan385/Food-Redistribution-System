import { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { FiClock, FiSearch } from "react-icons/fi";

function History() {
    const [history, setHistory] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const response = await api.get("/history");
            setHistory(response.data.history || []);
        } catch (error) {
            console.error(error);
            alert("Unable to load transaction history.");
        } finally {
            setLoading(false);
        }
    };

    const rows = useMemo(() => {
        return history.filter(item => {
            if (!search) return true;
            const term = search.toLowerCase();
            return (
                (item.name || "").toLowerCase().includes(term) ||
                (item.food_name || "").toLowerCase().includes(term) ||
                (item.action || "").toLowerCase().includes(term)
            );
        });
    }, [history, search]);

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <div className="eyebrow">AUDIT & LOGS</div>
                        <h1>Transaction History</h1>
                        <p>Track all food additions, updates, and removals across the system.</p>
                    </div>
                </div>

                <section className="modern-panel">
                    <div className="panel-toolbar">
                        <div>
                            <h2>Recent Activity</h2>
                            <span>{rows.length} record{rows.length === 1 ? "" : "s"} found</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }}>
                            <FiSearch style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }} />
                            <input
                                className="modern-input"
                                placeholder="Search history..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: "36px", minWidth: "250px" }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading history...</div>
                    ) : rows.length > 0 ? (
                        <div className="table-wrap">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Transaction ID</th>
                                        <th>User</th>
                                        <th>Food Item</th>
                                        <th>Action</th>
                                        <th>Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(item => {
                                        let badgeClass = "info";
                                        if (item.action === "ADD FOOD") badgeClass = "success";
                                        if (item.action === "UPDATE FOOD") badgeClass = "warning";
                                        if (item.action === "DELETE FOOD") badgeClass = "danger";

                                        return (
                                            <tr key={item.transaction_id}>
                                                <td><code>#{item.transaction_id}</code></td>
                                                <td><strong>{item.name}</strong></td>
                                                <td>{item.food_name}</td>
                                                <td>
                                                    <span className={`status-pill ${badgeClass}`}>
                                                        {item.action}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <FiClock style={{ color: "var(--text-muted)" }} />
                                                        {new Date(item.created_at).toLocaleString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📝</div>
                            <h3>No Transaction History</h3>
                            <p>No matching transactions were found.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default History;