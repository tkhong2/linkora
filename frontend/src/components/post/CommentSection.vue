<template>
  <div style="padding:0 16px 12px">
    <!-- Comment input -->
    <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
      <img :src="auth.user?.avatar||avatar(auth.user?.username)" class="avatar" width="32" height="32" alt="me"/>
      <form @submit.prevent="submit" style="flex:1;display:flex;gap:6px">
        <input v-model="text" class="input input-rounded" placeholder="Write a comment..." style="flex:1;padding:8px 14px" />
        <button class="btn btn-primary btn-sm" :disabled="!text.trim()">↑</button>
      </form>
    </div>

    <!-- Comments list -->
    <div v-if="loading" style="text-align:center;padding:12px;color:var(--text-muted);font-size:13px">Loading...</div>

    <div v-for="c in comments" :key="c._id" class="comment-item">
      <RouterLink :to="`/profile/${c.author._id}`">
        <img :src="c.author.avatar||avatar(c.author.username)" class="avatar" width="32" height="32" :alt="c.author.username"/>
      </RouterLink>
      <div style="flex:1">
        <div class="comment-bubble">
          <RouterLink :to="`/profile/${c.author._id}`" class="author">{{ c.author.username }}</RouterLink>
          <p class="content">{{ c.content }}</p>
        </div>
        <div class="comment-actions">
          <span style="color:var(--text-muted)">{{ timeAgo(c.createdAt) }}</span>
          <button :class="{ liked: c.myReaction }" @click="reactComment(c)">
            {{ c.myReaction ? reactionEmoji(c.myReaction) : 'Like' }} {{ c.reactionCount || '' }}
          </button>
          <button @click="replyTo = replyTo===c._id ? null : c._id">Reply</button>
          <button v-if="c.author._id===auth.user?._id" @click="deleteComment(c._id)" style="color:var(--danger)">Delete</button>
        </div>

        <!-- Reply input -->
        <div v-if="replyTo===c._id" style="display:flex;gap:6px;margin-top:6px">
          <input v-model="replyText" class="input input-rounded" :placeholder="`Reply to ${c.author.username}...`" style="flex:1;padding:6px 12px;font-size:13px" @keydown.enter.prevent="submitReply(c._id)" />
          <button class="btn btn-primary btn-xs" @click="submitReply(c._id)">↑</button>
        </div>

        <!-- Replies -->
        <div v-if="c.replyCount > 0" style="margin-top:6px">
          <button v-if="!replies[c._id]" class="btn btn-ghost btn-xs" @click="loadReplies(c._id)">
            ↳ View {{ c.replyCount }} {{ c.replyCount===1?'reply':'replies' }}
          </button>
          <div v-if="replies[c._id]" style="margin-top:6px;padding-left:8px;border-left:2px solid var(--border)">
            <div v-for="r in replies[c._id]" :key="r._id" class="comment-item" style="margin-bottom:8px">
              <img :src="r.author.avatar||avatar(r.author.username)" class="avatar" width="26" height="26" :alt="r.author.username"/>
              <div style="flex:1">
                <div class="comment-bubble">
                  <span class="author">{{ r.author.username }}</span>
                  <p class="content">{{ r.content }}</p>
                </div>
                <div class="comment-actions">
                  <span>{{ timeAgo(r.createdAt) }}</span>
                  <button v-if="r.author._id===auth.user?._id" @click="deleteComment(r._id, c._id)" style="color:var(--danger)">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button v-if="hasMore" class="btn btn-ghost btn-sm" style="width:100%;margin-top:4px" @click="loadMore">Load more comments</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({ postId: String });
const auth = useAuthStore();

const comments = ref([]);
const replies  = ref({});
const text     = ref('');
const replyText = ref('');
const replyTo  = ref(null);
const loading  = ref(false);
const page     = ref(1);
const hasMore  = ref(false);

const REACTIONS = { like:'👍', love:'❤️', haha:'😂', wow:'😮', sad:'😢', angry:'😡' };
const reactionEmoji = t => REACTIONS[t] || '👍';
const avatar = name => `https://ui-avatars.com/api/?name=${name}&background=1877f2&color=fff`;

function timeAgo(date) {
  const d = (Date.now() - new Date(date)) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d/60)}m`;
  if (d < 86400) return `${Math.floor(d/3600)}h`;
  return `${Math.floor(d/86400)}d`;
}

async function load(p = 1) {
  loading.value = true;
  try {
    const { data } = await api.get(`/posts/${props.postId}/comments?page=${p}`);
    if (p === 1) comments.value = data.comments;
    else comments.value.push(...data.comments);
    hasMore.value = data.hasMore;
    page.value = p;
  } finally { loading.value = false; }
}

async function loadMore() { await load(page.value + 1); }

async function submit() {
  if (!text.value.trim()) return;
  const { data } = await api.post(`/posts/${props.postId}/comments`, { content: text.value });
  comments.value.unshift(data);
  text.value = '';
}

async function submitReply(parentId) {
  if (!replyText.value.trim()) return;
  const { data } = await api.post(`/posts/${props.postId}/comments`, { content: replyText.value, parent: parentId });
  if (!replies.value[parentId]) replies.value[parentId] = [];
  replies.value[parentId].push(data);
  const parent = comments.value.find(c => c._id === parentId);
  if (parent) parent.replyCount++;
  replyText.value = '';
  replyTo.value = null;
}

async function loadReplies(parentId) {
  const { data } = await api.get(`/posts/${props.postId}/comments?parent=${parentId}`);
  replies.value[parentId] = data.comments;
}

async function reactComment(comment) {
  const type = comment.myReaction ? comment.myReaction : 'like';
  const { data } = await api.post(`/posts/${props.postId}/comments/${comment._id}/react`, { type });
  comment.reactionCount = data.reactionCount;
  comment.myReaction = data.myReaction;
}

async function deleteComment(id, parentId = null) {
  await api.delete(`/posts/${props.postId}/comments/${id}`);
  if (parentId) {
    replies.value[parentId] = replies.value[parentId]?.filter(r => r._id !== id);
    const parent = comments.value.find(c => c._id === parentId);
    if (parent) parent.replyCount--;
  } else {
    comments.value = comments.value.filter(c => c._id !== id);
  }
}

onMounted(() => load());
</script>
