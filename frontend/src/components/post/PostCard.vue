<template>
  <div class="card post-card">
    <!-- Shared indicator -->
    <div v-if="post.sharedFrom" style="padding:10px 16px 0;font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:6px">
      🔁
      <RouterLink :to="`/profile/${post.author._id}`" style="font-weight:600;color:var(--text)">{{ post.author.username }}</RouterLink>
      shared a post
    </div>

    <!-- Header -->
    <div class="post-header">
      <RouterLink :to="`/profile/${post.author._id}`">
        <img :src="post.author.avatar || avatar(post.author.username)" class="avatar" width="42" height="42" :alt="post.author.username"/>
      </RouterLink>
      <div style="flex:1;min-width:0">
        <RouterLink :to="`/profile/${post.author._id}`" style="font-weight:700;font-size:15px;display:block">{{ post.author.username }}</RouterLink>
        <span style="font-size:12px;color:var(--text-muted)">{{ timeAgo(post.createdAt) }}</span>
      </div>
      <div style="position:relative" ref="menuRef">
        <button class="btn btn-ghost btn-sm" @click="menuOpen = !menuOpen" style="padding:6px 10px">
          <fa :icon="['fas', 'ellipsis']" />
        </button>
        <Transition name="fade">
          <div v-if="menuOpen" style="position:absolute;right:0;top:38px;background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow-md);z-index:50;min-width:180px;overflow:hidden">
            <button v-if="isOwner" class="post-menu-item" @click="$emit('edit', post); menuOpen=false">
              <fa :icon="['fas', 'pen']" style="width:14px" /> Edit post
            </button>
            <button v-if="isOwner" class="post-menu-item danger" @click="confirmDelete = true; menuOpen=false">
              <fa :icon="['fas', 'trash']" style="width:14px" /> Delete post
            </button>
            <button class="post-menu-item" @click="copyLink; menuOpen=false">
              <fa :icon="['fas', 'link']" style="width:14px" /> Copy link
            </button>
            <button class="post-menu-item" @click="shareModal = true; menuOpen=false">
              <fa :icon="['fas', 'share']" style="width:14px" /> Share post
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Content -->
    <div v-if="post.content" class="post-body">{{ post.content }}</div>

    <!-- Shared original -->
    <div v-if="post.sharedFrom" style="margin:4px 16px 8px;border:1px solid var(--border);border-radius:10px;overflow:hidden">
      <div style="padding:10px 12px;display:flex;align-items:center;gap:8px;background:var(--surface2)">
        <img :src="post.sharedFrom.author?.avatar || avatar(post.sharedFrom.author?.username)" class="avatar" width="28" height="28" alt=""/>
        <RouterLink :to="`/profile/${post.sharedFrom.author?._id}`" style="font-weight:600;font-size:13px">{{ post.sharedFrom.author?.username }}</RouterLink>
        <span style="font-size:11px;color:var(--text-muted)">{{ timeAgo(post.sharedFrom.createdAt) }}</span>
      </div>
      <p v-if="post.sharedFrom.content" style="padding:8px 12px;font-size:14px">{{ post.sharedFrom.content }}</p>
      <img v-if="post.sharedFrom.images?.[0]" :src="post.sharedFrom.images[0]" style="width:100%;max-height:280px;object-fit:cover;cursor:pointer" alt="" @click="lightboxSrc = post.sharedFrom.images[0]"/>
    </div>

    <!-- Images grid -->
    <div v-if="post.images?.length" :class="`post-images ${imgClass}`" style="cursor:pointer">
      <img v-for="(img, i) in post.images.slice(0, 3)" :key="img" :src="img" :alt="`image ${i+1}`" @click="lightboxSrc = img"/>
      <div v-if="post.images.length > 3" style="position:relative;cursor:pointer" @click="lightboxSrc = post.images[3]">
        <img :src="post.images[3]" style="width:100%;height:250px;object-fit:cover;filter:brightness(.5)" alt="more"/>
        <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:700">+{{ post.images.length - 3 }}</span>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="post-stats" v-if="post.reactionCount || post.commentCount || post.shareCount">
      <span v-if="post.reactionCount" style="display:flex;align-items:center;gap:5px;cursor:pointer" @click="showReactions = true">
        <span style="background:var(--primary);color:#fff;border-radius:50%;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;font-size:10px">
          <fa :icon="['fas', 'thumbs-up']" />
        </span>
        {{ post.reactionCount }}
      </span>
      <span v-else></span>
      <span style="display:flex;gap:12px">
        <span v-if="post.commentCount" style="cursor:pointer" @click="showComments = !showComments">{{ post.commentCount }} comments</span>
        <span v-if="post.shareCount">{{ post.shareCount }} shares</span>
      </span>
    </div>

    <!-- Action buttons -->
    <div class="post-actions">
      <div style="position:relative;flex:1" @mouseenter="hoverTimer = setTimeout(() => pickerVisible = true, 500)" @mouseleave="clearHover">
        <button class="post-action-btn" :class="{ reacted: post.myReaction }" @click="quickReact"
          :style="post.myReaction ? `color:${reactionColor(post.myReaction)}` : ''">
          <fa :icon="post.myReaction ? ['fas','thumbs-up'] : ['far','thumbs-up']" />
          {{ post.myReaction ? capitalize(post.myReaction) : 'Like' }}
        </button>
        <Transition name="fade">
          <ReactionPicker v-if="pickerVisible" @pick="react" @mouseenter="clearTimeout(hoverTimer)" @mouseleave="pickerVisible = false"/>
        </Transition>
      </div>

      <button class="post-action-btn" style="flex:1" @click="showComments = !showComments">
        <fa :icon="['far', 'comment']" /> Comment
      </button>
      <button class="post-action-btn" style="flex:1" @click="shareModal = true">
        <fa :icon="['fas', 'share']" /> Share
      </button>
    </div>

    <!-- Comments -->
    <Transition name="slide-up">
      <CommentSection v-if="showComments" :postId="post._id" />
    </Transition>

    <!-- Lightbox -->
    <ImageLightbox :src="lightboxSrc" @close="lightboxSrc = null"/>

    <!-- Reactions modal -->
    <Teleport to="body">
      <div v-if="showReactions" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center" @click.self="showReactions=false">
        <div class="card" style="width:100%;max-width:400px;padding:20px;max-height:80vh;overflow-y:auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="font-size:17px;font-weight:700">Reactions</h3>
            <button class="btn btn-ghost btn-sm" @click="showReactions=false">✕</button>
          </div>
          <div v-if="reactionsList.length">
            <div v-for="r in reactionsList" :key="r._id" style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <img :src="r.user.avatar||avatar(r.user.username)" class="avatar" width="36" height="36" :alt="r.user.username"/>
              <span style="flex:1;font-size:14px;font-weight:500">{{ r.user.username }}</span>
              <span style="font-size:20px">{{ reactionEmoji(r.type) }}</span>
            </div>
          </div>
          <p v-else style="text-align:center;color:var(--text-muted);font-size:14px">Loading...</p>
        </div>
      </div>
    </Teleport>

    <!-- Share modal -->
    <Teleport to="body">
      <div v-if="shareModal" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center" @click.self="shareModal=false">
        <div class="card" style="width:100%;max-width:480px;padding:20px">
          <h3 style="font-size:17px;font-weight:700;margin-bottom:14px">Share Post</h3>
          <textarea v-model="shareCaption" class="input" rows="3" placeholder="Say something about this..." style="resize:none;margin-bottom:12px"></textarea>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-secondary" @click="shareModal=false">Cancel</button>
            <button class="btn btn-primary" @click="doShare">Share now</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirm delete -->
    <ConfirmDialog :show="confirmDelete" title="Delete Post" message="This cannot be undone." @confirm="doDelete" @cancel="confirmDelete=false"/>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import api from '@/services/api';
