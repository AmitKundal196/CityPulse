// Using built-in Node 18+ global fetch

async function testWorkflow() {
  console.log('--- STARTING COMPREHENSIVE WORKFLOW & ROLE TEST ---');
  const baseUrl = 'http://localhost:5000/api';

  // 1. Fetch current complaints
  const initialRes = await fetch(`${baseUrl}/complaints`);
  const initialData = await initialRes.json();
  const initialCount = initialData.total;
  console.log(`[Step 0] Initial citizen complaints count: ${initialCount}`);

  // Find user's existing manual Jaipur complaint
  const jaipurExisting = initialData.complaints.find(c => c.city === 'Jaipur' && /fsdss/i.test(c.description));
  if (jaipurExisting) {
    console.log(`[Step 0] User's manual Jaipur complaint preserved: ID=${jaipurExisting._id}, status=${jaipurExisting.status}, source=${jaipurExisting.source}, synthetic=${jaipurExisting.synthetic}`);
    if (jaipurExisting.source !== 'citizen' || jaipurExisting.synthetic !== false) {
      throw new Error('Jaipur complaint provenance is not citizen/false!');
    }
  }

  // 2. Citizen Submits a new complaint (simulating client payload attempting to tamper status/synthetic)
  console.log('[Step 1] Citizen submits new complaint with attempted tampering (status="RESOLVED", synthetic=true)...');
  const submitRes = await fetch(`${baseUrl}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      city: 'Delhi',
      category: 'Garbage / Waste',
      description: 'Severe garbage accumulation near bus terminal',
      location: { lat: 28.6139, lng: 77.2090 },
      address: 'Central Terminal, Delhi',
      status: 'RESOLVED', // Attempted tamper!
      synthetic: true,    // Attempted tamper!
      isSynthetic: true   // Attempted tamper!
    })
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Submission failed: ${err}`);
  }
  const submitResult = await submitRes.json();
  const newComplaint = submitResult.data;
  console.log(`[Step 1 PASS] Complaint created: ID=${newComplaint._id}, status=${newComplaint.status}, source=${newComplaint.source}, synthetic=${newComplaint.synthetic}`);
  
  if (newComplaint.status !== 'OPEN') {
    throw new Error(`Server failed to enforce status="OPEN"! Got: ${newComplaint.status}`);
  }
  if (newComplaint.source !== 'citizen' || newComplaint.synthetic !== false) {
    throw new Error(`Server failed to enforce citizen provenance!`);
  }

  // 3. Citizen Refreshes (fetches) -> still OPEN
  console.log('[Step 2] Citizen refreshes complaints list...');
  const refresh1Res = await fetch(`${baseUrl}/complaints`);
  const refresh1Data = await refresh1Res.json();
  const fetchedAfterSubmit = refresh1Data.complaints.find(c => c._id === newComplaint._id);
  if (!fetchedAfterSubmit || fetchedAfterSubmit.status !== 'OPEN') {
    throw new Error(`Expected complaint to be OPEN after refresh! Got: ${fetchedAfterSubmit?.status}`);
  }
  console.log(`[Step 2 PASS] After refresh, complaint status is strictly: ${fetchedAfterSubmit.status}`);

  // 4. Citizen tries to change status -> rejected with 403 Forbidden!
  console.log('[Step 3] Citizen attempts to update status without admin credentials...');
  const unauthorizedRes = await fetch(`${baseUrl}/complaints/${newComplaint._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'citizen'
    },
    body: JSON.stringify({ status: 'RESOLVED' })
  });

  console.log(`[Step 3] Unauthorized response status code: ${unauthorizedRes.status}`);
  if (unauthorizedRes.status !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden, but got: ${unauthorizedRes.status}`);
  }
  const unauthData = await unauthorizedRes.json();
  console.log(`[Step 3 PASS] Backend correctly rejected citizen with 403: "${unauthData.error}"`);

  // Verify complaint remains OPEN
  const verifyStillOpen = await (await fetch(`${baseUrl}/complaints/${newComplaint._id}`)).json();
  if (verifyStillOpen.status !== 'OPEN') {
    throw new Error(`Complaint was mutated despite 403! Status: ${verifyStillOpen.status}`);
  }

  // 5. Admin opens complaint -> moves OPEN -> IN_REVIEW
  console.log('[Step 4] Municipal Operator initiates triage: OPEN -> IN_REVIEW...');
  const inReviewRes = await fetch(`${baseUrl}/complaints/${newComplaint._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'municipal_operator',
      'x-user-id': 'OP-DELHI-102'
    },
    body: JSON.stringify({
      status: 'IN_REVIEW',
      resolutionNote: 'Assigned to Sector 4 sanitation squad'
    })
  });

  if (!inReviewRes.ok) {
    const err = await inReviewRes.text();
    throw new Error(`Failed to move to IN_REVIEW: ${err}`);
  }
  const inReviewData = await inReviewRes.json();
  console.log(`[Step 4 PASS] Complaint moved to IN_REVIEW: ID=${inReviewData.data._id}, status=${inReviewData.data.status}`);
  if (inReviewData.data.status !== 'IN_REVIEW') {
    throw new Error(`Expected IN_REVIEW, got: ${inReviewData.data.status}`);
  }

  // 6. Admin resolves complaint -> RESOLVED
  console.log('[Step 5] Municipal Operator marks complaint RESOLVED with resolution note...');
  const resolveRes = await fetch(`${baseUrl}/complaints/${newComplaint._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'municipal_operator',
      'x-user-id': 'OP-DELHI-102'
    },
    body: JSON.stringify({
      status: 'RESOLVED',
      resolutionNote: 'Garbage cleared completely by sanitary truck #12; bin sanitized.'
    })
  });

  if (!resolveRes.ok) {
    const err = await resolveRes.text();
    throw new Error(`Failed to resolve: ${err}`);
  }
  const resolveData = await resolveRes.json();
  console.log(`[Step 5 PASS] Complaint resolved: status=${resolveData.data.status}, resolvedAt=${resolveData.data.resolvedAt}, resolvedBy=${resolveData.data.resolvedBy}, resolutionNote="${resolveData.data.resolutionNote}"`);
  
  if (resolveData.data.status !== 'RESOLVED') {
    throw new Error(`Expected RESOLVED, got: ${resolveData.data.status}`);
  }
  if (!resolveData.data.resolvedAt || !resolveData.data.resolvedBy || !resolveData.data.resolutionNote) {
    throw new Error(`Missing resolution audit metadata!`);
  }

  // 7. Verify invalid transition: RESOLVED -> OPEN without explicit reopen flag
  console.log('[Step 6] Admin attempts illegal reversion RESOLVED -> OPEN without reopen flag...');
  const illegalRevertRes = await fetch(`${baseUrl}/complaints/${newComplaint._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'admin'
    },
    body: JSON.stringify({ status: 'OPEN' }) // No reopen: true
  });
  console.log(`[Step 6] Illegal revert response status: ${illegalRevertRes.status}`);
  if (illegalRevertRes.status !== 400) {
    throw new Error(`Expected HTTP 400 for illegal RESOLVED -> OPEN reversion, got: ${illegalRevertRes.status}`);
  }
  console.log(`[Step 6 PASS] Backend blocked illegal reversion from RESOLVED to OPEN.`);

  // 8. Citizen views complaint -> sees RESOLVED
  console.log('[Step 7] Citizen views complaint...');
  const citizenViewRes = await fetch(`${baseUrl}/complaints/${newComplaint._id}`);
  const citizenViewData = await citizenViewRes.json();
  console.log(`[Step 7 PASS] Citizen sees status=${citizenViewData.status}, resolutionNote="${citizenViewData.resolutionNote}"`);
  if (citizenViewData.status !== 'RESOLVED') {
    throw new Error(`Citizen did not see RESOLVED status!`);
  }

  // 9. Verify Events stream reflects status and preserves provenance
  console.log('[Step 8] Verifying Events page data...');
  const eventsRes = await fetch(`${baseUrl}/events?source=complaint`);
  const eventsData = await eventsRes.json();
  const eventRecord = eventsData.events.find(e => e.metadata?.complaintId === newComplaint._id);
  if (!eventRecord) {
    throw new Error('Associated Event not found in event stream!');
  }
  console.log(`[Step 8 PASS] Event found: source=${eventRecord.source}, synthetic=${eventRecord.synthetic}, isSynthetic=${eventRecord.isSynthetic}, complaintStatus=${eventRecord.metadata?.complaintStatus}`);
  if (eventRecord.source !== 'citizen' || eventRecord.synthetic !== false || eventRecord.isSynthetic !== false) {
    throw new Error('Event provenance was corrupted!');
  }
  if (eventRecord.metadata?.complaintStatus !== 'RESOLVED') {
    throw new Error(`Event complaintStatus was not synced! Got: ${eventRecord.metadata?.complaintStatus}`);
  }

  // 10. Check Jaipur manual complaint is still REAL & OPEN
  if (jaipurExisting) {
    const jaipurCheck = await (await fetch(`${baseUrl}/complaints/${jaipurExisting._id}`)).json();
    console.log(`[Step 9 PASS] Jaipur manual complaint still intact: status=${jaipurCheck.status}, source=${jaipurCheck.source}, synthetic=${jaipurCheck.synthetic}`);
    if (jaipurCheck.status !== 'OPEN' || jaipurCheck.source !== 'citizen' || jaipurCheck.synthetic !== false) {
      throw new Error('Jaipur manual complaint was altered!');
    }
  }

  console.log('\n=============================================');
  console.log('ALL WORKFLOW, ROLE, AND SECURITY TESTS PASSED!');
  console.log('=============================================');
}

testWorkflow().catch(err => {
  console.error('\nTEST FAILED:', err.message);
  process.exit(1);
});
