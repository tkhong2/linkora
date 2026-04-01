<template>
  <div v-if="profile">
    <!-- Cover + Avatar -->
    <div class="card" style="margin-bottom:12px;overflow:hidden;padding:0">
      <div style="height:220px;background:linear-gradient(135deg,#1877f2,#0a5dc2);position:relative;overflow:hidden">
        <img v-if="profile.cover" :src="profile.cover" style="width:100%;height:100%;object-fit:cover" alt="cover"/>
        <label v-if="isOwn" style="position:absolute;bottom:10px;right:10px;cursor:pointer">
          <span class="btn btn-secondary btn-sm">
            <fa :icon="['fas', 'image']" /> Edit cover
          </span>
          <input type="file" accept="image/*" style="display:none" @change="uploadCover"/>
        </label>
      </div>
      <div style="padding:0 20px 16px;position:relative">
        <div style="display:flex;align-items:flex-end;gap:16px;margin-top:-50px;flex-wrap:wrap">
          <div style="position:relative;flex-shrink:0">
            <img :src="profile.avatar||avatar(profile.username)" class="avatar" width="100" height="100"
              style="border:4px solid var(--surface);display:block" :alt="profile.username"/>
            <label v-if="isOwn" style="position:absolute;bottom:4px;right:4px;cursor:pointer">
              <span style="background:var(--surface2);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid var(--surface);color:var(--text-muted)">
                <fa :icon="['fas', 'image']" style="font-size:12px"/>
              </span>
              <input type="file" accept="image/*" style="display:none" @change="uploadAvatar"/>
            </label>
          </div>
          <div style="flex:1;padding-bottom:4px;min-width:0;padding-top:56px">
            <h1 style="font-size:22px;font-weight:800">{{ profile.username }}</h1>
            <p style="color:var(--text-muted);font-size:14px">{{ profile.bio || 'No bio yet' }}</p>
            <div style="display:flex;gap:16px;margin-top:6px;font-size:14px;flex-wrap:wrap">
              <span><strong>{{ profile.friendCount }}</strong> friends</span>
              <span><strong>{{ profile.followerCount }}</strong> followers</span>
              <span><strong>{{ profile.followingCount }}</strong> following</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;padding-bottom:4px;align-self:flex-end">
            <template v-if="isOwn">
              <button class="btn btn-secondary" @click="editModal=true">
                <fa :icon="['fas', 'pen']" /> Edit Profile
              </button>
            </template>
            <template v-else>
              <!-- Follow -->
              <button class="btn" :class="profile.isFollowing ? 'btn-secondary' : 'btn-primary'" @click="toggleFollow">
                <fa :icon="['fas', profile.isFollowing ? 'check' : 'plus']" />
                {{ profile.isFollowing ? 'Following' : 'Follow' }}
              </button>
              <!-- Friend -->
              <button v-if="!profile.friendship" class="btn btn-secondary" @click="sendFriendRequest">
                <fa :icon="['fas', 'user-plus']" /> Add Friend
              </button>
              <button v-else-if="profile.friendship.status === 'pending' && profile.friendship.requester?._id === auth.user._id"
                class="btn btn-secondary" @click="cancelRequest">
                <fa :icon="['fas', 'xmark']" /> Cancel Request
              </button>
              <button v-else-if="profile.friendship.status === 'pending'"
                class="btn btn-primary" @click="acceptRequest">
                <fa :icon="['fas', 'check']" /> Accept Request
              </button>
              <button v-else-if="profile.friendship.status === 'accepted'"
                class="btn btn-secondary" @click="unfriend">
                <fa :icon="['fas', 'user-group']" /> Friends
              </button>
              <!-- Message -->
              <RouterLink
                v-if="profile.friendship?.status === 'accepted' || profile.isFollowing"
                :to="`/messages/${profile._id}`" class="btn btn-secondary">
                <fa :icon="['fas', 'comment-dots']" /> Message
              </RouterLink>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Posts -->
    <SkeletonPost v-if="loading" :count="2"/>
    <PostCard v-for="post in posts" :key="post._id" :post="post"
      @react="onReact" @delete="onDelete" @edit="p=>editingPost=p" @share="onShare"/>
    <div v-if="!loading && posts.length===0" class="card" style="padding:32px;text-align:center;color:var(--text-muted)">No posts yet</div>
    <div v-if="hasMore" style="text-align:center;padding:16px">
      <button class="btn btn-secondary" @click="loadMore">Load more</button>
    </div>

    <!-- Edit Profile Modal -->
    <Teleport to="body">
      <div v-if="editModal" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center" @click.self="editModal=false">
        <div class="card" style="width:100%;max-width:480px;padding:24px">
          <h3 style="font-size:18px;font-weight:700;margin-bottom:16px">Edit Profile</h3>
          <div style="margin-bottom:12px"><label style="font-size:13px;font-weight:600;color:var(--text-muted)">Username</label><input v-model="editForm.username" class="input" style="margin-top:4px"/></div>
          <div style="margin-bottom:12px"><label style="font-size:13px;font-weight:600;color:var(--text-muted)">Bio</label><textarea v-model="editForm.bio" class="input" rows="3" style="resize:none;margin-top:4px"></textarea></div>
          <div style="margin-bottom:12px"><label style="font-size:13px;font-weight:600;color:var(--text-muted)">Website</label><input v-model="editForm.website" class="input" style="margin-top:4px"/></div>
          <div style="margin-bottom:16px"><label style="font-size:13px;font-weight:600;color:var(--text-muted)">Location</label><input v-model="editForm.location" class="input" style="margin-top:4px"/></div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-secondary" @click="editModal=false">Cancel</button>
            <button class="btn btn-primary" @click="saveProfile">Save</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
  <div v-else style="text-align:center;padding:60px;color:var(--text-muted)">Loading...</div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import PostCard from '@/components/post/PostCard.vue';
