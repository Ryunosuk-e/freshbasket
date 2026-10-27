const {
  getNotificationsByUser,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require('../models/notificationModel');

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await getNotificationsByUser(req.user.userId);
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    return res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    console.error('getMyNotifications error:', err);
    return res.status(500).json({ message: 'Could not fetch mail.' });
  }
};

const markRead = async (req, res) => {
  try {
    const notification = await markNotificationRead(req.params.id, req.user.userId);
    if (!notification) {
      return res.status(404).json({ message: 'Mail item not found.' });
    }
    return res.status(200).json({ notification });
  } catch (err) {
    console.error('markRead error:', err);
    return res.status(500).json({ message: 'Could not update mail.' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await markAllNotificationsRead(req.user.userId);
    return res.status(200).json({ message: 'All mail marked as read.' });
  } catch (err) {
    console.error('markAllRead error:', err);
    return res.status(500).json({ message: 'Could not update mail.' });
  }
};

const deleteMail = async (req, res) => {
  try {
    const deleted = await deleteNotification(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Mail item not found.' });
    }
    return res.status(200).json({ message: 'Mail item deleted successfully.' });
  } catch (err) {
    console.error('deleteMail error:', err);
    return res.status(500).json({ message: 'Could not delete mail.' });
  }
};

module.exports = { getMyNotifications, markRead, markAllRead, deleteMail };
