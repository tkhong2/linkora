<template>
  <div>
    <h2 style="font-size:20px;font-weight:800;margin-bottom:16px">Friends</h2>

    <!-- Pending requests -->
    <div v-if="requests.length" class="card" style="padding:16px;margin-bottom:16px">
      <p style="font-size:15px;font-weight:700;margin-bottom:12px">Friend Requests ({{ requests.length }})</p>
      <div v-for="r in requests" :key="r._id" style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <RouterLink :to="`/profile/${r.requester._id}`">
          <img :src="r.requester.avatar||avatar(r.requester.username)" class="avatar" width="50" height="50" :alt="r.requester.username"/>
        </RouterLink>
        <div style="flex:1">
          <RouterLink :to="`/profile/${r.requester._id}`" style="font-weight:700;font-size:14px">{{ r.requester.username }}</RouterLink>
          <p style="font-size:12px;color:var(--text-muted)">{{ r.requester.bio||'No bio' }}</p>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-primary btn-sm" @click="respond(r, 'accept')">
            <fa :icon="['fas', 'check']" /> Accept
          </button>
          <button class="btn btn-secondary btn-sm" @click="respond(r, 'reject')">
            <fa :icon="['fas', 'xmark']" /> Decline
          </button>
        </div>
      </div>    </div>

    <!-- Current friends -->
    <div v-if="myFriends.length" class="card" style="padding:16px;margin-bottom:16px">
      <p style="font-size:15px;font-weight:700;margin-bottom:12px">Your Friends ({{ myFriends.length }})</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
        <div v-for="u in myFriends" :key="u._id" class="card" style="padding:12px;display:flex;align-items:center;gap:10px;box-shadow:none;border:1px solid var(--border)">
          <RouterLink :to="`/profile/${u._id}`">
            <img :src="u.avatar||avatar(u.username)" class="avatar" width="44" height="44" :alt="u.username"/>
          </RouterLink>
          <div style="flex:1;min-width:0">
            <RouterLink :to="`/profile/${u._id}`" style="font-weight:600;font-size:13px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ u.username }}</RouterLink>
            <p style="font-size:11px;color:var(--text-muted)">{{ u.bio||'No bio' }}</p>
          </div>
          <RouterLink :to="`/messages/${u._id}`" class="btn btn-primary btn-xs" title="Message">
            <fa :icon="['fas', 'comment-dots']" />
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Suggested -->
    <div class="card" style="padding:16px">
      <p style="font-size:15px;font-weight:700;margin-bottom:12px">People You May Know</p>
      <div v-if="suggested.length===0" style="color:var(--text-muted);font-size:14px">No suggestions</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">
        <div v-for="u in suggested" :key="u._id" class="card" style="padding:16px;text-align:center;box-shadow:none;border:1px solid var(--border)">
          <RouterLink :to="`/profile/${u._id}`">
            <img :src="u.avatar||avatar(u.username)" class="avatar" width="64" height="64" style="margin:0 auto 8px" :alt="u.username"/>
            <p style="font-weight:700;font-size:14px;margin-bottom:4px">{{ u.username }}</p>
            <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px">{{ u.bio||'No bio' }}</p>
          </RouterLink>
          <button class="btn btn-primary btn-sm" style="width:100%" @click="addFriend(u)">
            <fa :icon="['fas', 'user-plus']" /> Add Friend
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { useToastStore } from '@/stores/toast';
import { useAuthStore } from '@/stores/auth';

const toast = useToastStore();
const requests  = ref([]);
const suggested = ref([]);
const myFriends = ref([]);
const avatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'U')}&background=1877f2&color=fff`;

onMounted(async () => {
  const auth = useAuthStore();
  const [rRes, sRes, fRes] = await Promise.all([
    api.get('/users/me/friend-requests'),
    api.get('/users/suggested'),
    api.get(`/users/${auth.user._id}/friends`)
  ]);
  requests.value  = rRes.data;
  suggested.value = sRes.data;
  myFriends.value = fRes.data;
});

async function respond(req, action) {
  await api.put(`/users/${req.requester._id}/friend-request`, { action });
  requests.value = requests.value.filter(r => r._id !== req._id);
  if (action === 'accept') {
    myFriends.value.push(req.requester);
    toast.success(`You and ${req.requester.username} are now friends! 🎉`);
  } else {
    toast.info('Request declined');
  }
}

async function addFriend(user) {
  await api.post(`/users/${user._id}/friend-request`);
  suggested.value = suggested.value.filter(u => u._id !== user._id);
  toast.success(`Friend request sent to ${user.username}!`);
}
</script>
