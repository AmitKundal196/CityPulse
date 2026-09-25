const mongoose = require('mongoose');
const env = require('../config/env');
const { Complaint } = require('../models/Complaint');
const Event = require('../models/Event');

async function inspect() {
  await mongoose.connect(env.mongoUri);
  console.log('--- COMPLAINTS ---');
  const complaints = await Complaint.find().sort({ createdAt: -1 }).lean();
  console.log('Count:', complaints.length);
  complaints.forEach((c, i) => {
    console.log(`[${i}] ID=${c._id} City=${c.city} Category=${c.category} Desc="${c.description.slice(0, 40)}" Source=${c.source} Synth=${c.isSynthetic} Created=${c.createdAt}`);
  });

  console.log('\n--- COMPLAINT EVENTS ---');
  const events = await Event.find({ source: { $in: ['complaint', 'citizen', 'demo'] } }).sort({ timestamp: -1 }).lean();
  console.log('Count:', events.length);
  events.forEach((e, i) => {
    console.log(`[${i}] ID=${e._id} City=${e.city} Source=${e.source} EventType=${e.eventType} Synth=${e.isSynthetic} Status=${e.status} ComplaintId=${e.metadata?.complaintId} Time=${e.timestamp}`);
  });

  await mongoose.disconnect();
}
inspect().catch(console.error);
