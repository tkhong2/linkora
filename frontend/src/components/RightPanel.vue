<template>
  <div style="display:flex;flex-direction:column;gap:12px;padding-top:16px">

    <!-- Search -->
    <div style="position:relative">
      <fa :icon="['fas', 'magnifying-glass']" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px;pointer-events:none"/>
      <input v-model="q" @input="onSearch" class="input input-rounded"
        placeholder="Search people..."
        style="width:100%;padding-left:36px" />
      <div v-if="results.length" class="card"
        style="position:absolute;top:46px;left:0;right:0;z-index:50;padding:6px;max-height:240px;overflow-y:auto;box-shadow:0 4px 16px rgba(0,0,0,.15)">
        <RouterLink v-for="u in results" :key="u._id" :to="`/profile/${u._id}`"
          @click="q = ''; results = []"
          style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;transition:background .15s"
          onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
          <img :src="u.avatar || avatar(u.username)" class="avatar" width="34" height="34" :alt="u.username" />
          <div>
            <p style="font-size:13px;font-weight:600">{{ u.username }}</p>
            <p style="font-size:11px;color:var(--text-muted)">{{ u.bio || 'No bio' }}</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Friends list (always show if has friends) -->
    <div class="card" style="padding:14px" v-if="friends.length">
      <p style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;display:flex;align-items:center;gap:6px">
        <fa :icon="['fas', 'user-group']" /> Friends ({{ friends.length }})
      </p>
      <div v-for="u in friends" :key="u._id" style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="position:relative;flex-shrink:0">
          <img :src="u.avatar || avatar(u.username)" class="avatar" width="38" height="38" :alt="u.username" />
          <span v-if="chatStore.isOnline(u._id)" class="online-dot" style="position:absolute;bottom:0;right:0"></span>
        </div>
        <div style="flex:1;min-width:0">
          <p style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ u.username }}</p>
          <p style="font-size:11px;color:var(--text-muted)">{{ chatStore.isOnline(u._id) ? '🟢 Online' : 'Offline' }}</p>
        </div>
        <RouterLink :to="`/messages/${u._id}`" class="btn btn-primary btn-xs">
          <fa :icon="['fas', 'comment-dots']" />
        </RouterLink>
      </div>
    </div>

    <!-- Suggested people -->
    <div class="card" style="padding:14px" v-if="suggested.length">
      <p style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;display:flex;align-items:center;gap:6px">
        <fa :icon="['fas', 'user-plus']" /> People you may know
      </p>
      <div v-for="u in suggested" :key="u._id" style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <RouterLink :to="`/profile/${u._id}`" style="flex-shrink:0">
          <img :src="u.avatar || avatar(u.username)" class="avatar" width="36" height="36" :alt="u.username" />
        </RouterLink>
        <div style="flex:1;min-width:0">
          <RouterLink :to="`/profile/${u._id}`">
            <p style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ u.username }}</p>
          </RouterLink>
          <p style="font-size:11px;color:var(--text-muted)">{{ u.bio || 'No bio' }}</p>
        </div>
        <button class="btn btn-primary btn-xs" @click="addFriend(u)" :disabled="sent.has(u._id)">
          {{ sent.has(u._id) ? '✓' : '+ Add' }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!friends.length && !suggested.length" class="card" style="padding:20px;text-align:center;color:var(--text-muted)">
      <p style="font-size:13px">No friends yet</p>
      <RouterLink to="/friends" class="btn btn-primary btn-sm" style="margin-top:10px">Find Friends</RouterLink>
    </div>

    <p style="font-size:11px;color:var(--text-muted);padding:0 4px">Linkora © 2025</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const chatStore = useChatStore();
const auth = useAuthStore();
const toast = useToastStore();

const friends   = ref([]);
const suggested = ref([]);
const sent      = ref(new Set());
const q         = ref('');
const results   = ref([]);

const avatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=1877f2&color=fff`;

onMounted(async () => {
  try {
    const [frRes, sugRes] = await Promise.all([
      api.get(`/users/${auth.user._id}/friends`),
      api.get('/users/suggested')
    ]);
    friends.value   = frRes.data;
    suggested.value = sugRes.data;
  } catch {}
});

let timer;
function onSearch() {
  clearTimeout(timer);
  if (!q.value.trim()) { results.value = []; return; }
  timer = setTimeout(async () => {
    const { data } = await api.get(`/users/search?q=${q.value}`);
    results.value = data;
  }, 300);
}

async function addFriend(user) {
  try {
    await api.post(`/users/${user._id}/friend-request`);
    sent.value.add(user._id);
    sent.value = new Set(sent.value); // trigger reactivity
    toast.success(`Friend request sent to ${user.username}!`);
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed');
  }
}
</script>
