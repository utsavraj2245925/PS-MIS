import axiosInstance from "./api";

const API = "/plants";

export const getPlants = () => axiosInstance.get(API);

export const createPlant = (data) => axiosInstance.post(API, data);

export const updatePlant = (id, data) => axiosInstance.put(`${API}/${id}`, data);

export const deletePlant = (id) => axiosInstance.delete(`${API}/${id}`);

export const permanentDeletePlant = (id) => axiosInstance.delete(`${API}/${id}/permanent`);