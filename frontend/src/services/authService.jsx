import api from "./api.js";

export const login = async (data) => {
    return await api.post("/auth/login", data);
};

export const register = async (data) => {
    return await api.post("/auth/register", data);
};