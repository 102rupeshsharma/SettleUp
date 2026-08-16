import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { unread, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (unread === 'true') {
      query.read = false;
    }

    const skipIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const notifications = await Notification.find(query)
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip(skipIndex);

    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, userId: req.user._id });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
