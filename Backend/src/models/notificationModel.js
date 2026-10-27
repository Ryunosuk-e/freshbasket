const pool = require('../config/db');

const getNotificationsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT notification_id, channel, type, title, message, is_read, metadata, created_at
     FROM notifications
     WHERE recipient_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId]
  );
  return result.rows;
};

const markNotificationRead = async (notificationId, userId) => {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE notification_id = $1 AND recipient_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
};

const markAllNotificationsRead = async (userId) => {
  await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE recipient_id = $1`,
    [userId]
  );
  return true;
};

const deleteNotification = async (notificationId, userId) => {
  const result = await pool.query(
    `DELETE FROM notifications
     WHERE notification_id = $1 AND recipient_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
};

module.exports = {
  getNotificationsByUser,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
