<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 style="font-size:20px;font-weight:800">Notifications</h2>
      <button v-if="store.unreadCount" class="btn btn-secondary btn-sm" @click="store.markAllRead()">
        <fa :icon="['fas','check']"/> Mark all read
      </button>
    </div>

    <div v-if="store.notifications.length===0" class="card" style="padding:48px;text-align:center;color:var(--text-muted)">
      <fa :icon="['fas','bell']" style="font-size:36px;margin-bottom:12px;display:block"/>
      <p style="font-size:16px;font-weight:600">No notifications yet</p>
      <p style="font-size:13px;margin-top:4px">When someone likes or comments on your posts, you'll see it here</p>
    </div>

    <div v-for="n in store.notifications" :key="n._id" class="card"
      :style="{ marginBottom:'6px', padding:'12px 16px', borderLeft: n.read?'none':'3px solid var(--primary)', cursor:'pointer' }"
      @click="markRead(n)"
      onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="position:relative;flex-shrink:0">
          <RouterLink :to="`/profile/${n.sender._id}`" @click.stop>
            <img :src="n.sender.avatar||avatar(n.sender.username)" class="avatar" width="44" height="44" :alt="n.sender.username"/>
          </RouterLink>
          <!-- FA icon badge -->
          <span :style="`position:absolute;bottom:-2px;right:-2px;background:${notifColor(n.type)};color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;border:2px solid var(--surface)`">
            <fa :icon="notifIcon(n.type)"/>
          </span>
        </div>
        <div style="flex:1;min-width:0">
          <p style="font-size:14px;line-height:1.4">
            <RouterLink :to="`/profile/${n.sender._id}`" style="font-weight:700" @click.stop>{{ n.sender.username }}</RouterLink>
            {{ notifText(n.type) }}
          </p>
          <p style="font-size:12px;margin-top:3px" :style="{ color: n.read?'var(--text-muted)':'var(--primary)', fontWeight: n.read?'400':'600' }">
            {{ timeAgo(n.createdAt) }}
          </p>
        </div>
        <img v-if="n.post?.images?.[0]" :src="n.post.images[0]" style="width:48px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0" alt=""/>
        <div v-else-if="n.post?.content" style="width:48px;height:48px;background:var(--surface2);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;color:var(--text-muted);text-align:center;padding:4px;overflow:hidden">
          {{ n.post.content.slice(0,20) }}
        </div>
        <span v-if="!n.read" style="width:10px;height:10px;background:var(--primary);border-radius:50%;flex-shrink:0"></span>
      </div>
    </div>

    <div v-if="hasMore" style="text-align:center;padding:16px">
      <button class="btn btn-secondary btn-sm" @click="loadMore">Load more</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import api from '@/services/api';

const store = useNotificationStore();
const hasMore = ref(false);
const page = ref(1);

onMounted(async () => {
  await store.fetch();
  hasMore.value = store.notifications.length === 20;
});

async function loadMore() {
  page.value++;
  const { data } = await api.get(`/notifications?page=${page.value}`);
  store.notifications.push(...data.notifications);
  hasMore.value = data.hasMore;
}

async function markRead(n) {
  if (!n.read) {
    await api.put(`/notifications/${n._id}/read`);
    n.read = true;
    store.unreadCount = Math.max(0, store.unreadCount - 1);
  }
}

const avatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'U')}&background=1877f2&color=fff`;

const notifText = t => ({
  like:'reacted to your post', love:'loved your post', comment:'commented on your post',
  reply:'replied to your comment', friend_request:'sent you a friend request',
  friend_accept:'accepted your friend request', follow:'started following you', share:'shared your post'
}[t]||'interacted with you');

const notifIcon = t => ({
  like:['fas','thumbs-up'], love:['fas','heart'], comment:['fas','comment'],
  reply:['fas','reply'], friend_request:['fas','user-plus'], friend_accept:['fas','circle-check'],
  follow:['fas','plus'], share:['fas','share']
}[t]||['fas','bell']);

const notifColor = t => ({
  like:'#1877f2', love:'#e41e3f', comment:'#42b72a', reply:'#42b72a',
  friend_request:'#f7b928', friend_accept:'#42b72a', follow:'#1877f2', share:'#8b5cf6'
}[t]||'#65676b');

const timeAgo = d => {
  const s=(Date.now()-new Date(d))/1000;
  if(s<60)return 'just now';
  if(s<3600)return `${Math.floor(s/60)}m ago`;
  if(s<86400)return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};
</script>
