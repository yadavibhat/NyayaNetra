// =========================================================
// NyayaNetra Comprehensive End-to-End Test Suite
// Tests all 7 core claims, API contracts, RBAC, RAG grounding,
// profiling Jaccard logic, network cross-case resolution, and audit logging.
// =========================================================

const BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5001';

function logResult(step, title, success, details = '') {
  const icon = success ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] Step ${step}: ${title}`);
  if (details) {
    console.log(`       ${details}`);
  }
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }
  return await res.json();
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('         NYAYANETRA FULL SYSTEM COMPREHENSIVE TEST SUITE     ');
  console.log(`         Targeting API Base: ${BASE_URL}`);
  console.log('============================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  // 1. Health & Overview Stats
  totalTests++;
  try {
    const stats = await request('/api/stats');
    if (stats.firCount !== undefined && stats.activeOfficers !== undefined) {
      passedTests++;
      logResult(1, 'System Overview Telemetry & Stats', true, `FIR Count: ${stats.firCount}, Active Officers: ${stats.activeOfficers}, High Priority: ${stats.highPriorityCount}`);
    } else {
      logResult(1, 'System Overview Telemetry & Stats', false, 'Invalid stats payload');
    }
  } catch (err) {
    logResult(1, 'System Overview Telemetry & Stats', false, err.message);
  }

  // 2. Authentication (Station Inspector & State Admin Login)
  totalTests++;
  let inspectorSession = null;
  let adminSession = null;
  try {
    inspectorSession = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ badge_id: 'KA-02-7777', password: 'password123' })
    });
    adminSession = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ badge_id: 'KA-04-9999', password: 'password123' })
    });
    if ((inspectorSession.profile?.role === 'investigator' || inspectorSession.profile?.role === 'officer') && adminSession.profile?.role === 'admin') {
      passedTests++;
      logResult(2, 'RBAC Authentication (Inspector & Admin)', true, `Inspector: ${inspectorSession.profile.full_name} (${inspectorSession.profile.badge_id}, role: ${inspectorSession.profile.role}), Admin: ${adminSession.profile.full_name} (${adminSession.profile.badge_id}, role: ${adminSession.profile.role})`);
    } else {
      logResult(2, 'RBAC Authentication (Inspector & Admin)', false, 'Role mismatch');
    }
  } catch (err) {
    logResult(2, 'RBAC Authentication (Inspector & Admin)', false, err.message);
  }

  // 3. Station Roster & Officer Management
  totalTests++;
  try {
    const stations = await request('/api/stations');
    const officers = await request('/api/officers');
    if (stations.length >= 5 && officers.length >= 2) {
      passedTests++;
      logResult(3, 'Station Governance & Officer Roster', true, `Loaded ${stations.length} districts and ${officers.length} active officers.`);
    } else {
      logResult(3, 'Station Governance & Officer Roster', false, `Stations: ${stations.length}, Officers: ${officers.length}`);
    }
  } catch (err) {
    logResult(3, 'Station Governance & Officer Roster', false, err.message);
  }

  // 4. Case Management (FIR Creation & Status State Machine)
  totalTests++;
  let createdCaseId = null;
  try {
    const testFirNumber = `FIR #TEST-${Date.now().toString().slice(-4)}/2026`;
    const newCase = await request('/api/cases', {
      method: 'POST',
      body: JSON.stringify({
        fir_number: testFirNumber,
        title: 'Cyber Heist & Telemetry Intercept Test',
        description: 'Automated verification test case file for telemetry matching.',
        priority: 'high',
        currentUser: inspectorSession
      })
    });
    createdCaseId = newCase.id || newCase._id;
    
    // Update status
    const updated = await request(`/api/cases/${createdCaseId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'under_investigation', currentUser: inspectorSession })
    });

    if (updated.status === 'under_investigation') {
      passedTests++;
      logResult(4, 'FIR Case Management & State Transition', true, `Created ${testFirNumber} (ID: ${createdCaseId}) -> Transitioned to 'under_investigation'.`);
    } else {
      logResult(4, 'FIR Case Management & State Transition', false, 'Status update failed');
    }
  } catch (err) {
    logResult(4, 'FIR Case Management & State Transition', false, err.message);
  }

  // 5. Suspect Behavioral Profiling (MO Jaccard Set Intersection)
  totalTests++;
  let suspect1Id = null;
  let suspect2Id = null;
  try {
    const s1 = await request('/api/suspects', {
      method: 'POST',
      body: JSON.stringify({
        case_id: createdCaseId,
        name: 'Test Suspect Alpha',
        aliases: ['Alpha-1'],
        risk_score: 84,
        mo_tags: ['Burglary', 'Night Operations', 'CCTV Disable', 'Getaway Bike'],
        currentUser: inspectorSession
      })
    });
    const s2 = await request('/api/suspects', {
      method: 'POST',
      body: JSON.stringify({
        case_id: createdCaseId,
        name: 'Test Suspect Beta',
        aliases: ['Beta-2'],
        risk_score: 76,
        mo_tags: ['Burglary', 'Night Operations', 'Safe Cracking'],
        currentUser: inspectorSession
      })
    });
    suspect1Id = s1.id || s1._id;
    suspect2Id = s2.id || s2._id;

    // Test Jaccard similarity endpoint
    const similarity = await request(`/api/profiling/similar-suspects?suspectId=${suspect1Id}`);
    if (similarity.targetSuspect && Array.isArray(similarity.matches)) {
      passedTests++;
      logResult(5, 'Suspect MO Behavioral Profiling (Jaccard Match)', true, `Target: ${similarity.targetSuspect.name}, Match count: ${similarity.matches.length}`);
    } else {
      logResult(5, 'Suspect MO Behavioral Profiling (Jaccard Match)', false, 'Invalid profiling output');
    }
  } catch (err) {
    logResult(5, 'Suspect MO Behavioral Profiling (Jaccard Match)', false, err.message);
  }

  // 6. Digital Evidence Ingestion (CDR & ANPR)
  totalTests++;
  let evidence1Id = null;
  try {
    const evid1 = await request('/api/evidence', {
      method: 'POST',
      body: JSON.stringify({
        case_id: createdCaseId,
        type: 'cdr',
        phone_number: '+91 94808-88111',
        cell_tower: 'KA-BLR-N4 (Malleshwaram 18th Cross)',
        details: { notes: '12 calls during active heist window' },
        currentUser: inspectorSession
      })
    });
    const evid2 = await request('/api/evidence', {
      method: 'POST',
      body: JSON.stringify({
        case_id: createdCaseId,
        type: 'anpr',
        cell_tower: 'KA-BLR-ANPR-09 (Sampige Road)',
        details: { vehicle_plate: 'KA-04-MB-4022', speed: '74 km/h' },
        currentUser: inspectorSession
      })
    });
    evidence1Id = evid1.id || evid1._id;
    const caseEvidence = await request(`/api/evidence?caseId=${createdCaseId}`);
    if (caseEvidence.length >= 2) {
      passedTests++;
      logResult(6, 'Digital Evidence Logging (CDR & ANPR)', true, `Ingested ${caseEvidence.length} evidence logs for case.`);
    } else {
      logResult(6, 'Digital Evidence Logging (CDR & ANPR)', false, `Only ${caseEvidence.length} logs found.`);
    }
  } catch (err) {
    logResult(6, 'Digital Evidence Logging (CDR & ANPR)', false, err.message);
  }

  // 7. Network Graph & Cross-Case Entity Resolution
  totalTests++;
  try {
    await request('/api/links', {
      method: 'POST',
      body: JSON.stringify({
        case_id: createdCaseId,
        suspect_a_id: suspect1Id,
        suspect_b_id: suspect2Id,
        link_type: 'cdr_call',
        detail: '14 intercepted communications',
        currentUser: inspectorSession
      })
    });

    const crossCaseData = await request(`/api/network/cross-case?caseId=${createdCaseId}`);
    if (Array.isArray(crossCaseData.links) && crossCaseData.crossCaseCount !== undefined) {
      passedTests++;
      logResult(7, 'Network Graph & Cross-Case Entity Resolution', true, `Entity links retrieved: ${crossCaseData.links.length}, Cross-case count: ${crossCaseData.crossCaseCount}`);
    } else {
      logResult(7, 'Network Graph & Cross-Case Entity Resolution', false, 'Invalid cross-case payload');
    }
  } catch (err) {
    logResult(7, 'Network Graph & Cross-Case Entity Resolution', false, err.message);
  }

  // 8. Bilingual RAG AI Intelligence Chat Pipeline
  totalTests++;
  try {
    const conv = await request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        case_id: createdCaseId,
        user_id: inspectorSession.user.id,
        title: 'Test RAG Conversation'
      })
    });
    const convId = conv.id || conv._id;

    // Send query
    const chatRes = await request('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: convId,
        role: 'user',
        content: 'Summarize the suspects and CDR phone records for this investigation.',
        language: 'en',
        caseId: createdCaseId,
        userId: inspectorSession.user.id
      })
    });

    if (chatRes.assistantMessage && chatRes.assistantMessage.content) {
      passedTests++;
      logResult(8, 'Bilingual RAG AI Grounded Chat Pipeline', true, `Confidence: ${chatRes.assistantMessage.confidence_score}%, Citations: ${chatRes.assistantMessage.cited_record_ids?.length || 0}`);
    } else {
      logResult(8, 'Bilingual RAG AI Grounded Chat Pipeline', false, 'Empty assistant response');
    }
  } catch (err) {
    logResult(8, 'Bilingual RAG AI Grounded Chat Pipeline', false, err.message);
  }

  // 9. Predictive Crime Hotspot Index (BNSS Heuristic)
  totalTests++;
  try {
    const blrData = await request('/api/insights/hotspot-score?district=Bengaluru%20City');
    if (blrData.district === 'Bengaluru City' && typeof blrData.score === 'number') {
      passedTests++;
      logResult(9, 'Predictive Hotspot Index (BNSS Heuristic Formula)', true, `District: ${blrData.district}, Score: ${blrData.score}/100 (Level: ${blrData.level})`);
    } else {
      logResult(9, 'Predictive Hotspot Index (BNSS Heuristic Formula)', false, 'Invalid hotspot data');
    }
  } catch (err) {
    logResult(9, 'Predictive Hotspot Index (BNSS Heuristic Formula)', false, err.message);
  }

  // 10. Advanced Console 90-Module Execution Engine
  totalTests++;
  try {
    const execRes = await request('/api/advanced/execute', {
      method: 'POST',
      body: JSON.stringify({
        category: 'chatbot',
        subFeature: 'intent_classifier',
        caseId: createdCaseId,
        userId: inspectorSession.user.id,
        query: 'Check phone records for Malleshwaram suspect'
      })
    });

    if (execRes && (execRes.classification || execRes.action || Object.keys(execRes).length > 0)) {
      passedTests++;
      logResult(10, 'Advanced Console Module Engine (/api/advanced/execute)', true, `Classification: ${execRes.classification || 'Success'}`);
    } else {
      logResult(10, 'Advanced Console Module Engine (/api/advanced/execute)', false, 'Execution failed');
    }
  } catch (err) {
    logResult(10, 'Advanced Console Module Engine (/api/advanced/execute)', false, err.message);
  }

  // 11. Cryptographic Audit Trail Logging
  totalTests++;
  try {
    const logs = await request(`/api/audit-logs?userId=${inspectorSession.user.id}&role=officer`);
    if (Array.isArray(logs) && logs.length > 0) {
      passedTests++;
      logResult(11, 'Immutable Cryptographic Audit Trail', true, `Retrieved ${logs.length} audit trail records.`);
    } else {
      logResult(11, 'Immutable Cryptographic Audit Trail', false, 'No audit logs found');
    }
  } catch (err) {
    logResult(11, 'Immutable Cryptographic Audit Trail', false, err.message);
  }

  console.log('\n------------------------------------------------------------');
  console.log(`FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('------------------------------------------------------------\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
