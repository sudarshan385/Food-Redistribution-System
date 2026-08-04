import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/DashboardCard";
import api from "../services/api.js";

function Dashboard() {

    const [dashboard, setDashboard] = useState({});

    useEffect(() => {

        loadDashboard();

    }, []);

    const loadDashboard = async () => {

        try {

            const response = await api.get("/dashboard");

            setDashboard(response.data.dashboard);

        } catch (error) {

            console.log(error);

        }

    };
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {

        try {

            const response = await api.get("/alerts");

            setAlerts(response.data.alerts);

        } catch (error) {

            console.log(error);

        }

    };

    return (

        <div className="container-fluid">

            <div className="row">

                <div className="col-md-2">

                    <Sidebar />

                </div>

                <div className="col-md-10 p-4">

                    <h2>Dashboard</h2>

                    <hr />

                    <div className="row">

                        <div className="col-md-3 mb-3">
                            <DashboardCard
                                title="Total Food"
                                value={dashboard.totalFood}
                            />
                        </div>

                        <div className="col-md-3 mb-3">
                            <DashboardCard
                                title="Available Food"
                                value={dashboard.availableFood}
                            />
                        </div>

                        <div className="col-md-3 mb-3">
                            <DashboardCard
                                title="Fresh Food"
                                value={dashboard.freshFood}
                            />
                        </div>

                        <div className="col-md-3 mb-3">
                            <DashboardCard
                                title="Near Expiry"
                                value={dashboard.nearExpiryFood}
                            />
                        </div>

                    </div>

                    {/* Expiry Alerts */}

                    <div className="card border-danger mt-4">

                        <div className="card-header bg-danger text-white">
                            Expiry Alerts
                        </div>

                        <div className="card-body">

                            {alerts.length === 0 ? (

                                <p>No food items are expiring soon.</p>

                            ) : (

                                alerts.map(item => (

                                    <div
                                        key={item.food_id}
                                        className="alert alert-warning"
                                    >

                                        <strong>{item.food_name}</strong>

                                        <br />

                                        Expires on{" "}
                                        {new Date(item.expiry_date).toLocaleDateString()}

                                    </div>

                                ))

                            )}

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Dashboard;