<template>
  <div class="card" style="margin-bottom:12px;padding:12px 16px">
    <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none">
      <!-- Add story -->
      <label style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;cursor:pointer">
        <div style="position:relative">
          <img :src="auth.user?.avatar||avatar(auth.user?.username)" class="avatar" width="60" height="60" style="border:3px dashed var(--primary)" alt="add"/>
          <span style="position:absolute;bottom:0;right:0;background:var(--primary);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid var(--surface)">+</span>
        </div>
        <span style="font-size:11px;color:var(--text-muted);max-width:64px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Add story</span>
        <input type="file" accept="image/*,video/*" style="display:none" @change="addStory"/>
      </label>

      <!-- Story groups -->
      <div v-for="g in groups" :key="g.author._id"
        style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;cursor:pointer"
        @click="openGroup(g)">
        <div :class="['story-ring', g.hasUnread ? '' : 'seen']" style="padding:2px">
          <img :src="g.author.avatar||avatar(g.author.username)" class="avatar" width="56" height="56" style="border:2px solid var(--surface)" :alt="g.author.username"/>
        </div>
        <span style="font-size:11px;max-width:64px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ g.author.username }}</span>
      </div>
    </div>

    <!-- Viewer -->
    <Teleport to="body">
      <div v-if="active" style="position:fixed;inset:0;background:#000;z-index:300;display:flex;align-items:center;justify-content:center" @click.self="active=null">
        <div style="position:relative;width:100%;max-width:400px;height:100vh;max-height:700px">
          <!-- Progress -->
          <div style="display:flex;gap:3px;position:absolute;top:12px;left:12px;right:12px;z-index:1">
            <div v-for="(s,i) in active.stories" :key="s._id" style="flex:1;height:3px;background:rgba(255,255,255,.3);border-radius:2px;overflow:hidden">
              <div :style="{ height:'100%', background:'#fff', width: i<idx?'100%':i===idx?prog+'%':'0%' }"></div>
            </div>
          </div>
          <!-- Header -->
          <div style="position:absolute;top:24px;left:12px;right:12px;z-index:1;display:flex;align-items:center;gap:8px">
            <img :src="active.author.avatar||avatar(active.author.username)" class="avatar" width="36" height="36" alt=""/>
            <span style="color:#fff;font-weight:600;font-size:14px">{{ active.author.username }}</span>
            <span style="color:rgba(255,255,255,.7);font-size:12px">{{ timeAgo(active.stories[idx]?.createdAt) }}</span>
            <button @click="active=null" style="margin-left:auto;background:none;border:none;color:#fff;font-size:24px;cursor:pointer">✕</button>
          </div>
          <!-- Media -->
          <img v-if="active.stories[idx]?.mediaType!=='video'" :src="active.stories[idx]?.media" style="width:100%;height:100%;object-fit:cover;border-radius:12px" alt="story"/>
          <video v-else :src="active.stories[idx]?.media" autoplay style="width:100%;height:100%;object-fit:cover;border-radius:12px"></video>
          <!-- Caption -->
          <p v-if="active.stories[idx]?.caption" style="position:absolute;bottom:20px;left:16px;right:16px;color:#fff;font-size:15px;text-shadow:0 1px 4px rgba(0,0,0,.8);text-align:center">{{ active.stories[idx].caption }}</p>
          <!-- Nav -->
          <button @click="prev" style="position:absolute;left:0;top:0;bottom:0;width:40%;background:none;border:none;cursor:pointer"></button>
          <button @click="next" style="position:absolute;right:0;top:0;bottom:0;width:40%;background:none;border:none;cursor:pointer"></button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const props = defineProps({ groups: { type: Array, default: () => [] } });
const emit  = defineEmits(['refresh']);
const auth  = useAuthStore();
const toast = useToastStore();

const active = ref(null);
const idx    = ref(0);
const prog   = ref(0);
let timer, progTimer;
const DURATION = 5000;

const avatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'U')}&background=1877f2&color=fff`;
const timeAgo = d => { const h = Math.floor((Date.now()-new Date(d))/3600000); return h<1?'just now':`${h}h ago`; };

async function addStory(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const fd = new FormData();
    fd.append('media', file);
    await api.post('/stories', fd);
    toast.success('Story posted!');
    emit('refresh');
  } catch { toast.error('Failed to post story'); }
  e.target.value = '';
}

function openGroup(g) { active.value = g; idx.value = 0; startTimer(); }

function startTimer() {
  clearTimeout(timer); clearInterval(progTimer); prog.value = 0;
  const story = active.value?.stories[idx.value];
  if (story) api.post(`/stories/${story._id}/view`).catch(() => {});
  const start = Date.now();
  progTimer = setInterval(() => { prog.value = Math.min(((Date.now()-start)/DURATION)*100, 100); }, 50);
  timer = setTimeout(next, DURATION);
}

function next() {
  if (!active.value) return;
  if (idx.value < active.value.stories.length - 1) { idx.value++; startTimer(); }
  else { active.value = null; clearTimeout(timer); clearInterval(progTimer); }
}

function prev() {
  if (idx.value > 0) { idx.value--; startTimer(); }
}

onUnmounted(() => { clearTimeout(timer); clearInterval(progTimer); });
</script>
