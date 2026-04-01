import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  { path: '/login',    component: () => import('@/views/auth/Login.vue'),    meta: { guest: true } },
  { path: '/register', component: () => import('@/views/auth/Register.vue'), meta: { guest: true } },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '',              name: 'feed',          component: () => import('@/views/Feed.vue') },
      { path: 'explore',       name: 'explore',       component: () => import('@/views/Explore.vue') },
      { path: 'profile/:id',   name: 'profile',       component: () => import('@/views/Profile.vue') },
      { path: 'messages',      name: 'messages',      component: () => import('@/views/Messages.vue') },
      { path: 'messages/:id',  name: 'chat',          component: () => import('@/views/Chat.vue') },
      { path: 'notifications', name: 'notifications', component: () => import('@/views/Notifications.vue') },
      { path: 'friends',       name: 'friends',       component: () => import('@/views/Friends.vue') },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach(to => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login';
  if (to.meta.guest && auth.isLoggedIn) return '/';
});

export default router;
