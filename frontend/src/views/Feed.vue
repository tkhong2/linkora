<template>
  <div>
    <StoriesBar :groups="storyGroups" @refresh="loadStories"/>
    <CreatePost @posted="onPosted" :edit-post="editingPost" @updated="onUpdated"/>

    <!-- New posts banner -->
    <Transition name="slide-up">
      <button v-if="newPostsCount" class="btn btn-primary btn-sm"
        style="width:100%;margin-bottom:12px;justify-content:center"
        @click="showNewPosts">
        ↑ {{ newPostsCount }} new post{{ newPostsCount > 1 ? 's' : '' }}
      </button>
    </Transition>

    <SkeletonPost v-if="loading" :count="3"/>

    <div v-if="!loading && posts.length === 0" class="card"
      style="padding:48px 24px;text-align:center;color:var(--text-muted)">
      <p style="font-size:40px;margin-bottom:12px">👋</p>
      <p style="font-size:18px;font-weight:600;margin-bottom:6px">Your feed is empty</p>
      <p style="font-size:14px;margin-bottom:16px">Follow people or add friends to see their posts</p>
      <RouterLink to="/friends" class="btn btn-primary">Find Friends</RouterLink>
    </div>

    <PostCard
      v-for="post in posts" :key="post._id" :post="post"
      @react="onReact" @delete="onDelete" @edit="onEdit" @share="onShare"
    />

    <!-- Infinite scroll trigger -->
    <div ref="scrollTrigger" style="height:20px"></div>

    <div v-if="loadingMore" style="text-align:center;padding:20px">
      <div style="display:inline-flex;gap:6px;align-items:center;color:var(--text-muted);font-size:14px">
        <span style="animation:spin 1s linear infinite;display:inline-block">⟳</span> Loading...
      </div>
    </div>
    <div v-if="!hasMore && posts.length" style="text-align:center;padding:20px;font-size:13px;color:var(--text-muted)">
      ✓ You're all caught up
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { getSocket } from '@/socket';
import PostCard from '@/components/post/PostCard.vue';
import CreatePost from '@/components/post/CreatePost.vue';
import StoriesBar from '@/components/story/StoriesBar.vue';
import SkeletonPost from '@/components/ui/SkeletonPost.vue';

const auth  = useAuthStore();
const toast = useToastStore();

const posts        = ref([]);
const storyGroups  = ref([]);
const loading      = ref(true);
const loadingMore  = ref(false);
const hasMore      = ref(true);
const page         = ref(1);
const editingPost  = ref(null);
const newPostsQueue = ref([]);
const newPostsCount = ref(0);
const scrollTrigger = ref(null);

async function loadFeed(p = 1) {
  if (p === 1) loading.value = true;
  else loadingMore.value = true;
  try {
    const { data } = await api.get(`/posts/feed?page=${p}&limit=10`);
    if (p === 1) posts.value = data.posts;
    else posts.value.push(...data.posts);
    hasMore.value = data.hasMore;
    page.value = p;
  } catch { toast.error('Failed to load feed'); }
  finally { loading.value = false; loadingMore.value = false; }
}

async function loadStories() {
  try { const { data } = await api.get('/stories'); storyGroups.value = data; } catch {}
}

function showNewPosts() {
  posts.value.unshift(...newPostsQueue.value);
  newPostsQueue.value = [];
  newPostsCount.value = 0;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Intersection Observer for infinite scroll
let observer;
onMounted(() => {
  loadFeed();
  loadStories();

  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !loadingMore.value && hasMore.value && !loading.value) {
      loadFeed(page.value + 1);
    }
  }, { threshold: 0.1 });
  if (scrollTrigger.value) observer.observe(scrollTrigger.value);

  // Realtime new posts
  getSocket()?.on('new_post', p => {
    if (p.author._id !== auth.user?._id) {
      newPostsQueue.value.unshift(p);
      newPostsCount.value++;
    }
  });
});

onUnmounted(() => {
  observer?.disconnect();
  getSocket()?.off('new_post');
});

function onPosted(post) {
  posts.value.unshift(post);
  toast.success('Post created!');
}

function onUpdated(post) {
  const i = posts.value.findIndex(p => p._id === post._id);
  if (i !== -1) posts.value[i] = { ...posts.value[i], ...post };
  editingPost.value = null;
}

function onEdit(post) { editingPost.value = { ...post }; }

async function onDelete(id) {
  await api.delete(`/posts/${id}`);
  posts.value = posts.value.filter(p => p._id !== id);
  toast.success('Post deleted');
}

async function onReact({ postId, type }) {
  const { data } = await api.post(`/posts/${postId}/react`, { type });
  const post = posts.value.find(p => p._id === postId);
  if (post) { post.reactionCount = data.reactionCount; post.myReaction = data.myReaction; }
}

async function onShare({ postId, caption }) {
  try {
    await api.post('/posts', { sharedFrom: postId, content: caption, sharedCaption: caption });
    toast.success('Shared to your feed!');
    loadFeed(1);
  } catch { toast.error('Failed to share'); }
}
</script>

<style>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
