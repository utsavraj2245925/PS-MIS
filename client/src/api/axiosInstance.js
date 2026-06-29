import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URI, 
    withCredentials: true,
  });

  console.log(import.meta.env.VITE_API_URI);

axiosInstance.interceptors.response.use((response) => response,
  (error) => { const status = error.response?.status;
    const requestUrl = error.config?.url;

   if (status === 401 && !requestUrl?.includes("/auth/me") && window.location.pathname !== "/login") {
      window.location.href = "/login"}
    return Promise.reject(error);
  }
);

export default axiosInstance;