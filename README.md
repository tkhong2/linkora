# SocialNet — Mini Social Network

## Stack
- **Frontend**: Vue 3, Pinia, Vue Router, Socket.io-client, Axios
- **Backend**: Express.js, MongoDB/Mongoose, Socket.io, JWT, Multer

## Prerequisites
- Node.js 18+
- MongoDB running on `localhost:27017`

## Setup

### Backend
```bash
cd backend
npm install
# Edit .env if needed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Features
- Register / Login (JWT)
- Feed (posts from people you follow)
- Explore (all posts + user search)
- Create post with image upload
- Like (double-click image), comment, delete
- Follow / Unfollow
- Stories (24h auto-expire)
- Realtime chat with typing indicator + online status
- Realtime notifications (like, comment, follow)
- Edit profile + avatar upload
- Suggested users
- Mobile responsive + bottom nav
- Toast notifications
