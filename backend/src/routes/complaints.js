const express = require('express');
const router = express.Router();
const complaintService = require('../services/complaintService');
const { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } = require('../models/Complaint');

// GET /api/complaints/meta - Categories & statuses metadata
router.get('/complaints/meta', (req, res) => {
  res.json({
    categories: COMPLAINT_CATEGORIES,
    statuses: COMPLAINT_STATUSES
  });
});

// GET /api/complaints/summary - Complaint metrics
router.get('/complaints/summary', async (req, res, next) => {
  try {
    const { city } = req.query;
    const summary = await complaintService.getComplaintsSummary(city);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// POST /api/complaints - Create new complaint
router.post('/complaints', async (req, res, next) => {
  try {
    const { city, category, description, location, address, imageUrl } = req.body;
    const newComplaint = await complaintService.createComplaint({
      city,
      category,
      description,
      location,
      address,
      imageUrl
    });

    res.status(201).json({
      success: true,
      message: 'Citizen complaint submitted successfully',
      data: newComplaint
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/complaints - Get filtered list
router.get('/complaints', async (req, res, next) => {
  try {
    const { city, category, status, limit, skip } = req.query;
    const result = await complaintService.getComplaints({
      city,
      category,
      status,
      limit,
      skip
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/complaints/:id - Get single complaint
router.get('/complaints/:id', async (req, res, next) => {
  try {
    const complaint = await complaintService.getComplaintById(req.params.id);
    res.json(complaint);
  } catch (error) {
    next(error);
  }
});

const { requireAdminOrOperator } = require('../middleware/auth');

// PATCH /api/complaints/:id/status - Update status (Restricted to Municipal Operators & Admins)
router.patch('/complaints/:id/status', requireAdminOrOperator, async (req, res, next) => {
  try {
    const { status, resolutionNote, reopen } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const updated = await complaintService.updateComplaintStatus(req.params.id, status, {
      resolvedBy: req.user.id,
      resolutionNote,
      reopen: Boolean(reopen)
    });
    res.json({
      success: true,
      message: `Complaint status updated to ${status}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
