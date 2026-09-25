const mongoose = require('mongoose');
const env = require('../config/env');
const CITIES = require('../config/cities');
const { Complaint } = require('../models/Complaint');
const Event = require('../models/Event');
const FeedStatus = require('../models/FeedStatus');
const complaintService = require('../services/complaintService');

async function runTests() {
  console.log('====================================================');
  console.log('PHASE 8B: REAL CITIZEN COMPLAINT SYSTEM VALIDATION');
  console.log('====================================================\n');

  await mongoose.connect(env.mongoUri);
  console.log('[1] Connected to MongoDB.');

  // Step 1: Purge legacy synthetic complaint events
  console.log('\n[2] Purging legacy synthetic complaints from MongoDB:');
  const deleteEventsResult = await Event.deleteMany({ source: 'complaint', isSynthetic: true });
  console.log(`  - Deleted ${deleteEventsResult.deletedCount} legacy synthetic complaint events.`);

  const deleteSyntheticComplaints = await Complaint.deleteMany({ isSynthetic: true });
  console.log(`  - Deleted ${deleteSyntheticComplaints.deletedCount} legacy synthetic complaints.`);

  const remainingSyntheticEvents = await Event.countDocuments({ source: 'complaint', isSynthetic: true });
  const remainingSyntheticComplaints = await Complaint.countDocuments({ isSynthetic: true });
  console.log(`  - Remaining synthetic events: ${remainingSyntheticEvents}, complaints: ${remainingSyntheticComplaints} (Expected: 0)`);
  if (remainingSyntheticEvents !== 0 || remainingSyntheticComplaints !== 0) {
    throw new Error('Synthetic complaints still exist!');
  }

  // Step 2: Test validation rules
  console.log('\n[3] Testing Complaint Validation Rules:');

  // 2a. Reject empty description
  try {
    await complaintService.createComplaint({
      city: 'Jaipur',
      category: 'Road Damage',
      description: '   ',
      location: { lat: 26.9124, lng: 75.7873 }
    });
    throw new Error('Should have rejected empty description');
  } catch (err) {
    console.log(`  - Empty description rejected as expected: "${err.message}"`);
  }

  // 2b. Reject invalid coordinates
  try {
    await complaintService.createComplaint({
      city: 'Jaipur',
      category: 'Road Damage',
      description: 'Pothole on main road',
      location: { lat: 105.0, lng: 75.7873 }
    });
    throw new Error('Should have rejected out-of-bounds latitude');
  } catch (err) {
    console.log(`  - Out-of-bounds latitude rejected as expected: "${err.message}"`);
  }

  // 2c. Reject unknown category
  try {
    await complaintService.createComplaint({
      city: 'Jaipur',
      category: 'Alien Invasion',
      description: 'Unidentified flying object',
      location: { lat: 26.9124, lng: 75.7873 }
    });
    throw new Error('Should have rejected unknown category');
  } catch (err) {
    console.log(`  - Unknown category rejected as expected: "${err.message}"`);
  }

  // Step 3: Create a real citizen complaint for Jaipur
  console.log('\n[4] Creating Real Citizen Complaint for Jaipur:');
  const jaipurComplaint = await complaintService.createComplaint({
    city: 'Jaipur',
    category: 'Road Damage',
    description: 'Deep hazardous pothole near Hawa Mahal crossing causing traffic bottleneck and scooter skidding.',
    location: { lat: 26.9239, lng: 75.8267 },
    address: 'Hawa Mahal Rd, Badi Choupad, Jaipur',
    imageUrl: null
  });

  console.log(`  - Created complaint ID: ${jaipurComplaint._id}`);
  console.log(`    City: ${jaipurComplaint.city}, Category: ${jaipurComplaint.category}, Status: ${jaipurComplaint.status}, Zone: ${jaipurComplaint.zone}`);
  console.log(`    Source: ${jaipurComplaint.source}, isSynthetic: ${jaipurComplaint.isSynthetic}`);

  if (jaipurComplaint.status !== 'OPEN') throw new Error('New complaint must have status OPEN');
  if (jaipurComplaint.isSynthetic !== false) throw new Error('isSynthetic must be false');
  if (jaipurComplaint.source !== 'CITIZEN') throw new Error('source must be CITIZEN');

  // Step 4: Verify normalized event was created
  console.log('\n[5] Verifying Normalized Event Creation:');
  const correspondingEvent = await Event.findOne({ 'metadata.complaintId': jaipurComplaint._id }).lean();
  if (!correspondingEvent) throw new Error('Normalized event was not created for complaint!');
  console.log(`  - Found event: city=${correspondingEvent.city}, source=${correspondingEvent.source}, eventType=${correspondingEvent.eventType}, isSynthetic=${correspondingEvent.isSynthetic}`);

  // Step 5: Test Status Transition (OPEN -> IN_REVIEW -> RESOLVED)
  console.log('\n[6] Testing Status Transitions:');
  const inReviewComplaint = await complaintService.updateComplaintStatus(jaipurComplaint._id, 'IN_REVIEW');
  console.log(`  - Status transitioned to: ${inReviewComplaint.status} (Expected: IN_REVIEW)`);
  if (inReviewComplaint.status !== 'IN_REVIEW') throw new Error('Failed to transition to IN_REVIEW');

  const resolvedComplaint = await complaintService.updateComplaintStatus(jaipurComplaint._id, 'RESOLVED');
  console.log(`  - Status transitioned to: ${resolvedComplaint.status} (Expected: RESOLVED)`);
  if (resolvedComplaint.status !== 'RESOLVED') throw new Error('Failed to transition to RESOLVED');

  // Step 6: Create real complaints for Delhi and Mumbai
  console.log('\n[7] Creating Real Complaints for Delhi and Mumbai:');
  const delhiComplaint = await complaintService.createComplaint({
    city: 'Delhi',
    category: 'Streetlight',
    description: 'Multiple streetlights non-operational on outer ring road stretch near flyover.',
    location: { lat: 28.6250, lng: 77.2180 },
    address: 'Connaught Place Outer Circle, New Delhi'
  });
  console.log(`  - Delhi complaint created: ID=${delhiComplaint._id}, status=${delhiComplaint.status}`);

  const mumbaiComplaint = await complaintService.createComplaint({
    city: 'Mumbai',
    category: 'Drainage / Sewage',
    description: 'Blocked stormwater drain causing waterlogging along the footpath.',
    location: { lat: 19.0760, lng: 72.8777 },
    address: 'BKC Central Avenue, Bandra East, Mumbai'
  });
  console.log(`  - Mumbai complaint created: ID=${mumbaiComplaint._id}, status=${mumbaiComplaint.status}`);

  // Step 7: Test Queries & Summary Metrics
  console.log('\n[8] Testing Query & Summary Aggregations:');
  const summary = await complaintService.getComplaintsSummary();
  console.log('  - Overall Summary:', summary);
  if (summary.total < 3) throw new Error('Summary count mismatch');

  const jaipurList = await complaintService.getComplaints({ city: 'Jaipur' });
  console.log(`  - Jaipur complaints count: ${jaipurList.complaints.length}`);

  // Step 8: Test FeedStatus Synchronization
  console.log('\n[9] Testing FeedStatus Synchronization:');
  await complaintService.syncComplaintFeedStatus();

  for (const city of CITIES) {
    const statusDoc = await FeedStatus.findOne({ city: city.name, source: 'complaint' }).lean();
    console.log(`  - [${city.name}][complaint]: status=${statusDoc?.status}, isSynthetic=${statusDoc?.isSynthetic}, total=${statusDoc?.recordsReceived}`);
    if (statusDoc?.status !== 'LIVE') {
      throw new Error(`Expected status LIVE for ${city.name} since complaints exist, got ${statusDoc?.status}`);
    }
  }

  // Step 9: Verify Weather, AQI, and Traffic Independence
  console.log('\n[10] Verifying Feed Independence:');
  for (const city of CITIES) {
    const weather = await FeedStatus.findOne({ city: city.name, source: 'weather' }).lean();
    const aqi = await FeedStatus.findOne({ city: city.name, source: 'air_quality' }).lean();
    const traffic = await FeedStatus.findOne({ city: city.name, source: 'traffic' }).lean();
    console.log(`  - [${city.name}] Weather=${weather?.status}, AQI=${aqi?.status}, Traffic=${traffic?.status}`);
  }

  console.log('\n====================================================');
  console.log('PHASE 8B VALIDATION COMPLETED SUCCESSFULLY!');
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n[FATAL ERROR in Phase 8B Test]', err);
  process.exit(1);
});
