import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import { getSocket } from '@/socket';

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([]);
  const unreadCount   = ref(0);

  async function fetch() {
    const { data } = await api.get('/notifications');
    notifications.value = data.notifications;
    unreadCount.value   = data.unreadCount;
  }

  async function markAllRead() {
    await api.put('/notifications/read');
    notifications.value.forEach(n => n.read = true);
    unreadCount.value = 0;
  }

  function listen() {
    getSocket()?.on('notification', (n) => {
      notifications.value.unshift(n);
      unreadCount.value++;
    });
  }

  return { notifications, unreadCount, fetch, markAllRead, listen };
});
