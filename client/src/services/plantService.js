import axios from "axios";

const API = "http://localhost:4000/api/plants";

export const getPlants = () => axios.get(API);

export const createPlant = (data) =>
  axios.post(API, data);

export const updatePlant = (id, data) =>
  axios.put(`${API}/${id}`, data);

export const deletePlant = (id) =>
  axios.delete(`${API}/${id}`);