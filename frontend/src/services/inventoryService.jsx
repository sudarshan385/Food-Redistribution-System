import api from "./api.js";

export const getAllFood = () => api.get("/inventory");

export const addFood = (data) => api.post("/inventory", data);

export const updateFood = (id, data) =>
    api.put(`/inventory/${id}`, data);

export const deleteFood = (id) =>
    api.delete(`/inventory/${id}`);