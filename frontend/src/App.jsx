import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddFood from "./pages/AddFood";
//import FoodList from "./pages/FoodList";
import UploadCSV from "./pages/UploadCSV";
import Inventory from "./pages/Inventory";
import EditFood from "./pages/EditFood";
import FoodDetails from "./pages/FoodDetails";
import POS from "./pages/POS";
import ScanQR from "./pages/ScanQR";
import History from "./pages/History";
//import RequestFood from "./pages/RequestFood";
//import MyRequests from "./pages/MyRequests";
//import ManageRequests from "./pages/ManageRequests";
//import DonationLogs from "./pages/DonationLogs";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route path="/" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/inventory" element={<Inventory />} />

                <Route path="/add-food" element={<AddFood />} />


                <Route path="/upload-csv" element={<UploadCSV />} />

                <Route path="/edit-food/:id" element={<EditFood />} />

                <Route path="/pos" element={<POS />} />

                <Route path="/food/:id" element={<FoodDetails />} />

                <Route path="/scan" element={<ScanQR />} />

                <Route path="/history" element={<History />} />








            </Routes>

        </BrowserRouter>

    );

}

export default App;