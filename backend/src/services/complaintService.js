const mongoose = require('mongoose');
const { Complaint, COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } = require('../models/Complaint');
const Event = require('../models/Event');
const FeedStatus = require('../models/FeedStatus');
const CITIES = require('../config/cities');
const { getZone } = require('../utils/zoneHelper');

/**
 * Creates a real citizen complaint, validates data, assigns municipal zone,
 * and creates a corresponding normalized Event for the real-time event pipeline.
 */
async function createComplaint(payload) {
  const { city, category, description, location, address, imageUrl } = payload;

  // 1. City validation
  const cityObj = CITIES.find(c => c.name.toLowerCase() === (city || '').toLowerCase());
  if (!cityObj) {
    const error = new Error(`Unsupported city: '${city}'. Must be Jaipur, Delhi, or Mumbai.`);
    error.status = 400;
    throw error;
  }

  // 2. Category validation
  if (!COMPLAINT_CATEGORIES.includes(category)) {
    const error = new Error(`Invalid category. Allowed: ${COMPLAINT_CATEGORIES.join(', ')}`);
    error.status = 400;
    throw error;
  }

  // 3. Description validation & sanitization
  if (!description || typeof description !== 'string' || description.trim().length < 5) {
    const error = new Error('Description is required and must be at least 5 characters');
    error.status = 400;
    throw error;
  }
  const cleanDescription = description.trim().slice(0, 2000);

  // 4. Location validation
  if (!location || typeof location !== 'object') {
    const error = new Error('Location is required. Please provide valid coordinates.');
    error.status = 400;
    throw error;
  }

  const lat = typeof location.lat === 'number' ? location.lat : parseFloat(location.lat);
  const lng = typeof location.lng === 'number' ? location.lng : parseFloat(location.lng);

  if (isNaN(lat) || !isFinite(lat) || lat < -90 || lat > 90) {
    const error = new Error(`Invalid latitude: ${location.lat}. Must be between -90 and 90.`);
    error.status = 400;
    throw error;
  }

  if (isNaN(lng) || !isFinite(lng) || lng < -180 || lng > 180) {
    const error = new Error(`Invalid longitude: ${location.lng}. Must be between -180 and 180.`);
    error.status = 400;
    throw error;
  }

  const zone = getZone(lat, lng, cityObj);

  // 5. Create Complaint record (Strictly citizen source, synthetic: false, isReal: true)
  const complaint = await Complaint.create({
    city: cityObj.name,
    category,
    description: cleanDescription,
    location: { lat, lng },
    address: address && typeof address === 'string' ? address.trim().slice(0, 250) : '',
    imageUrl: imageUrl && typeof imageUrl === 'string' ? imageUrl.trim() : null,
    status: 'OPEN',
    zone,
    source: 'citizen',
    synthetic: false,
    isReal: true,
    isSynthetic: false
  });

  // 6. Ingest into normalized Event stream
  try {
    const normalizedCategory = category.toLowerCase().replace(/[\s\/]+/g, '_');
    await Event.create({
      city: cityObj.name,
      source: 'citizen',
      eventType: normalizedCategory,
      timestamp: complaint.createdAt,
      sourceTimestamp: complaint.createdAt,
      ingestedAt: new Date(),
      latitude: lat,
      longitude: lng,
      zone,
      severity: category === 'Public Safety' || category === 'Drainage / Sewage' ? 'high' : 'medium',
      value: 1,
      unit: 'report',
      status: 'LIVE',
      metadata: {
        complaintId: complaint._id,
        category: complaint.category,
        description: complaint.description,
        address: complaint.address,
        complaintStatus: complaint.status,
        source: 'citizen',
        synthetic: false,
        isReal: true,
        isSynthetic: false
      },
      synthetic: false,
      isReal: true,
      isSynthetic: false
    });
  } catch (eventErr) {
    console.warn(`[ComplaintService] Non-fatal: could not create normalized event: ${eventErr.message}`);
  }

  // 7. Refresh feed status
  await syncComplaintFeedStatus();

  return complaint;
}

/**
 * Retrieves filtered list of complaints.
 */
async function getComplaints(filters = {}) {
  const query = { source: 'citizen', synthetic: false };

  if (filters.city && filters.city !== 'all') {
    query.city = new RegExp(`^${filters.city}$`, 'i');
  }

  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }

  if (filters.status && filters.status !== 'all') {
    query.status = filters.status.toUpperCase();
  }

  const limit = Math.min(parseInt(filters.limit, 10) || 50, 200);
  const skip = Math.max(parseInt(filters.skip, 10) || 0, 0);

  const [complaints, total] = await Promise.all([
    Complaint.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Complaint.countDocuments(query)
  ]);

  return { complaints, total, limit, skip };
}

/**
 * Retrieves a single complaint by ID.
 */
async function getComplaintById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid complaint ID format');
    error.status = 400;
    throw error;
  }

  const complaint = await Complaint.findById(id).lean();
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.status = 404;
    throw error;
  }
  return complaint;
}

/**
 * Updates a complaint's status with strict workflow validation and resolution tracking.
 * Workflow rules:
 *   OPEN -> IN_REVIEW -> RESOLVED
 *   Disallows RESOLVED -> OPEN unless explicit reopen flag is set.
 */
