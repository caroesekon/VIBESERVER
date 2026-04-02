const GroupEvent = require('../../models/groups/GroupEvent');
const GroupMember = require('../../models/groups/GroupMember');

// @desc    Create group event
// @route   POST /api/groups/events/:groupId/events
const createEvent = async (req, res) => {
  try {
    const { title, description, location, startTime, endTime } = req.body;
    const groupId = req.params.groupId;

    // Check if user is admin
    const member = await GroupMember.findOne({ group: groupId, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!member) {
      return res.status(403).json({ success: false, message: 'Only admins can create events' });
    }

    const event = await GroupEvent.create({
      group: groupId,
      createdBy: req.user._id,
      title,
      description,
      location,
      startTime,
      endTime
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get group events
// @route   GET /api/groups/events/:groupId/events
const getEvents = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const events = await GroupEvent.find({ group: groupId })
      .sort({ startTime: 1 })
      .populate('createdBy', 'name avatar')
      .lean();

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update event
// @route   PUT /api/groups/events/:groupId/events/:eventId
const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await GroupEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check admin
    const member = await GroupMember.findOne({ group: event.group, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!member) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, description, location, startTime, endTime } = req.body;
    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;

    await event.save();
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete event
// @route   DELETE /api/groups/events/:groupId/events/:eventId
const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await GroupEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const member = await GroupMember.findOne({ group: event.group, user: req.user._id, role: { $in: ['admin', 'owner'] } });
    if (!member) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await event.deleteOne();
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    RSVP to event
// @route   POST /api/groups/events/:groupId/events/:eventId/rsvp
const rsvp = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body; // 'going' or 'interested'

    const event = await GroupEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if already RSVP'd, update
    const existing = event.rsvps.find(r => r.user.toString() === req.user._id.toString());
    if (existing) {
      existing.status = status;
    } else {
      event.rsvps.push({ user: req.user._id, status });
    }

    await event.save();
    res.json({ success: true, message: `RSVP set to ${status}` });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  rsvp
};