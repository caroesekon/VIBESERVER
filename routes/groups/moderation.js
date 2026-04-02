const express = require('express');
const {
  reportGroup,
  getReports,
  resolveReport,
  addRule,
  updateRule,
  deleteRule
} = require('../../controllers/groups/groupModerationController');
const { protect } = require('../../middleware/auth');
const router = express.Router();

router.post('/:groupId/report', protect, reportGroup);
router.get('/:groupId/reports', protect, getReports);
router.put('/:groupId/reports/:reportId/resolve', protect, resolveReport);
router.post('/:groupId/rules', protect, addRule);
router.put('/:groupId/rules/:ruleId', protect, updateRule);
router.delete('/:groupId/rules/:ruleId', protect, deleteRule);

module.exports = router;