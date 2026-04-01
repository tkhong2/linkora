<template>
  <div style="display:flex;flex-direction:column;height:calc(100vh - 48px)">
    <!-- Header -->
    <div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:8px;flex-shrink:0">
      <RouterLink to="/messages" style="color:var(--text-muted);font-size:18px;line-height:1;padding:4px">
        <fa :icon="['fas', 'arrow-left']" />
      </RouterLink>
      <RouterLink :to="`/profile/${route.params.id}`" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
        <div style="position:relative;flex-shrink:0">
          <img :src="other?.avatar || avatar(other?.username)" class="avatar" width="42" height="42" :alt="other?.username"/>
          <span v-if="chatStore.isOnline(route.params.id)" class="online-dot" style="position:absolute;bottom:0;right:0"></span>
        </div>
        <div>
          <p style="font-weight:700;font-size:15px">{{ other?.username }}</p>
          <p style="font-size:12px;color:var(--text-muted)">
            <span v-if="chatStore.typingUsers[route.params.id]" style="color:var(--primary)">typing...</span>
            <span v-else-if="chatStore.isOnline(route.params.id)" style="color:var(--success)">● Active now</span>
            <span v-else>Offline</span>
          </p>
        </div>
      </RouterLink>
    </div>

    <!-- Messages area -->
    <div ref="msgBox" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:4px;padding:8px 12px">
      <div v-if="loading" style="text-align:center;padding:40px;color:var(--text-muted)">
        <div style="font-size:24px;margin-bottom:8px">💬</div>
        Loading messages...
      </div>

      <div v-if="!loading && chatStore.messages.length === 0" style="text-align:center;padding:40px;color:var(--text-muted)">
        <div style="font-size:48px;margin-bottom:12px">👋</div>
        <p style="font-size:16px;font-weight:600">Say hi to {{ other?.username }}!</p>
      </div>

      <template v-for="(msg, i) in chatStore.messages" :key="msg._id">
        <!-- Date separator -->
        <div v-if="showDateSep(i)" style="text-align:center;margin:8px 0">
          <span style="font-size:11px;color:var(--text-muted);background:var(--surface2);padding:3px 10px;border-radius:999px">
            {{ dateLabel(msg.createdAt) }}
          </span>
        </div>

        <div :style="{
          display: 'flex',
          justifyContent: isMine(msg) ? 'flex-end' : 'flex-start',
          alignItems: 'flex-end',
          gap: '8px',
          marginBottom: isLastInGroup(i) ? '8px' : '2px'
        }">
          <!-- Avatar (only last in group) -->
          <img v-if="!isMine(msg) && isLastInGroup(i)"
            :src="msg.sender.avatar || avatar(msg.sender.username)"
            class="avatar" width="28" height="28" :alt="msg.sender.username" style="flex-shrink:0"/>
          <div v-else-if="!isMine(msg)" style="width:28px;flex-shrink:0"></div>

          <div :style="{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMine(msg) ? 'flex-end' : 'flex-start' }">
            <div class="chat-bubble" :class="isMine(msg) ? 'mine' : 'theirs'">
              <img v-if="msg.image" :src="msg.image" style="max-width:100%;border-radius:10px;display:block;cursor:pointer"
                alt="img" @click="lightboxSrc = msg.image"/>
              <span v-if="msg.content">{{ msg.content }}</span>
            </div>
            <!-- Time + seen (only last in group) -->
            <div v-if="isLastInGroup(i)" style="display:flex;align-items:center;gap:4px;margin-top:3px">
              <span style="font-size:10px;color:var(--text-muted)">{{ timeStr(msg.createdAt) }}</span>
              <span v-if="isMine(msg)" style="font-size:11px" :style="{ color: msg.seen ? 'var(--primary)' : 'var(--text-muted)' }">
                {{ msg.seen ? '✓✓' : '✓' }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Input -->
    <div style="display:flex;gap:8px;padding:8px 0;align-items:flex-end;flex-shrink:0">
      <label class="btn btn-secondary btn-sm" style="cursor:pointer;padding:10px 12px;flex-shrink:0">
        <fa :icon="['fas', 'image']" />
        <input type="file" accept="image/*" style="display:none" @change="sendImage"/>
      </label>
      <textarea v-model="text" class="input" rows="1" placeholder="Aa"
        style="flex:1;resize:none;border-radius:20px;padding:10px 16px;max-height:120px;overflow-y:auto"
        @keydown.enter.exact.prevent="send"
        @input="autoResize; onTyping()"
        ref="textInput"></textarea>
      <button class="btn btn-primary" @click="send" :disabled="!text.trim()" style="flex-shrink:0;padding:10px 16px">
        <fa :icon="['fas', 'paper-plane']" />
      </button>
    </div>

    <ImageLightbox :src="lightboxSrc" @close="lightboxSrc = null"/>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/api';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import ImageLightbox from '@/components/ui/ImageLightbox.vue';

const route = useRoute();
const chatStore = useChatStore();
const auth = useAuthStore();

const other      = ref(null);
const text       = ref('');
const msgBox     = ref(null);
const textInput  = ref(null);
const loading    = ref(true);
const lightboxSrc = ref(null);
let typingTimer;

const avatar  = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=1877f2&color=fff`;
const isMine  = msg => msg.sender._id === auth.user?._id || msg.sender === auth.user?._id;
const timeStr = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function dateLabel(d) {
  const date = new Date(d);
  const today = new Date();
  const diff = Math.floor((today - date) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString();
}

function showDateSep(i) {
  if (i === 0) return true;
  const prev = new Date(chatStore.messages[i - 1].createdAt);
  const curr = new Date(chatStore.messages[i].createdAt);
  return prev.toDateString() !== curr.toDateString();
}

function isLastInGroup(i) {
  const msgs = chatStore.messages;
  if (i === msgs.length - 1) return true;
  const curr = msgs[i];
  const next = msgs[i + 1];
  const currId = curr.sender._id || curr.sender;
  const nextId = next.sender._id || next.sender;
  return currId !== nextId;
}

function scrollBottom(smooth = false) {
  if (msgBox.value) {
    msgBox.value.scrollTo({ top: msgBox.value.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  }
}

onMounted(async () => {
  chatStore.messages = [];
  try {
    const [msgRes, userRes] = await Promise.all([
      api.get(`/messages/${route.params.id}`),
      api.get(`/users/${route.params.id}`)
    ]);
    chatStore.messages = msgRes.data.messages;
    other.value = userRes.data;
  } finally { loading.value = false; }
  await nextTick();
  scrollBottom();
});

watch(() => chatStore.messages.length, () => {
  nextTick(() => scrollBottom(true));
});

function send() {
  if (!text.value.trim()) return;
  chatStore.sendMessage(route.params.id, text.value.trim());
  text.value = '';
  chatStore.sendTyping(route.params.id, false);
  clearTimeout(typingTimer);
  nextTick(() => { if (textInput.value) textInput.value.style.height = 'auto'; });
}

async function sendImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('image', file);
  try {
    const { data } = await api.post('/messages/upload', fd);
    chatStore.sendMessage(route.params.id, '', data.url);
  } catch {}
  e.target.value = '';
}

function onTyping() {
  chatStore.sendTyping(route.params.id, true);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => chatStore.sendTyping(route.params.id, false), 1500);
}

function autoResize() {
  const el = textInput.value;
  if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
}
</script>