import SkeletonPost from '@/components/ui/SkeletonPost.vue';

const route = useRoute();
const auth  = useAuthStore();
const toast = useToastStore();

const profile = ref(null);
const posts   = ref([]);
const loading = ref(true);
const hasMore = ref(false);
const page    = ref(1);
const editModal  = ref(false);
const editForm   = ref({});
const editingPost = ref(null);

const isOwn = computed(() => profile.value?._id === auth.user?._id);
const avatar = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'U')}&background=1877f2&color=fff`;

async function load() {
  loading.value = true;
  try {
    const [pRes, postsRes] = await Promise.all([
      api.get(`/users/${route.params.id}`),
      api.get(`/posts/user/${route.params.id}?page=1`)
    ]);
    profile.value = pRes.data;
    posts.value   = postsRes.data.posts;
    hasMore.value = postsRes.data.hasMore;
    editForm.value = { username: profile.value.username, bio: profile.value.bio, website: profile.value.website, location: profile.value.location };
  } finally { loading.value = false; }
}

onMounted(load);
watch(() => route.params.id, load);

async function loadMore() {
  const { data } = await api.get(`/posts/user/${route.params.id}?page=${page.value+1}`);
  posts.value.push(...data.posts);
  hasMore.value = data.hasMore;
  page.value++;
}

async function toggleFollow() {
  const { data } = await api.post(`/users/${profile.value._id}/follow`);
  profile.value.isFollowing = data.following;
  if (data.following) profile.value.followerCount++; else profile.value.followerCount--;
}

async function sendFriendRequest() {
  const { data } = await api.post(`/users/${profile.value._id}/friend-request`);
  profile.value.friendship = data;
  toast.success('Friend request sent!');
}

async function cancelRequest() {
  await api.delete(`/users/${profile.value._id}/friend-request`);
  profile.value.friendship = null;
}

async function acceptRequest() {
  const { data } = await api.put(`/users/${profile.value._id}/friend-request`, { action: 'accept' });
  profile.value.friendship = data;
  profile.value.friendCount++;
  toast.success('Friend request accepted!');
}

async function unfriend() {
  if (!confirm('Unfriend?')) return;
  await api.delete(`/users/${profile.value._id}/friend`);
  profile.value.friendship = null;
  profile.value.friendCount--;
}

async function saveProfile() {
  const fd = new FormData();
  Object.entries(editForm.value).forEach(([k,v]) => fd.append(k, v));
  const { data } = await api.put('/users/me', fd);
  auth.updateUser(data);
  profile.value = { ...profile.value, ...data };
  editModal.value = false;
  toast.success('Profile updated!');
}

async function uploadAvatar(e) {
  const fd = new FormData(); fd.append('avatar', e.target.files[0]);
  const { data } = await api.put('/users/me', fd);
  auth.updateUser(data); profile.value.avatar = data.avatar;
  toast.success('Avatar updated!');
}

async function uploadCover(e) {
  const fd = new FormData(); fd.append('cover', e.target.files[0]);
  const { data } = await api.put('/users/me', fd);
  profile.value.cover = data.cover;
  toast.success('Cover updated!');
}

async function onReact({ postId, type }) {
  const { data } = await api.post(`/posts/${postId}/react`, { type });
  const p = posts.value.find(p => p._id === postId);
  if (p) { p.reactionCount = data.reactionCount; p.myReaction = data.myReaction; }
}

async function onDelete(id) {
  if (!confirm('Delete?')) return;
  await api.delete(`/posts/${id}`);
  posts.value = posts.value.filter(p => p._id !== id);
}

async function onShare({ postId, caption }) {
  await api.post('/posts', { sharedFrom: postId, content: caption });
  toast.success('Shared!');
}
</script>
