import axios from "axios";

const instance = axios.create({
  baseURL: "https://igallery.azurewebsites.net",
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
  timeout: 30000,
});

instance.interceptors.request.use((request) => {
  const accessToken = `Bearer ${localStorage.getItem("token")}`;
  if (localStorage.getItem("token")) {
    request.headers["Authorization"] = accessToken;
  }
  return request;
}, (error) => {
  return Promise.reject(error);
});

instance.interceptors.response.use((response) => {
  return response;
}, (error) => {
  return Promise.reject(error);
});

export default instance;
