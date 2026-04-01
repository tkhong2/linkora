<template>
  <div class="card" style="margin-bottom:16px;padding:12px 16px">
    <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none">

      <!-- Add story -->
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0">
        <label style="cursor:pointer;position:relative">
          <img :src="auth.user?.avatar || `https://ui-avatars.com/api/?name=${auth.user?.username}&background=6366f1&color=fff`"
            class="avatar" width="56" height="56" style="border:2px dashed var(--primary)" alt="add story" />
          <span style="position:absolute;bottom:0;right:0;background:var(--primary);color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff">+</span>
          <input type="file" accept="image/*" style="display:none" @change="onAddStory" />
        </label>
        <span style="font-size:11px;color:var(--text-muted);max-width:56px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Your story</span>
      </div>

      <!-- Story groups -->
      <div v-for="group in storyStore.groups" :key="group.author._id"
        style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;cursor:pointer"
        @click="openGroup(group)">
        <div :style="{
          padding: '2px',
          borderRadius: '50%',
          background: group.hasUnread ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'var(--border)'
        }">
          <img :src="group.author.avatar || `https://ui-avatars.com/api/?name=${group.author.username}&background=6366f1&color=fff`"
            class="avatar" width="52" height="52" style="border:2px solid #fff" :alt="group.author.username" />
        </div>
        <span style="font-size:11px;max-width:56px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ group.author.username }}</span>
      </div>
    </div>

    <!-- Story Viewer Modal -->
    <Teleport to="body">
      <div v-if="activeGroup" style="position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:200;display:flex;align-items:center;justify-content:center"
        @click.self="closeViewer">
        <div style="position:relative;max-width:400px;width:100%;max-height:90vh">
          <!-- Progress bars -->
          <div style="display:flex;gap:4px;padding:12px;position:absolute;top:0;left:0;right:0;z-index:1">
            <div v-for="(s, i) in activeGroup.stories" :key="s._id"
              style="flex:1;height:3px;background:rgba(255,255,255,.4);border-radius:2px;overflow:hidden">
              <div :style="{
                height: '100%',
                background: '#fff',
                width: i < activeIndex ? '100%' : i === activeIndex ? progress + '%' : '0%',
                transition: i === activeIndex ? 'none' : 'none'
              }"></div>
            </div>
          </div>

          <!-- Author -->
          <div style="position:absolute;top:28px;left:12px;right:12px;z-index:1;display:flex;align-items:center;gap:8px">
            <img :src="activeGroup.author.avatar || `https://ui-avatars.com/api/?name=${activeGroup.author.username}&background=6366f1&color=fff`"
              class="avatar" width="34" height="34" :alt="activeGroup.author.username" />
            <span style="color:#fff;font-weight:600;font-size:14px">{{ activeGroup.author.username }}</span>
            <span style="color:rgba(255,255,255,.7);font-size:12px">{{ timeAgo(activeGroup.stories[activeIndex]?.createdAt) }}</span>
            <button @click="closeViewer" style="margin-left:auto;background:none;border:none;color:#fff;font-size:22px">✕</button>
          </div>

          <!-- Image -->
          <img :src="activeGroup.stories[activeIndex]?.image" style="width:100%;border-radius:12px;max-height:80vh;object-fit:cover" alt="story" />

          <!-- Caption -->
          <p v-if="activeGroup.stories[activeIndex]?.caption"
            style="position:absolute;bottom:16px;left:16px;right:16px;color:#fff;font-size:14px;text-shadow:0 1px 4px rgba(0,0,0,.8)">
            {{ activeGroup.stories[activeIndex].caption }}
          </p>

          <!-- Nav -->
          <button @click="prev" style="position:absolute;left:0;top:0;bottom:0;width:40%;background:none;border:none;cursor:pointer"></button>
          <button @click="next" style="position:absolute;right:0;top:0;bottom:0;width:40%;background:none;border:none;cursor:pointer"></button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { useStoryStore } from '@/stores/story';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const storyStore = useStoryStore();
const auth = useAuthStore();
const toast = useToastStore();

const activeGroup = ref(null);
const activeIndex = ref(0);
const progress = ref(0);
let timer = null;
let progressTimer = null;

const STORY_DURATION = 5000;

async function onAddStory(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    await storyStore.createStory(file);
    toast.success('Story posted!');
  } catch {
    toast.error('Failed to post story');
  }
  e.target.value = '';
}

function openGroup(group) {
  activeGroup.value = group;
  activeIndex.value = 0;
  startTimer();
}

function closeViewer() {
  activeGroup.value = null;
  clearTimers();
}

function startTimer() {
  clearTimers();
  progress.value = 0;
  const story = activeGroup.value?.stories[activeIndex.value];
  if (story) storyStore.viewStory(story._id);

  const start = Date.now();
  progressTimer = setInterval(() => {
    progress.value = Math.min(((Date.now() - start) / STORY_DURATION) * 100, 100);
  }, 50);

  timer = setTimeout(() => next(), STORY_DURATION);
}

function next() {
  if (!activeGroup.value) return;
  if (activeIndex.value < activeGroup.value.stories.length - 1) {
    activeIndex.value++;
    startTimer();
  } else {
    closeViewer();
  }
}

function prev() {
  if (activeIndex.value > 0) {
    activeIndex.value--;
    startTimer();
  }
}

function clearTimers() {
  clearTimeout(timer);
  clearInterval(progressTimer);
}

onUnmounted(clearTimers);

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date);
  const hrs = Math.floor(diff / 3600000);
  return hrs < 1 ? 'just now' : `${hrs}h ago`;
}
</script>
