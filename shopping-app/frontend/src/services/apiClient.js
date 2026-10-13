// src/services/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let csrfToken = null;

//call this on APP jsx to generate token
//call get/csrf-token to generate a token
export async function initializeCsrf() {
  const response = await apiClient.get("csrf-token");
  csrfToken = response.data.csrfToken; //response obtained from getCsrf
}

//set assign X-CSRF-Token header with csrf token value for every request
apiClient.interceptors.request.use((config) => {
  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken; //attach csrfToken to the http header
  }

  return config;
});

export default apiClient;
