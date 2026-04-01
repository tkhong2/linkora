<template>
  <div class="card post">
    <div class="post-header">
      <RouterLink :to="`/profile/${post.author._id}`">
        <img :src="post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.username}&background=6366f1&color=fff`"
          class="avatar" width="42" height="42" :alt="post.author.username" />
      </RouterLink>
      <div style="flex:1">
        <RouterLink :to="`/profile/${post.author._id}`" style="font-weight:600;font-size:14px">{{ post.author.username }}</RouterLink>
        <p style="font-size:12px;color:var(--text-muted)">{{ timeAgo(post.createdAt) }}</p>
      </div>
      <button v-if="isOwner" class="btn btn-sm btn-outline" style="color:var(--danger);padding:4px 8px" @click="$emit('delete', post._id)">✕</button>
    </div>

    <p v-if="post.content" style="font-size:15px;line-height:1.6;white-space:pre-wrap">{{ post.content }}</p>
    <img v-if="post.image" :src="post.image" class="post-image" :alt="'post image'"
      style="cursor:pointer" @dblclick="doLike" />

    <div class="post-actions">
      <button class="post-action-btn" :class="{ liked: isLiked }" @click="doLike" :style="likeAnim ? 'transform:scale(1.3)' : ''">
        {{ isLiked ? '♥' : '♡' }} {{ post.likes.length }}
      </button>
      <button class="post-action-btn" @click="showComments = !showComments">
        💬 {{ post.comments.length }}
      </button>
      <button class="post-action-btn" @click="copyLink">
        🔗 Share
      </button>
    </div>

    <!-- Comments -->
    <Transition name="slide">
      <div v-if="showComments" style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">
        <div v-for="c in post.comments" :key="c._id" style="display:flex;gap:8px;margin-bottom:10px;align-items:flex-start">
          <RouterLink :to="`/profile/${c.user._id}`">
            <img :src="c.user.avatar || `https://ui-avatars.com/api/?name=${c.user.username}&background=6366f1&color=fff`"
              class="avatar" width="30" height="30" :alt="c.user.username" />
          </RouterLink>
          <div style="background:var(--bg);border-radius:10px;padding:8px 12px;flex:1">
            <RouterLink :to="`/profile/${c.user._id}`" style="font-weight:600;font-size:13px">{{ c.user.username }}</RouterLink>
            <p style="font-size:13px;margin-top:2px">{{ c.content }}</p>
          </div>
        </div>

        <form @submit.prevent="submitComment" style="display:flex;gap:8px;margin-top:8px;align-items:center">
          <img :src="auth.user?.avatar || `https://ui-avatars.com/api/?name=${auth.user?.username}&background=6366f1&color=fff`"
            class="avatar" width="30" height="30" alt="avatar" />
          <input v-model="commentText" placeholder="Write a comment..." style="flex:1;border-radius:20px" @keydown.enter.prevent="submitComment" />
          <button class="btn btn-primary btn-sm" type="submit" :disabled="!commentText.trim()">↑</button>
        </form>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const props = defineProps({ post: Object });
const emit = defineEmits(['like', 'delete', 'comment']);

const auth = useAuthStore();
const toast = useToastStore();
const showComments = ref(false);
const commentText = ref('');
const likeAnim = ref(false);

const isOwner = computed(() => props.post.author._id === auth.user?._id);
const isLiked = computed(() => props.post.likes.includes(auth.user?._id));

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function doLike() {
  emit('like', props.post._id);
  likeAnim.value = true;
  setTimeout(() => likeAnim.value = false, 300);
}

function copyLink() {
  navigator.clipboard.writeText(`${window.location.origin}/profile/${props.post.author._id}`);
  toast.info('Link copied!');
}

function submitComment() {
  if (!commentText.value.trim()) return;
  emit('comment', { postId: props.post._id, content: commentText.value });
  commentText.value = '';
}
</script>

<style>
.post-action-btn { transition: transform .15s, color .15s !important; }
.slide-enter-active, .slide-leave-active { transition: all .2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
