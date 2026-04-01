const router = require('express').Router();
const ctrl   = require('../controllers/user.controller');
const friend = require('../controllers/friend.controller');
const follow = require('../controllers/follow.controller');
const auth   = require('../middleware/auth');
const upload = require('../utils/upload');

// Static routes FIRST (before /:id)
router.get('/search',           auth, ctrl.searchUsers);
router.get('/suggested',        auth, ctrl.getSuggested);
router.get('/me/friend-requests', auth, friend.getPendingRequests);
router.put('/me',               auth, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), ctrl.updateProfile);

// Dynamic routes
router.get('/:id',              auth, ctrl.getProfile);
router.get('/:id/followers',    auth, ctrl.getFollowers);
router.get('/:id/following',    auth, ctrl.getFollowing);
router.get('/:id/friends',      auth, ctrl.getFriends);

// Follow
router.post('/:userId/follow',  auth, follow.toggle);

// Friendship
router.post('/:userId/friend-request',   auth, friend.sendRequest);
router.put('/:userId/friend-request',    auth, friend.respondRequest);
router.delete('/:userId/friend',         auth, friend.unfriend);
router.delete('/:userId/friend-request', auth, friend.cancelRequest);

module.exports = router;
