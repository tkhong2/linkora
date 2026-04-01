import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getSocket } from '@/socket';

export const useChatStore = defineStore('chat', () => {
  const onlineUsers = ref([]);
  const typingUsers = ref({});
  const messages    = ref([]);

  function isOnline(userId) { return onlineUsers.value.includes(userId?.toString()); }

  function listen() {
    const s = getSocket();
    if (!s) return;
    s.on('online_users',   ids  => { onlineUsers.value = ids; });
    s.on('user_status',    ({ userId, online }) => {
      if (online) { if (!onlineUsers.value.includes(userId)) onlineUsers.value.push(userId); }
      else onlineUsers.value = onlineUsers.value.filter(id => id !== userId);
    });
    s.on('receive_message', msg  => { messages.value.push(msg); });
    s.on('message_sent',    msg  => { messages.value.push(msg); });
    s.on('user_typing',     ({ userId, isTyping }) => { typingUsers.value[userId] = isTyping; });
    s.on('messages_seen',   ({ by }) => {
      messages.value.forEach(m => { if (m.sender?._id !== by) m.seen = true; });
    });
  }

  function sendMessage(receiverId, content, image = '') {
    getSocket()?.emit('send_message', { receiverId, content, image });
  }

  function sendTyping(receiverId, isTyping) {
    getSocket()?.emit('typing', { receiverId, isTyping });
  }

  return { onlineUsers, typingUsers, messages, isOnline, listen, sendMessage, sendTyping };
});