import ReactionPicker from './ReactionPicker.vue';
import CommentSection from './CommentSection.vue';
import ImageLightbox from '@/components/ui/ImageLightbox.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';

const props = defineProps({ post: Object });
const emit  = defineEmits(['react', 'delete', 'edit', 'share']);

const auth  = useAuthStore();
const toast = useToastStore();

const showComments  = ref(false);
const pickerVisible = ref(false);
const shareModal    = ref(false);
const shareCaption  = ref('');
const menuOpen      = ref(false);
const lightboxSrc   = ref(null);
const showReactions = ref(false);
const reactionsList = ref([]);
const confirmDelete = ref(false);
let hoverTimer;

const REACTIONS = { like:'👍', love:'❤️', haha:'😂', wow:'😮', sad:'😢', angry:'😡' };
const COLORS    = { like:'#1877f2', love:'#e41e3f', haha:'#f7b928', wow:'#f7b928', sad:'#1877f2', angry:'#e41e3f' };
const reactionEmoji = t => REACTIONS[t] || '👍';
const reactionColor = t => COLORS[t] || 'var(--primary)';
const capitalize = s => s ? s[0].toUpperCase() + s.slice(1) : '';
const avatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=1877f2&color=fff`;
const isOwner = computed(() => props.post.author._id === auth.user?._id);
const imgClass = computed(() => {
  const n = Math.min(props.post.images?.length || 0, 4);
  return ['', 'one', 'two', 'three', 'three'][n];
});
const topEmojis = computed(() => {
  if (props.post.myReaction) return reactionEmoji(props.post.myReaction);
  return '👍';
});

function timeAgo(date) {
  const s = (Date.now() - new Date(date)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function clearHover() {
  clearTimeout(hoverTimer);
  setTimeout(() => { pickerVisible.value = false; }, 200);
}

function react(type) {
  pickerVisible.value = false;
  clearTimeout(hoverTimer);
  emit('react', { postId: props.post._id, type });
}

function quickReact() {
  react(props.post.myReaction || 'like');
}

function copyLink() {
  navigator.clipboard.writeText(`${window.location.origin}/profile/${props.post.author._id}`);
  toast.info('Link copied!');
}

function doShare() {
  emit('share', { postId: props.post._id, caption: shareCaption.value });
  shareModal.value = false;
  shareCaption.value = '';
}

function doDelete() {
  confirmDelete.value = false;
  emit('delete', props.post._id);
}

// Load reactions when modal opens
watch(showReactions, async (v) => {
  if (v && !reactionsList.value.length) {
    const { data } = await api.get(`/posts/${props.post._id}/reactions`);
    reactionsList.value = data.reactions;
  }
});

// Close menu on outside click
function onClickOutside(e) {
  if (menuOpen.value) menuOpen.value = false;
}
onMounted(() => document.addEventListener('click', onClickOutside));
onUnmounted(() => document.removeEventListener('click', onClickOutside));
</script>

<style>
.post-menu-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 10px 16px;
  background: none; border: none;
  font-size: 14px; font-weight: 500;
  color: var(--text); cursor: pointer;
  transition: background .15s; text-align: left;
}
.post-menu-item:hover { background: var(--surface2); }
.post-menu-item.danger { color: var(--danger); }
</style>