async function updateComplaintStatus(id, newStatus, options = {}) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid complaint ID format');
    error.status = 400;
    throw error;
  }

  const upperStatus = (newStatus || '').toUpperCase();
  if (!COMPLAINT_STATUSES.includes(upperStatus)) {
    const error = new Error(`Invalid status. Must be one of: ${COMPLAINT_STATUSES.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const existing = await Complaint.findById(id);
  if (!existing) {
    const error = new Error('Complaint not found');
    error.status = 404;
    throw error;
  }

  // Workflow enforcement:
  // Cannot transition from RESOLVED to OPEN unless explicitly authorized as a reopen action
  if (existing.status === 'RESOLVED' && upperStatus === 'OPEN' && !options.reopen) {
    const error = new Error('Cannot revert a RESOLVED complaint to OPEN. An explicit reopen action by an authorized admin is required.');
    error.status = 400;
    throw error;
  }

  const updateFields = {
    status: upperStatus
  };

  const adminId = options.resolvedBy || options.userId || 'admin-operator';
  const note = options.resolutionNote || options.note || '';

  if (upperStatus === 'RESOLVED') {
    updateFields.resolvedAt = new Date();
    updateFields.resolvedBy = adminId;
    updateFields.resolutionNote = note || 'Issue resolved and verified by municipal authority.';
  } else if (options.reopen || (existing.status === 'RESOLVED' && upperStatus !== 'RESOLVED')) {
    // If reopening a resolved complaint
    updateFields.resolvedAt = null;
    updateFields.resolutionNote = note ? `Reopened: ${note}` : 'Reopened by municipal administrator';
  } else if (note) {
    updateFields.resolutionNote = note;
  }

  // Add history record
  const historyEntry = {
    status: upperStatus,
    changedAt: new Date(),
    changedBy: adminId,
    note: note || (upperStatus === 'RESOLVED' ? updateFields.resolutionNote : `Status changed from ${existing.status} to ${upperStatus}`)
  };

  const updatedComplaint = await Complaint.findByIdAndUpdate(
    id,
    {
      $set: updateFields,
      $push: { history: historyEntry }
    },
    { new: true, runValidators: true }
  ).lean();

  // Sync status to associated event in Event stream without modifying provenance
  try {
    await Event.updateMany(
      { 'metadata.complaintId': updatedComplaint._id },
      {
        $set: {
          'metadata.complaintStatus': upperStatus,
          'metadata.resolvedAt': updatedComplaint.resolvedAt,
          'metadata.resolvedBy': updatedComplaint.resolvedBy,
          'metadata.resolutionNote': updatedComplaint.resolutionNote
        }
      }
    );
  } catch (syncErr) {
    console.warn(`[ComplaintService] Could not sync status to Event: ${syncErr.message}`);
  }

  await syncComplaintFeedStatus();

  return updatedComplaint;
}

/**
 * Returns calculated summary counts (Total, Open, In Review, Resolved, Rejected).
 */
async function getComplaintsSummary(city = null) {
  const match = { source: 'citizen', synthetic: false };
  if (city && city !== 'all') {
    match.city = new RegExp(`^${city}$`, 'i');
  }

  const counts = await Complaint.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = {
    total: 0,
    open: 0,
    inReview: 0,
    resolved: 0,
    rejected: 0
  };

  counts.forEach(c => {
    summary.total += c.count;
    if (c._id === 'OPEN') summary.open = c.count;
    else if (c._id === 'IN_REVIEW') summary.inReview = c.count;
    else if (c._id === 'RESOLVED') summary.resolved = c.count;
    else if (c._id === 'REJECTED') summary.rejected = c.count;
  });

  return summary;
}

/**
 * Synchronizes FeedStatus for each city based on actual complaint database records.
 * Rules:
 *   - DB disconnected => 'OFFLINE'
 *   - Count > 0 => 'LIVE'
 *   - Count == 0 => 'NO_REPORTS'
 */
async function syncComplaintFeedStatus() {
  const isDbConnected = mongoose.connection.readyState === 1;

  for (const cityObj of CITIES) {
    const cityName = cityObj.name;
    try {
      if (!isDbConnected) {
        await FeedStatus.findOneAndUpdate(
          { city: cityName, source: 'complaint' },
          {
            status: 'OFFLINE',
            isSynthetic: false,
            lastAttempt: new Date(),
            reasonCode: 'SOURCE_UNAVAILABLE',
            recordsReceived: 0,
            recordsAccepted: 0,
            recordsRejected: 0,
            details: { message: 'Database disconnected' }
          },
          { upsert: true }
        );
        continue;
      }

      const count = await Complaint.countDocuments({ city: cityName, source: 'citizen', synthetic: false });
      const latestComplaint = await Complaint.findOne({ city: cityName, source: 'citizen', synthetic: false })
        .sort({ createdAt: -1 })
        .lean();

      const status = count > 0 ? 'LIVE' : 'NO_REPORTS';

      await FeedStatus.findOneAndUpdate(
        { city: cityName, source: 'complaint' },
        {
          status,
          isSynthetic: false,
          lastAttempt: new Date(),
          lastSuccessfulFetch: count > 0 ? new Date() : null,
          lastSourceTimestamp: latestComplaint ? latestComplaint.createdAt : null,
          reasonCode: null,
          recordsReceived: count,
          recordsAccepted: count,
          recordsRejected: 0,
          details: {
            totalComplaints: count,
            source: 'Citizen Reports'
          }
        },
        { upsert: true }
      );
    } catch (err) {
      console.warn(`[ComplaintService] Failed to sync status for ${cityName}: ${err.message}`);
    }
  }
}

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  getComplaintsSummary,
  syncComplaintFeedStatus
};
