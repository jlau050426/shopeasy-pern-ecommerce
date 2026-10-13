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


//TODO This is directly copy paste from Claude, too advance for current level (DEALING WITH CSRF)

let csrfRefresh = null; //one shared refresh, even if several requests fail at the same time

//if the server rejects our CSRF token (stale token), get a new one and resend the request once
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isCsrfError =
      error.response?.status === 403 &&
      error.response.data?.code === "CSRF_INVALID";

    if (isCsrfError && config && !config._csrfRetried) {
      config._csrfRetried = true; //mark it, so a request is never retried more than once

      if (!csrfRefresh) {
        csrfRefresh = initializeCsrf().finally(() => {
          csrfRefresh = null;
        });
      }
      await csrfRefresh;

      return apiClient(config); //resend: the request interceptor adds the new token
    }

    return Promise.reject(error);
  },
);

export default apiClient;
