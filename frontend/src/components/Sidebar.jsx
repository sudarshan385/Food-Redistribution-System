import { NavLink, useNavigate } from "react-router-dom";
import {
    FaTachometerAlt,
    FaBoxOpen,
    FaPlusCircle,
    FaUpload,
    FaQrcode,
    FaStore,
    FaHistory,
    FaSignOutAlt
} from "react-icons/fa";

function Sidebar() {

    const navigate = useNavigate();

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("role");

        navigate("/");

    };

    return (

        <div
            className="bg-dark text-white vh-100 p-3"
            style={{
                width: "250px",
                position: "fixed",
                top: 0,
                left: 0,
                overflowY: "auto"
            }}
        >

            <h4 className="text-center mb-4">
                AI Food System
            </h4>

            <NavLink
                to="/dashboard"
                className="nav-link text-white mb-2"
            >
                <FaTachometerAlt className="me-2" />
                Dashboard
            </NavLink>

            <NavLink
                to="/inventory"
                className="nav-link text-white mb-2"
            >
                <FaBoxOpen className="me-2" />
                Inventory
            </NavLink>
            <NavLink
                to="/pos"
                className="nav-link text-white mb-2"
            >
                <FaStore className="me-2" />
                POS Integration
            </NavLink>

            <NavLink
                to="/history"
                className="nav-link text-white mb-2"
            >
                <FaHistory className="me-2" />
                Transaction History
            </NavLink>

            <hr />

            <button
                className="btn btn-danger w-100"
                onClick={logout}
            >
                <FaSignOutAlt className="me-2" />
                Logout
            </button>

        </div>

    );

}

export default Sidebar;