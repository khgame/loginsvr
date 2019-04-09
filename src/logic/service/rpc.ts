import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "",
    // headers: { 'X-Requested-With': 'XMLHttpRequest' },
    // withCredentials: true,
    responseType: "json", // default
    timeout: 30000,
});

axiosInstance.interceptors.request.use((config) => {
    // console.log('$http', config)
    return config;
}, (error) => {
    return Promise.reject(error);
});

// $http.interceptors.response.use((response) => {
//     return Promise.resolve(response.data);
//   }, (error) => {
//     return Promise.reject(error.response);
//   });

export const http = axiosInstance;
