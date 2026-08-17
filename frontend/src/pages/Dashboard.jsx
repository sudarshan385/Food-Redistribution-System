import { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";
import api from "../services/api.js";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { FiTrendingUp, FiPieChart, FiActivity } from "react-icons/fi";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

// Simulated trend data for high-level appearance
const trendData = [
  { name: 'Mon', redistributed: 40, rescued: 24, loss: 10 },
  { name: 'Tue', redistributed: 30, rescued: 13, loss: 5 },
  { name: 'Wed', redistributed: 55, rescued: 38, loss: 12 },
  { name: 'Thu', redistributed: 45, rescued: 29, loss: 8 },
  { name: 'Fri', redistributed: 60, rescued: 48, loss: 15 },
  { name: 'Sat', redistributed: 80, rescued: 65, loss: 20 },
  { name: 'Sun', redistributed: 75, rescued: 58, loss: 18 },
];

function Dashboard() {
    const [dashboard, setDashboard] = useState({});
    const [inventory, setInventory] = useState([]);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [dashRes, invRes] = await Promise.all([
                api.get("/dashboard"),
                api.get("/inventory")
            ]);
            
            const dashData = dashRes.data.dashboard || {};
            const items = invRes.data.food || invRes.data.inventory || [];
            
            setInventory(items);
            
            let near = 0;
            let fresh = 0;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            items.forEach(item => {
                if (item.expiry_date) {
                    const expiry = new Date(item.expiry_date);
                    const days = Math.ceil((expiry - today) / 86400000);
                    if (days <= 7) near++;
                    else fresh++;
                }
            });

            setDashboard({
                ...dashData,
                freshFood: dashData.freshFood || fresh,
                nearExpiryFood: dashData.nearExpiryFood || near
            });
        } catch (error) {
            console.error(error);
        }
    };

    const categoryData = useMemo(() => {
        const counts = {};
        inventory.forEach(item => {
            const cat = item.category || "Uncategorized";
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }, [inventory]);

    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <div className="eyebrow">SYSTEM OVERVIEW</div>
                        <h1>Analytics Dashboard</h1>
                        <p>Advanced metrics and redistribution insights.</p>
                    </div>
                </div>

                <div className="stat-grid">
                    <DashboardCard
                        title="Total Inventory"
                        value={dashboard.totalFood || 0}
                    />
                    <DashboardCard
                        title="Available For Request"
                        value={dashboard.availableFood || 0}
                        variant="success"
                    />
                    <DashboardCard
                        title="Fresh Stock"
                        value={dashboard.freshFood || 0}
                        variant="success"
                    />
                    <DashboardCard
                        title="Critical Expiry"
                        value={dashboard.nearExpiryFood || 0}
                        variant="danger"
                    />
                </div>

                <div className="analytics-grid">
                    {/* Line Chart Panel */}
                    <div className="chart-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <FiTrendingUp style={{ color: 'var(--primary)' }} size={20} />
                            <h3 style={{ margin: 0 }}>Redistribution Trends</h3>
                        </div>
                        <p>Simulated 7-day performance tracking for rescued and redistributed items.</p>
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line type="monotone" dataKey="redistributed" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="rescued" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                                    <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart Panel */}
                    <div className="chart-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <FiPieChart style={{ color: '#8b5cf6' }} size={20} />
                            <h3 style={{ margin: 0 }}>Inventory Breakdown</h3>
                        </div>
                        <p>Real-time composition of current food stock categories.</p>
                        <div style={{ width: '100%', height: '300px', position: 'relative' }}>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                                        />
                                        <Legend iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                    No category data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Recent Activity Table Preview */}
                <section className="modern-panel">
                    <div className="panel-toolbar">
                        <div>
                            <h2>Recent Inventory Updates</h2>
                            <span>Top 5 recently added or updated items</span>
                        </div>
                        <div style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                            View Full Inventory &rarr;
                        </div>
                    </div>
                    <div className="table-wrap">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Food Item</th>
                                    <th>Category</th>
                                    <th>Quantity</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.slice(0, 5).map(item => (
                                    <tr key={item.food_id}>
                                        <td>
                                            <strong>{item.food_name}</strong>
                                            <small>{new Date(item.expiry_date).toLocaleDateString()}</small>
                                        </td>
                                        <td><span className="status-pill info">{item.category}</span></td>
                                        <td><strong>{item.quantity}</strong> units</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FiActivity color="var(--success)" /> 
                                                <span>Active</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {inventory.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                            No inventory items found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
                
            </main>
        </div>
    );
}

export default Dashboard;