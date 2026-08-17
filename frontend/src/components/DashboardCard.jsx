import React from "react";

function DashboardCard({ title, value, variant }) {
    return (
        <div className={`stat-card ${variant || ""}`}>
            <span>{title}</span>
            <strong>{value ?? 0}</strong>
            <small>Redistribution metrics</small>
        </div>
    );
}

export default DashboardCard;