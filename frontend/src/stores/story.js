import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useStoryStore = defineStore('story', () => {
  const groups = ref([]);

  async function fetchStories() {
    const { data } = await api.get('/stories');
    groups.value = data;
  }

  async function createStory(file, caption = '') {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', caption);
    await api.post('/stories', fd);
    await fetchStories();
  }

  async function viewStory(storyId) {
    await api.post(`/stories/${storyId}/view`);
  }

  return { groups, fetchStories, createStory, viewStory };
});
