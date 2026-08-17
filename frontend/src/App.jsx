import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";

import AddFood from "./pages/AddFood";
import EditFood from "./pages/EditFood";
import FoodDetails from "./pages/FoodDetails";

import UploadCSV from "./pages/UploadCSV";

import POS from "./pages/POS";
import ScanQR from "./pages/ScanQR";

import History from "./pages/History";

import AIOperations from "./pages/AIOperations";
import ReorderRequests from "./pages/ReorderRequests";
import ExpiryAlerts from "./pages/ExpiryAlerts";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* ================= AUTHENTICATION ================= */}

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* ================= MAIN PAGES ================= */}

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/inventory"
                    element={<Inventory />}
                />


                {/* ================= AI OPERATIONS ================= */}

                <Route
                    path="/ai-operations"
                    element={<AIOperations />}
                />

                <Route
                    path="/reorder-requests"
                    element={<ReorderRequests />}
                />

                <Route
                    path="/expiry-alerts"
                    element={<ExpiryAlerts />}
                />


                {/* ================= FOOD MANAGEMENT ================= */}

                <Route
                    path="/add-food"
                    element={<AddFood />}
                />

                <Route
                    path="/edit-food/:id"
                    element={<EditFood />}
                />

                <Route
                    path="/food/:id"
                    element={<FoodDetails />}
                />

                <Route
                    path="/upload-csv"
                    element={<UploadCSV />}
                />


                {/* ================= POS ================= */}

                <Route
                    path="/pos"
                    element={<POS />}
                />

                <Route
                    path="/scan"
                    element={<ScanQR />}
                />


                {/* ================= HISTORY ================= */}

                <Route
                    path="/history"
                    element={<History />}
                />

            </Routes>

        </BrowserRouter>

    );
}

export default App;