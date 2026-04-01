<template>
  <div>
    <h2 style="font-size:20px;font-weight:800;margin-bottom:16px">Messages</h2>

    <div class="card" style="padding:12px 16px;margin-bottom:12px">
      <div style="position:relative">
        <fa :icon="['fas','magnifying-glass']" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px;pointer-events:none"/>
        <input v-model="q" @input="searchUsers" class="input input-rounded" placeholder="Search people to message..." style="padding-left:38px;width:100%"/>
      </div>
      <div v-if="searchResults.length" style="margin-top:8px;border-top:1px solid var(--border);padding-top:8px">
        <RouterLink v-for="u in searchResults" :key="u._id" :to="`/messages/${u._id}`" @click="q='';searchResults=[]"
          style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px"
          onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
          <div style="position:relative">
            <img :src="u.avatar||avatar(u.username)" class="avatar" width="38" height="38" :alt="u.username"/>
            <span v-if="chatStore.isOnline(u._id)" class="online-dot" style="position:absolute;bottom:0;right:0"></span>
          </div>
          <div>
            <p style="font-size:14px;font-weight:600">{{ u.username }}</p>
            <p style="font-size:12px;color:var(--text-muted)">
              <span v-if="chatStore.isOnline(u._id)" style="color:var(--success)"><fa :icon="['fas','circle']" style="font-size:8px"/> Online</span>
              <span v-else>{{ u.bio||'No bio' }}</span>
            </p>
          </div>
        </RouterLink>
      </div>
    </div>

    <div v-if="friends.length" class="card" style="padding:12px 16px;margin-bottom:12px">
      <p style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;display:flex;align-items:center;gap:6px">
        <fa :icon="['fas','user-group']"/> Friends
      </p>
      <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none">
        <RouterLink v-for="u in friends" :key="u._id" :to="`/messages/${u._id}`" style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0">
          <div style="position:relative">
            <img :src="u.avatar||avatar(u.username)" class="avatar" width="48" height="48" :alt="u.username"/>
            <span v-if="chatStore.isOnline(u._id)" class="online-dot" style="position:absolute;bottom:0;right:0"></span>
          </div>
          <span style="font-size:11px;max-width:52px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ u.username }}</span>
        </RouterLink>
      </div>
    </div>

    <div v-if="conversations.length===0 && !friends.length" class="card" style="padding:40px;text-align:center;color:var(--text-muted)">
      <fa :icon="['fas','comment-dots']" style="font-size:36px;margin-bottom:12px;display:block"/>
      <p style="font-size:16px;margin-bottom:8px;font-weight:600">No messages yet</p>
      <RouterLink to="/friends" class="btn btn-primary btn-sm" style="margin-top:12px"><fa :icon="['fas','user-plus']"/> Find Friends</RouterLink>
    </div>

    <div v-if="conversations.length" style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;display:flex;align-items:center;gap:6px">
      <fa :icon="['fas','clock']" style="font-size:11px"/> Recent
    </div>

    <RouterLink v-for="c in conversations" :key="c._id" :to="`/messages/${partner(c)._id}`"
      class="card" style="display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:6px"
      onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
      <div style="position:relative;flex-shrink:0">
        <img :src="partner(c).avatar||avatar(partner(c).username)" class="avatar" width="48" height="48" :alt="partner(c).username"/>
        <span v-if="chatStore.isOnline(partner(c)._id)" class="online-dot" style="position:absolute;bottom:0;right:0"></span>
      </div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
          <p style="font-weight:700;font-size:14px">{{ partner(c).username }}</p>
          <span style="font-size:11px;color:var(--text-muted);flex-shrink:0">{{ timeAgo(c.createdAt) }}</span>
        </div>
        <p style="font-size:13px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          <span v-if="c.sender._id===auth.user._id" style="font-weight:500">You: </span>
          <fa v-if="c.image&&!c.content" :icon="['fas','image']" style="font-size:12px"/>
          {{ c.content||(c.image?'Photo':'...') }}
        </p>
      </div>
      <span v-if="c.unreadCount" class="badge">{{ c.unreadCount }}</span>
    </RouterLink>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';

const auth = useAuthStore();
const chatStore = useChatStore();
const conversations = ref([]);
const friends = ref([]);
const q = ref('');
const searchResults = ref([]);

const avatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'U')}&background=1877f2&color=fff`;
const timeAgo = d => { const m=Math.floor((Date.now()-new Date(d))/60000); return m<1?'now':m<60?`${m}m`:m<1440?`${Math.floor(m/60)}h`:`${Math.floor(m/1440)}d`; };

onMounted(async () => {
  try {
    const [convRes, frRes] = await Promise.all([api.get('/messages'), api.get(`/users/${auth.user._id}/friends`)]);
    conversations.value = convRes.data;
    friends.value = frRes.data;
  } catch {}
});

function partner(c) { return c.sender._id===auth.user._id ? c.receiver : c.sender; }

let timer;
function searchUsers() {
  clearTimeout(timer);
  if (!q.value.trim()) { searchResults.value=[]; return; }
  timer = setTimeout(async () => {
    const { data } = await api.get(`/users/search?q=${q.value}`);
    searchResults.value = data;
  }, 300);
}
</script>
