import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import { connectSocket, disconnectSocket } from '@/socket';

export const useAuthStore = defineStore('auth', () => {
  const accessToken  = ref(localStorage.getItem('accessToken') || localStorage.getItem('token'));
  const refreshToken = ref(localStorage.getItem('refreshToken'));
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  // Migrate old token key
  if (localStorage.getItem('token') && !localStorage.getItem('accessToken')) {
    localStorage.setItem('accessToken', localStorage.getItem('token'));
    localStorage.removeItem('token');
  }

  const isLoggedIn = computed(() => !!accessToken.value);

  function setAuth(data) {
    accessToken.value  = data.accessToken;
    refreshToken.value = data.refreshToken;
    user.value = data.user;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    connectSocket(data.accessToken);
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setAuth(data);
  }

  async function register(username, email, password) {
    const { data } = await api.post('/auth/register', { username, email, password });
    setAuth(data);
  }

  async function logout() {
    try { await api.post('/auth/logout'); } catch {}
    accessToken.value = refreshToken.value = null;
    user.value = null;
    localStorage.clear();
    disconnectSocket();
  }

  function updateUser(updated) {
    user.value = { ...user.value, ...updated };
    localStorage.setItem('user', JSON.stringify(user.value));
  }

  if (accessToken.value) connectSocket(accessToken.value);

  return { accessToken, user, isLoggedIn, login, register, logout, updateUser };
});
