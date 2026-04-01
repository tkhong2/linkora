<template>
  <div>
    <!-- Search bar -->
    <div class="card" style="padding:12px 16px;margin-bottom:16px;position:sticky;top:0;z-index:30">
      <div style="position:relative">
        <fa :icon="['fas','magnifying-glass']" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px;pointer-events:none"/>
        <input v-model="q" @input="onSearch" class="input input-rounded"
          placeholder="Search posts and people..."
          style="padding-left:38px;width:100%"/>
        <button v-if="q" @click="q='';onSearch()"
          style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-muted);cursor:pointer">
          <fa :icon="['fas','xmark']"/>
        </button>
      </div>
    </div>

    <!-- People results -->
    <div v-if="users.length" class="card" style="padding:14px 16px;margin-bottom:16px">
      <p style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;display:flex;align-items:center;gap:6px">
        <fa :icon="['fas','user']"/> People
      </p>
      <div v-for="u in users" :key="u._id" style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <RouterLink :to="`/profile/${u._id}`" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
          <img :src="u.avatar || avatar(u.username)" class="avatar" width="44" height="44" :alt="u.username"/>
          <div style="min-width:0">
            <p style="font-weight:700;font-size:14px">{{ u.username }}</p>
            <p style="font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ u.bio || 'No bio' }}</p>
          </div>
        </RouterLink>
        <RouterLink :to="`/profile/${u._id}`" class="btn btn-secondary btn-sm">View</RouterLink>
      </div>
    </div>

    <!-- Posts label -->
    <div v-if="q" style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;padding:0 4px;display:flex;align-items:center;gap:6px">
      <fa :icon="['fas','newspaper']" style="font-size:11px"/> Posts matching "{{ q }}"
    </div>

    <SkeletonPost v-if="loading" :count="3"/>

    <div v-if="!loading && posts.length === 0" class="card" style="padding:40px;text-align:center;color:var(--text-muted)">
      <fa :icon="['fas', q ? 'magnifying-glass' : 'globe']" style="font-size:36px;margin-bottom:12px;display:block"/>
      <p style="font-size:16px;font-weight:600">{{ q ? 'No results found' : 'No posts yet' }}</p>
    </div>

    <PostCard v-for="post in posts" :key="post._id" :post="post"
      @react="onReact" @delete="onDelete" @share="onShare"/>

    <div ref="scrollTrigger" style="height:20px"></div>
    <div v-if="loadingMore" style="text-align:center;padding:16px;color:var(--text-muted);font-size:14px">
      <fa :icon="['fas','spinner']" spin /> Loading...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '@/services/api';
import { useToastStore } from '@/stores/toast';
import PostCard from '@/components/post/PostCard.vue';
import SkeletonPost from '@/components/ui/SkeletonPost.vue';

const toast = useToastStore();
const posts = ref([]);
const users = ref([]);
const q = ref('');
const loading = ref(true);
const loadingMore = ref(false);
const hasMore = ref(true);
const page = ref(1);
const scrollTrigger = ref(null);

const avatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=1877f2&color=fff`;

async function loadPosts(p = 1) {
  if (p === 1) loading.value = true; else loadingMore.value = true;
  try {
    const url = q.value.trim()
      ? `/posts/search?q=${encodeURIComponent(q.value)}&page=${p}`
      : `/posts/feed?page=${p}&limit=15`;
    const { data } = await api.get(url);
    const newPosts = data.posts || [];
    if (p === 1) posts.value = newPosts; else posts.value.push(...newPosts);
    hasMore.value = data.hasMore ?? newPosts.length === 15;
    page.value = p;
  } catch { toast.error('Failed to load'); }
  finally { loading.value = false; loadingMore.value = false; }
}

let searchTimer;
function onSearch() {
  clearTimeout(searchTimer);
  users.value = [];
  searchTimer = setTimeout(async () => {
    const val = q.value.trim();
    if (val) {
      const { data } = await api.get(`/users/search?q=${val}`);
      users.value = data;
    }
    loadPosts(1);
  }, 300);
}

let observer;
onMounted(() => {
  loadPosts();
  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !loadingMore.value && hasMore.value && !loading.value)
      loadPosts(page.value + 1);
  }, { threshold: 0.1 });
  if (scrollTrigger.value) observer.observe(scrollTrigger.value);
});
onUnmounted(() => observer?.disconnect());

async function onReact({ postId, type }) {
  const { data } = await api.post(`/posts/${postId}/react`, { type });
  const p = posts.value.find(p => p._id === postId);
  if (p) { p.reactionCount = data.reactionCount; p.myReaction = data.myReaction; }
}
async function onDelete(id) {
  await api.delete(`/posts/${id}`);
  posts.value = posts.value.filter(p => p._id !== id);
}
async function onShare({ postId, caption }) {
  await api.post('/posts', { sharedFrom: postId, content: caption });
  toast.success('Shared!');
}
</script>
