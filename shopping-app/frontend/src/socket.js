import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = import.meta.env.VITE_API_URL; //connect to backend PORT

export const socket = io(URL)