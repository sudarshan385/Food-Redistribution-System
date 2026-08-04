const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
//const requestRoutes = require("./routes/requestRoutes");
//const matchingRoutes = require("./routes/matchingRoutes");
//const volunteerRoutes = require("./routes/volunteerRoutes");
const posRoutes = require("./routes/posRoutes");
const historyRoutes = require("./routes/historyRoutes");
const alertRoutes = require("./routes/alertRoutes");
//const donationRoutes = require("./routes/donationRoutes");

const app = express();

// Middleware FIRST
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

// Routes AFTER middleware
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/pos", posRoutes);
//app.use("/api/request", requestRoutes);
//app.use("/api/matching", matchingRoutes);
//app.use("/api/volunteer", volunteerRoutes);
app.use("/api/history", historyRoutes);
//app.use("/api/donation", donationRoutes);
app.use("/api/alerts", alertRoutes);


app.get("/", (req, res) => {
    res.send("AI Food Redistribution Backend Running 🚀");
});

module.exports = app;