<template>
  <div v-if="users.length" class="card" style="margin-bottom:16px">
    <p style="font-size:13px;font-weight:600;color:var(--text-muted);margin-bottom:12px">Suggested for you</p>
    <div v-for="u in users" :key="u._id" style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <RouterLink :to="`/profile/${u._id}`" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
        <img :src="u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=6366f1&color=fff`"
          class="avatar" width="36" height="36" :alt="u.username" />
        <div style="min-width:0">
          <p style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ u.username }}</p>
          <p style="font-size:11px;color:var(--text-muted)">{{ u.followers.length }} followers</p>
        </div>
      </RouterLink>
      <button class="btn btn-sm" :class="following.has(u._id) ? 'btn-outline' : 'btn-primary'"
        @click="toggleFollow(u)">
        {{ following.has(u._id) ? 'Unfollow' : 'Follow' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { useToastStore } from '@/stores/toast';

const users = ref([]);
const following = ref(new Set());
const toast = useToastStore();

onMounted(async () => {
  const { data } = await api.get('/users/suggested');
  users.value = data;
});

async function toggleFollow(user) {
  try {
    const { data } = await api.post(`/users/${user._id}/follow`);
    if (data.following) following.value.add(user._id);
    else following.value.delete(user._id);
  } catch {
    toast.error('Failed to follow user');
  }
}
</script>
