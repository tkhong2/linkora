import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([]);
  function show(message, type = 'info', duration = 3000) {
    const id = Date.now() + Math.random();
    toasts.value.push({ id, message, type });
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id); }, duration);
  }
  return {
    toasts,
    success: msg => show(msg, 'success'),
    error:   msg => show(msg, 'error'),
    info:    msg => show(msg, 'info'),
  };
});
