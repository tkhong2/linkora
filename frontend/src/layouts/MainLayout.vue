<template>
  <div class="app-layout">
    <!-- Left Sidebar -->
    <aside class="sidebar">
      <div class="nav-logo">
        <img src="/logo.svg" width="32" height="32" alt="Linkora" style="border-radius:50%"/>
        <span>Linkora</span>
      </div>

      <RouterLink to="/" class="nav-item" :class="{ active: r.path === '/' }">
        <fa :icon="['fas', 'house']" class="nav-icon" /> Feed
      </RouterLink>

      <RouterLink to="/explore" class="nav-item" :class="{ active: r.path === '/explore' }">
        <fa :icon="['fas', 'magnifying-glass']" class="nav-icon" /> Explore
      </RouterLink>

      <RouterLink to="/friends" class="nav-item" :class="{ active: r.path === '/friends' }">
        <fa :icon="['fas', 'user-group']" class="nav-icon" /> Friends
        <span v-if="pendingCount" class="badge" style="margin-left:auto">{{ pendingCount }}</span>
      </RouterLink>

      <RouterLink to="/messages" class="nav-item" :class="{ active: r.path.startsWith('/messages') }">
        <fa :icon="['fas', 'comment-dots']" class="nav-icon" /> Messages
      </RouterLink>

      <RouterLink to="/notifications" class="nav-item" :class="{ active: r.path === '/notifications' }">
        <fa :icon="['fas', 'bell']" class="nav-icon" /> Notifications
        <span v-if="notifStore.unreadCount" class="badge" style="margin-left:auto">{{ notifStore.unreadCount }}</span>
      </RouterLink>

      <RouterLink :to="`/profile/${auth.user?._id}`" class="nav-item">
        <fa :icon="['fas', 'user']" class="nav-icon" /> Profile
      </RouterLink>

      <hr class="divider" style="margin:8px 0" />

      <button class="nav-item" @click="toggleDark" style="border:none;background:none;width:100%;text-align:left;cursor:pointer">
        <fa :icon="['fas', dark ? 'sun' : 'moon']" class="nav-icon" />
        {{ dark ? 'Light mode' : 'Dark mode' }}
      </button>

      <div style="margin-top:auto;padding:8px 0">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--surface2)">
          <img :src="auth.user?.avatar || avatar(auth.user?.username)" class="avatar" width="36" height="36" alt="me" />
          <div style="flex:1;min-width:0">
            <p style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ auth.user?.username }}</p>
          </div>
          <button @click="logout" title="Logout" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:4px;font-size:15px">
            <fa :icon="['fas', 'right-from-bracket']" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="main-area">
      <div class="content-wrap">
        <RouterView />
      </div>
    </div>

    <!-- Right sidebar -->
    <aside class="right-sidebar">
      <RightPanel />
    </aside>

    <!-- Mobile bottom nav -->
    <nav class="bottom-nav">
      <RouterLink to="/" class="bottom-nav-item" :class="{ active: r.path === '/' }">
        <fa :icon="['fas', 'house']" style="font-size:20px" />
        <span>Feed</span>
      </RouterLink>
      <RouterLink to="/explore" class="bottom-nav-item" :class="{ active: r.path === '/explore' }">
        <fa :icon="['fas', 'magnifying-glass']" style="font-size:20px" />
        <span>Explore</span>
      </RouterLink>
      <RouterLink to="/friends" class="bottom-nav-item" :class="{ active: r.path === '/friends' }">
        <fa :icon="['fas', 'user-group']" style="font-size:20px" />
        <span>Friends</span>
      </RouterLink>
      <RouterLink to="/messages" class="bottom-nav-item" :class="{ active: r.path.startsWith('/messages') }">
        <fa :icon="['fas', 'comment-dots']" style="font-size:20px" />
        <span>Messages</span>
      </RouterLink>
      <RouterLink to="/notifications" class="bottom-nav-item" :class="{ active: r.path === '/notifications' }" style="position:relative">
        <fa :icon="['fas', 'bell']" style="font-size:20px" />
        <span>Alerts</span>
        <span v-if="notifStore.unreadCount" class="badge" style="position:absolute;top:2px;right:2px;font-size:9px;padding:1px 4px">{{ notifStore.unreadCount }}</span>
      </RouterLink>
      <!-- Profile + logout on mobile -->
      <div class="bottom-nav-item" style="position:relative" @click="mobileMenu = !mobileMenu">
        <img :src="auth.user?.avatar || avatar(auth.user?.username)" class="avatar" width="26" height="26" alt="me" />
        <span>Me</span>
        <!-- Popup menu -->
        <Transition name="fade">
          <div v-if="mobileMenu" style="position:absolute;bottom:60px;right:0;background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow-md);min-width:160px;overflow:hidden;z-index:100">
            <RouterLink :to="`/profile/${auth.user?._id}`" class="mobile-menu-item" @click="mobileMenu=false">
              <fa :icon="['fas','user']"/> Profile
            </RouterLink>
            <button class="mobile-menu-item danger" @click="logout">
              <fa :icon="['fas','right-from-bracket']"/> Logout
            </button>
          </div>
        </Transition>
      </div>
    </nav>

    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { useChatStore } from '@/stores/chat';
import api from '@/services/api';
import RightPanel from '@/components/RightPanel.vue';
import ToastContainer from '@/components/ui/ToastContainer.vue';

const r = useRoute();
const router = useRouter();
const auth = useAuthStore();
const notifStore = useNotificationStore();
const chatStore = useChatStore();
const pendingCount = ref(0);
const mobileMenu = ref(false);

const avatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=1877f2&color=fff`;

const dark = ref(localStorage.getItem('theme') === 'dark');

function applyTheme(isDark) {
  if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

if (localStorage.getItem('theme') === 'dark') applyTheme(true);
else { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme', 'light'); }

function toggleDark() { dark.value = !dark.value; applyTheme(dark.value); }

onMounted(async () => {
  notifStore.fetch();
  notifStore.listen();
  chatStore.listen();
  try { const { data } = await api.get('/users/me/friend-requests'); pendingCount.value = data.length; } catch {}
});

async function logout() { await auth.logout(); router.push('/login'); }
</script>

<style>
.nav-icon { width: 18px !important; text-align: center; font-size: 16px; }
.nav-item .svg-inline--fa { width: 18px; height: 18px; }
.post-action-btn .svg-inline--fa { font-size: 15px; }
.mobile-menu-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; background: none; border: none; font-size: 14px; font-weight: 500; color: var(--text); cursor: pointer; text-decoration: none; transition: background .15s; }
.mobile-menu-item:hover { background: var(--surface2); }
.mobile-menu-item.danger { color: var(--danger); }
</style>
