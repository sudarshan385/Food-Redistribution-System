import React from "react";
import { NavLink } from "react-router-dom";
import { 
    FiGrid, 
    FiBox, 
    FiCpu, 
    FiRefreshCw, 
    FiAlertTriangle, 
    FiMonitor, 
    FiClock, 
    FiLogOut 
} from "react-icons/fi";

function Sidebar() {
    const menuItems = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: <FiGrid />,
        },
        {
            name: "Inventory",
            path: "/inventory",
            icon: <FiBox />,
        },
        {
            name: "AI Operations",
            path: "/ai-operations",
            icon: <FiCpu />,
        },
        {
            name: "Reorder Requests",
            path: "/reorder-requests",
            icon: <FiRefreshCw />,
        },
        {
            name: "Expiry Alerts",
            path: "/expiry-alerts",
            icon: <FiAlertTriangle />,
        },
        {
            name: "POS Integration",
            path: "/pos",
            icon: <FiMonitor />,
        },
        {
            name: "Transaction History",
            path: "/history",
            icon: <FiClock />,
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
    };

    return (
        <aside className="sidebar">
            {/* ================= BRAND ================= */}
            <div className="sidebar-brand">
                <div className="brand-icon">
                    🌱
                </div>
                <div className="brand-text">
                    <h2>FoodSave AI</h2>
                    <span>Smart Food Manager</span>
                </div>
            </div>

            {/* ================= NAVIGATION ================= */}
            <nav className="sidebar-nav">
                <div className="nav-section-title">
                    Main Menu
                </div>
                <div className="nav-menu">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="sidebar-icon">
                                {item.icon}
                            </span>
                            <span className="sidebar-label">
                                {item.name}
                            </span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* ================= LOGOUT ================= */}
            <div className="sidebar-bottom">
                <NavLink
                    to="/"
                    onClick={handleLogout}
                    className="logout-link"
                >
                    <span className="sidebar-icon">
                        <FiLogOut />
                    </span>
                    <span className="sidebar-label">
                        Logout
                    </span>
                </NavLink>
            </div>
        </aside>
    );
}

export default Sidebar;