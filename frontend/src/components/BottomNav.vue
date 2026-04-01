<template>
  <nav style="display:none" class="bottom-nav">
    <RouterLink to="/" class="bottom-nav-item" :class="{ active: route.path === '/' }">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    </RouterLink>
    <RouterLink to="/explore" class="bottom-nav-item" :class="{ active: route.path === '/explore' }">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
    </RouterLink>
    <RouterLink to="/messages" class="bottom-nav-item" :class="{ active: route.path.startsWith('/messages') }">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
    </RouterLink>
    <RouterLink to="/notifications" class="bottom-nav-item" :class="{ active: route.path === '/notifications' }" style="position:relative">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
      <span v-if="notifStore.unreadCount" class="badge" style="position:absolute;top:4px;right:4px;font-size:9px;padding:1px 4px">{{ notifStore.unreadCount }}</span>
    </RouterLink>
    <RouterLink :to="`/profile/${auth.user?._id}`" class="bottom-nav-item">
      <img :src="auth.user?.avatar || `https://ui-avatars.com/api/?name=${auth.user?.username}&background=6366f1&color=fff`"
        class="avatar" width="26" height="26" alt="profile" />
    </RouterLink>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const route = useRoute();
const auth = useAuthStore();
const notifStore = useNotificationStore();
</script>

<style>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 8px 0 env(safe-area-inset-bottom, 8px);
  z-index: 50;
  justify-content: space-around;
  align-items: center;
}
.bottom-nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  color: var(--text-muted);
  border-radius: 10px;
  transition: color .15s;
}
.bottom-nav-item.active { color: var(--primary); }

@media (max-width: 768px) {
  .bottom-nav { display: flex !important; }
}
</style>
