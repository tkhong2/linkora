const Notification = require('../models/Notification');

async function createNotification(io, { recipient, sender, type, post = null, comment = null }) {
  if (recipient.toString() === sender.toString()) return;
  const notif = await Notification.create({ recipient, sender, type, post, comment });
  await notif.populate('sender', 'username avatar');
  io?.to(recipient.toString()).emit('notification', notif);
  return notif;
}

module.exports = { createNotification };
