import axios from 'axios';


const axiosInstance = axios.create({
    baseURL: 'https://code-ai-ehpa.onrender.com/',
    headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
    }
})


export default axiosInstance;   