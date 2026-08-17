import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api.js";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post("/auth/login", formData);
            localStorage.setItem("token", response.data.token);
            navigate("/dashboard");
        } catch (error) {
            console.log(error);
            if (error.response) {
                alert(error.response.data.message);
            } else {
                alert(error.message);
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div style={{ fontSize: "40px", display: "inline-block", marginBottom: "8px" }}>🌱</div>
                    <h1>FoodSave AI</h1>
                    <p>Enter your credentials to manage smart food distribution</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            className="modern-input"
                            style={{ maxWidth: "100%" }}
                            onChange={handleChange}
                            required
                            placeholder="name@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            className="modern-input"
                            style={{ maxWidth: "100%" }}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        className="btn btn-primary"
                        type="submit"
                        style={{ marginTop: "10px" }}
                    >
                        Sign In
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Create new account</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;