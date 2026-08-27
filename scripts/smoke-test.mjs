#!/usr/bin/env node

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runSmokeTests() {
  console.log(`\n================ NyayaNetra Smoke Test Suite ================`);
  console.log(`Targeting backend at: ${BASE_URL}\n`);

  let passCount = 0;
  let failCount = 0;

  // Test 1: Auth Login
  let session = null;
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        badge_id: 'KA-02-7777',
        password: 'password123'
      })
    });

    if (loginRes.ok) {
      session = await loginRes.json();
      if (session && session.user && session.profile) {
        console.log(`[PASS] 1. Auth Login: Successfully logged in as ${session.profile.full_name} (${session.profile.badge_id})`);
        passCount++;
      } else {
        console.error(`[FAIL] 1. Auth Login: Unexpected session structure`, session);
        failCount++;
      }
    } else {
      const errText = await loginRes.text();
      console.error(`[FAIL] 1. Auth Login HTTP ${loginRes.status}: ${errText}`);
      failCount++;
    }
  } catch (err) {
    console.error(`[FAIL] 1. Auth Login Exception:`, err.message);
    failCount++;
  }

  // Fetch a case ID for conversation and messages
  let testCaseId = null;
  let testConversationId = null;
  try {
    const casesRes = await fetch(`${BASE_URL}/api/cases`);
    if (casesRes.ok) {
      const cases = await casesRes.json();
      if (cases && cases.length > 0) {
        testCaseId = cases[0].id || cases[0]._id;
      }
    }

    if (session && session.user) {
      const convRes = await fetch(`${BASE_URL}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: testCaseId,
          user_id: session.user.id,
          title: 'Smoke Test Conversation'
        })
      });
      if (convRes.ok) {
        const conv = await convRes.json();
        testConversationId = conv.id || conv._id;
      }
    }
  } catch (err) {
    console.warn(`[WARN] Setup for message test failed:`, err.message);
  }

  // Test 2: AI Message Generation (RAG)
  try {
    const msgRes = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: testConversationId || 'smoke-test-conv',
        case_id: testCaseId || 'case-1784704530759',
        content: 'Summarize the active suspects in this case.',
        language: 'en'
      })
    });

    if (msgRes.ok) {
      const msgData = await msgRes.json();
      const asst = msgData.assistantMessage || msgData;
      const answer = asst.content || asst.answer;
      const confidence = asst.confidence_score ?? asst.confidenceScore;
      const cited = asst.cited_record_ids || asst.citedRecordIds;

      const hasAnswer = typeof answer === 'string' && answer.length > 0;
      const hasConfidence = typeof confidence === 'number' || typeof confidence === 'string';
      const hasCited = Array.isArray(cited);

      if (hasAnswer && hasConfidence && hasCited) {
        console.log(`[PASS] 2. AI Messages (RAG): Generated response with confidence ${confidence}% and ${cited.length} citations.`);
        passCount++;
      } else {
        console.error(`[FAIL] 2. AI Messages (RAG): Missing expected fields in response:`, {
          hasAnswer,
          hasConfidence,
          hasCited,
          data: msgData
        });
        failCount++;
      }
    } else {
      const errText = await msgRes.text();
      console.error(`[FAIL] 2. AI Messages HTTP ${msgRes.status}: ${errText}`);
      failCount++;
    }
  } catch (err) {
    console.error(`[FAIL] 2. AI Messages Exception:`, err.message);
    failCount++;
  }

  // Test 3: Advanced Console Execute (Semantic Search)
  try {
    const advRes = await fetch(`${BASE_URL}/api/advanced/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'chatbot',
        subFeature: 'semantic_search',
        query: 'Malleshwaram Gold Burglary heist',
        caseId: testCaseId || 'case-1784704530759'
      })
    });

    if (advRes.ok) {
      const advData = await advRes.json();
      console.log(`[PASS] 3. Advanced Execute (Semantic Search): Received response.`);
      console.log(`   Raw Output Preview:`, JSON.stringify(advData, null, 2).slice(0, 300) + '...');
      passCount++;
    } else {
      const errText = await advRes.text();
      console.error(`[FAIL] 3. Advanced Execute HTTP ${advRes.status}: ${errText}`);
      failCount++;
    }
  } catch (err) {
    console.error(`[FAIL] 3. Advanced Execute Exception:`, err.message);
    failCount++;
  }

  console.log(`\n--------------------------------------------------------------`);
  console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED (Total: ${passCount + failCount})`);
  console.log(`--------------------------------------------------------------\n`);

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSmokeTests();
