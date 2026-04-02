const express = require('express');
const {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  rsvp
} = require('../../controllers/groups/groupEventController');
const { protect } = require('../../middleware/auth');
const router = express.Router();

router.route('/:groupId/events')
  .post(protect, createEvent)
  .get(protect, getEvents);

router.route('/:groupId/events/:eventId')
  .put(protect, updateEvent)
  .delete(protect, deleteEvent);

router.post('/:groupId/events/:eventId/rsvp', protect, rsvp);

module.exports = router;