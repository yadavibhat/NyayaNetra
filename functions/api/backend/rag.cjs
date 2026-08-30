const crypto = require('crypto');
const { embedText, cosineSimilarity } = require('./utils/embeddings.cjs');
const { Store } = require('./store.cjs');

const TOP_K = 8;

const IndianPoliceCrimeKB = [
  {
    keywords: /bns|ipc|law|bhartiya|bhara|sanhita/i,
    title: "Bharatiya Nyaya Sanhita (BNS) & IPC Reference",
    en: "The Bharatiya Nyaya Sanhita (BNS) replaced the Indian Penal Code (IPC) on July 1, 2024. Key sections include:\n- Section 103 (Murder, formerly IPC 302)\n- Section 303 (Theft, formerly IPC 378/379)\n- Section 318 (Cheating, formerly IPC 420)\n- Section 74 (Assault on woman, formerly IPC 354). All case files register offences under these new acts.",
    kn: "ಭಾರತೀಯ ನ್ಯಾಯ ಸಂಹಿತೆ (BNS) ಭಾರತೀಯ ದಂಡ ಸಂಹಿತೆಯನ್ನು (IPC) ಜುಲೈ 1, 2024 ರಿಂದ ಬದಲಾಯಿಸಿದೆ. ಪ್ರಮುಖ ಸೆಕ್ಷನ್‌ಗಳು:\n- ಸೆಕ್ಷನ್ 103 (ಕೊಲೆ, ಹಳೆಯ IPC 302)\n- ಸೆಕ್ಷನ್ 303 (ಕಳ್ಳತನ, ಹಳೆಯ IPC 378/379)\n- ಸೆಕ್ಷನ್ 318 (ವಂಚನೆ, ಹಳೆಯ IPC 420)\n- ಸೆಕ್ಷನ್ 74 (ಮಹಿಳೆಯ ಮೇಲಿನ ದೌರ್ಜನ್ಯ, ಹಳೆಯ IPC 354)."
  },
  {
    keywords: /bnss|crpc|arrest|bail|warrant|rights/i,
    title: "Police Arrest, Bail & Investigation Procedures (BNSS/CrPC)",
    en: "Under the Bharatiya Nagarik Suraksha Sanhita (BNSS, formerly CrPC), key guidelines specify:\n- Section 35 (Arrest procedure & rights of the arrested person)\n- Section 438/482 (Anticipatory bail applications)\n- Section 173 (Compulsory registration of FIR, including e-FIR option). Investigators must log all digitised audit data securely.",
    kn: "ಭಾರತೀಯ ನಾಗರಿಕ ಸುರಕ್ಷಾ ಸಂಹಿತೆ (BNSS) ಅಡಿಯಲ್ಲಿ ತನಿಖಾ ನಿಯಮಗಳು:\n- ಸೆಕ್ಷನ್ 35 (ಬಂಧನದ ಪ್ರಕ್ರಿಯೆ ಮತ್ತು ಹಕ್ಕುಗಳು)\n- ಸೆಕ್ಷನ್ 438/482 (ಮುಂಗಡ ಜಾಮೀನು ಅರ್ಜಿಗಳು)\n- ಸೆಕ್ಷನ್ 173 (ಎಫ್‌ಐಆರ್ ಕಡ್ಡಾಯ ದಾಖಲಾತಿ, ಇ-ಎಫ್‌ಐಆರ್ ಸೌಲಭ್ಯ)."
  },
  {
    keywords: /bsa|evidence|admissibility|65b|section 63/i,
    title: "Digital Evidence Admissibility (BSA & Indian Evidence Act)",
    en: "The Bharatiya Sakshya Adhiniyam (BSA, formerly Indian Evidence Act) defines digital evidence rules:\n- Section 63 (Admissibility of electronic records, replacing IPC Section 65B)\n- Requires a signed digital certificate from the officer in charge to authenticate phone records (CDR), ANPR logs, or server logs in court.",
    kn: "ಭಾರತೀಯ ಸಾಕ್ಷ್ಯ ಅಧಿನಿಯಮ (BSA) ಅಡಿಯಲ್ಲಿ ಡಿಜಿಟಲ್ ಸಾಕ್ಷ್ಯಗಳ ನಿಯಮಗಳು:\n- ಸೆಕ್ಷನ್ 63 (ಎಲೆಕ್ಟ್ರಾನಿಕ್ ದಾಖಲೆಗಳ ಸ್ವೀಕಾರಾರ್ಹತೆ, ಹಳೆಯ 65B ಬದಲಿಗೆ)\n- ಕರೆ ದಾಖಲೆಗಳು (CDR), ಕ್ಯಾಮೆರಾ ದಾಖಲೆಗಳನ್ನು ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಸಾಬೀತುಪಡಿಸಲು ಅಧಿಕಾರಿಯ ಸಹಿ ಇರುವ ಡಿಜಿಟಲ್ ಪ್ರಮಾಣಪತ್ರ ಅಗತ್ಯವಿದೆ."
  },
  {
    keywords: /cyber|phishing|scam|fraud|jamtara|online/i,
    title: "Cyber Crime Trends in India",
    en: "Common cyber crimes in India include:\n- Phishing and financial OTP frauds\n- Aadhaar Enabled Payment System (AePS) scams\n- Part-time job task frauds. Karnataka State Police runs the 1930 Cyber helpline for instant banking freezes.",
    kn: "ಭಾರತದಲ್ಲಿನ ಸೈಬರ್ ಅಪರಾಧದ ಪ್ರಮುಖ ಪ್ರವೃತ್ತಿಗಳು:\n- ಫಿಶಿಂಗ್ ಮತ್ತು ಒಟಿಪಿ (OTP) ಬ್ಯಾಂಕಿಂಗ್ ವಂಚನೆಗಳು\n- ಆಧಾರ ಪಾವತಿ ವ್ಯವಸ್ಥೆ (AePS) ವಂಚನೆಗಳು\n- ಪಾರ್ಟ್-ಟೈಮ್ ಕೆಲಸದ ಆಮಿಷದ ವಂಚನೆಗಳು. ಕರ್ನಾಟಕ ಪೊಲೀಸ್ ತಕ್ಷಣದ ಹಣ ತಡೆಹಿಡಿಯಲು 1930 ಸಹಾಯವಾಣಿ ನಡೆಸುತ್ತಿದೆ."
  },
  {
    keywords: /karnataka|police|scrb|dgp|bangalore|commissioner/i,
    title: "Karnataka State Police Administration",
    en: "Karnataka State Police is governed by the Police Act and led by the DGP & IGP. Major units include:\n- SCRB (State Crime Records Bureau) managing CCTNS data\n- CID (Criminal Investigation Department) for complex financial/homicide crimes\n- Cyber Police wings in major Commissionerates.",
    kn: "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಆಡಳಿತ ವ್ಯವಸ್ಥೆ:\n- ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಮುಖ್ಯಸ್ಥರು ಡಿಜಿಪಿ ಮತ್ತು ಐಜಿಪಿ ಆಗಿರುತ್ತಾರೆ.\n- ಎಸ್‌ಸಿಆರ್‌ಬಿ (SCRB) ರಾಜ್ಯದ ಅಪರಾಧ ದಾಖಲೆಗಳನ್ನು ನಿರ್ವಹಿಸುತ್ತದೆ.\n- ಸಿಐಡಿ (CID) ಸಂಕೀರ್ಣ ಅಪರಾಧಗಳ ತನಿಖೆ ನಡೆಸುತ್ತದೆ."
  }
];

// In-memory map to store the most recent prompt and completion strings for Token Meter
const lastAIExecutionMap = new Map();

// Helper for deterministic JSON serialization with sorted keys (for forensic SHA-256 dossier hash)
function deterministicStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(deterministicStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + deterministicStringify(obj[k])).join(',') + '}';
}

async function generateLocalAIResponse(query, caseId, language = 'en', options = {}) {
  const scope = (typeof options === 'object' ? options.scope : options) || 'this_case';
  const isCrossCase = scope === 'all_my_cases';

  const cases = await Store.getCases();
  const allSuspects = await Store.getSuspects(isCrossCase ? null : caseId);
  const allEvidence = await Store.getEvidence(isCrossCase ? null : caseId);
  const allLinks = await Store.getLinks(isCrossCase ? null : caseId);

  const targetCase = cases.find(c => c.id === caseId || c._id?.toString() === caseId) || cases[0];
  const groqApiKey = process.env.GROQ_API_KEY;

  if (targetCase && groqApiKey) {
    console.log('Routing RAG query to Groq Cloud API with local multilingual semantic top-k retrieval...');
    try {
      const caseIdStr = targetCase.id || targetCase._id?.toString();
      
      const candidateSuspects = isCrossCase ? allSuspects : allSuspects.filter(s => s.case_id === caseIdStr);
      const candidateEvidence = isCrossCase ? allEvidence : allEvidence.filter(e => e.case_id === caseIdStr);
      const candidateLinks = isCrossCase ? allLinks : allLinks.filter(l => l.case_id === caseIdStr);

      // Embed user query with local model (with fallback)
      let queryVec = [];
      try {
        queryVec = await embedText(query, true);
      } catch (embErr) {
        console.warn('Query embedding generation failed, using keyword fallback:', embErr.message);
      }
      const queryLower = query.toLowerCase();

      const scoredCandidates = [];

      // 1. Score Suspects
      for (const s of candidateSuspects) {
        const id = s.id || s._id?.toString();
        const textSummary = `Suspect: ${s.name} | Aliases: ${s.aliases?.join(' ') || ''} | Risk: ${s.risk_score || 0}%`;
        let score = 0;
        if (queryVec && queryVec.length > 0 && s.embedding && s.embedding.length === queryVec.length) {
          score = Math.max(0, cosineSimilarity(queryVec, s.embedding));
        } else {
          const terms = queryLower.split(/\s+/).filter(t => t.length > 1);
          const matched = terms.filter(t => textSummary.toLowerCase().includes(t)).length;
          score = terms.length ? matched / terms.length : 0.5;
        }
        scoredCandidates.push({
          id,
          type: 'suspect',
          item: s,
          score,
          label: `${s.name} (${s.risk_score || 0}% Risk)`
        });
      }

      // 2. Score Evidence Records
      for (const e of candidateEvidence) {
        const id = e.id || e._id?.toString();
        const detailsStr = e.details?.notes || JSON.stringify(e.details || {});
        const textSummary = `Evidence Type: ${e.type} | Phone: ${e.phone_number || ''} | Cell Tower: ${e.cell_tower || ''} | Details: ${detailsStr}`;
        let score = 0;
        if (queryVec && queryVec.length > 0 && e.embedding && e.embedding.length === queryVec.length) {
          score = Math.max(0, cosineSimilarity(queryVec, e.embedding));
        } else {
          const terms = queryLower.split(/\s+/).filter(t => t.length > 1);
          const matched = terms.filter(t => textSummary.toLowerCase().includes(t)).length;
          score = terms.length ? matched / terms.length : 0.5;
        }
        scoredCandidates.push({
          id,
          type: 'evidence',
          item: e,
          score,
          label: `${e.type.toUpperCase()}: ${e.phone_number || e.cell_tower || 'Record'}`
        });
      }

      // 3. Score Suspect Links
      for (const l of candidateLinks) {
        const id = l.id || l._id?.toString();
        const textSummary = `Suspect Association: ${l.link_type} | Detail: ${l.detail || ''}`;
        let score = 0;
        if (queryVec && queryVec.length > 0 && l.embedding && l.embedding.length === queryVec.length) {
          score = Math.max(0, cosineSimilarity(queryVec, l.embedding));
        } else {
          const terms = queryLower.split(/\s+/).filter(t => t.length > 1);
          const matched = terms.filter(t => textSummary.toLowerCase().includes(t)).length;
          score = terms.length ? matched / terms.length : 0.5;
        }
        scoredCandidates.push({
          id,
          type: 'link',
          item: l,
          score,
          label: `Link: ${l.link_type} (${l.detail || 'Association'})`
        });
      }

      // Sort by similarity descending & select TOP_K (8)
      scoredCandidates.sort((a, b) => b.score - a.score);
      const topKScored = scoredCandidates.slice(0, TOP_K);

      const topSuspects = topKScored.filter(c => c.type === 'suspect').map(c => c.item);
      const topEvidence = topKScored.filter(c => c.type === 'evidence').map(c => c.item);
      const topLinks = topKScored.filter(c => c.type === 'link').map(c => c.item);

      // Fallback to case defaults if nothing was retrieved
      const finalSuspects = topSuspects.length ? topSuspects : candidateSuspects.slice(0, 4);
      const finalEvidence = topEvidence.length ? topEvidence : candidateEvidence.slice(0, 4);
      const finalLinks = topLinks.length ? topLinks : candidateLinks.slice(0, 4);

      const systemPrompt = language === 'kn'
        ? `ನೀವು ನ್ಯಾಯನೇತ್ರ, ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ತನಿಖಾ ಸಹಾಯಕರಾಗಿದ್ದೀರಿ.
ನಿಮ್ಮ ಕೆಲಸವೆಂದರೆ ಒದಗಿಸಲಾದ ದತ್ತಸಂಚಯ ಮಾಹಿತಿಯನ್ನು (retrieved context) ಮಾತ್ರ ಬಳಸಿಕೊಂಡು ಬಳಕೆದಾರರ ಪ್ರಶ್ನೆಗೆ ನೇರ, ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಸ್ಪಷ್ಟ ಉತ್ತರವನ್ನು ನೀಡುವುದು.
ನಿಯಮಗಳು:
1. ಆಧಾರ (Grounding): ಒದಗಿಸಲಾದ ಮಾಹಿತಿಯಲ್ಲಿರುವ ಸತ್ಯಗಳನ್ನು ಮಾತ್ರ ಬಳಸಿ ಉತ್ತರಿಸಿ. ಉತ್ತರ ಸಿಗದಿದ್ದರೆ, "ನನ್ನ ಬಳಿ ಈ ಮಾಹಿತಿ ಇಲ್ಲ" ಎಂದು ಹೇಳಿ.
2. ಸಂಕ್ಷಿಪ್ತತೆ (Brevity): ಉತ್ತರವು ಸುಲಭವಾಗಿ ಓದಲು ಸಾಧ್ಯವಾಗುವಂತೆ ಸಂಕ್ಷಿಪ್ತವಾಗಿ (2-4 ಸಾಲುಗಳು ಅಥವಾ ಬುಲೆಟ್‌ಗಳಲ್ಲಿ) ಇರಲಿ.
3. ಉಲ್ಲೇಖಗಳು (Citations): ನೀವು ನೀಡುವ ಪ್ರತಿ ಸಾಕ್ಷ್ಯಕ್ಕೂ ಆ ದಾಖಲೆಯ ID ಯನ್ನು [Record ID] ರೂಪದಲ್ಲಿ ಉಲ್ಲೇಖಿಸಿ.
4. ಭಾಷೆ (Language): ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಉತ್ತರವನ್ನು ಕನ್ನಡ ಭಾಷೆ ಮತ್ತು ಕನ್ನಡ ಲಿಪಿಯಲ್ಲಿಯೇ ನೀಡಿ.`
        : `You are NyayaNetra, an AI Copilot for the Karnataka State Police.
Your job is to answer the user's question using ONLY the provided database context.
Rules:
1. Grounding: Answer the question using ONLY the facts present in the retrieved context. If the answer cannot be found in the context, state that you do not have that information and refuse to answer.
2. Brevity & Conciseness: Keep your response CONCISE, DIRECT, and BRIEF (maximum 2 to 4 bullet points or short sentences). Avoid lengthy explanations or preambles.
3. Citations: Cite the record IDs (which are UUIDs or ObjectIDs provided in the context) for any facts you mention. Format citations as [Record ID].
4. Language: Respond in English.`;

      const formattedContext = `
Case Profile:
- ID: ${caseIdStr}
- FIR Number: ${targetCase.fir_number}
- Title: ${targetCase.title}
- Description: ${targetCase.description || 'N/A'}
- Status: ${targetCase.status}
- Priority: ${targetCase.priority}

Suspects Roster:
${finalSuspects.map(s => `- ID: ${s.id || s._id} | Name: ${s.name} | Aliases: ${s.aliases?.join(', ') || 'None'} | Risk Score: ${s.risk_score || 0}%`).join('\n') || 'None'}

Evidence Records:
${finalEvidence.map(e => `- ID: ${e.id || e._id} | Type: ${e.type} | Phone: ${e.phone_number || 'N/A'} | Cell Tower: ${e.cell_tower || 'N/A'} | Notes: ${e.details?.notes || JSON.stringify(e.details || {})}`).join('\n') || 'None'}

Suspect Network Links:
${finalLinks.map(l => `- ID: ${l.id || l._id} | Suspect 1 ID: ${l.suspect_a_id || l.suspect_a_id || l.suspect_id_1} | Suspect 2 ID: ${l.suspect_b_id || l.suspect_id_2} | Type: ${l.link_type} | Detail: ${l.detail || 'N/A'}`).join('\n') || 'None'}
`;

      // Multi-Turn Memory: Load last 6 messages from current conversation
      let historyMessages = [];
      if (options.conversationId) {
        try {
          const priorMsgs = await Store.getMessages(options.conversationId);
          // Take previous turns (excluding current query if already saved)
          const relevantPrior = priorMsgs
            .filter(m => m.content && m.content.trim() !== query.trim())
            .slice(-6);

          let totalChars = 0;
          const formattedHistory = [];
          // Build backwards to keep recent turns under 3000 chars limit
          for (let i = relevantPrior.length - 1; i >= 0; i--) {
            const m = relevantPrior[i];
            const charLen = m.content.length;
            if (totalChars + charLen <= 3000) {
              formattedHistory.unshift({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
              });
              totalChars += charLen;
            }
          }
          historyMessages = formattedHistory;
        } catch (hErr) {
          console.warn('Failed to load conversation history:', hErr.message);
        }
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: `Retrieved case context:\n${formattedContext}\n\nUser Question: ${query}` }
          ],
          temperature: 0.1,
          max_tokens: 400
        })
      });

      if (response.ok) {
        const resJson = await response.json();
        const answerText = resJson.choices?.[0]?.message?.content || "No response received from model.";
        
        // Record prompt & completion text for Token Meter
        const fullPromptText = `${systemPrompt}\n${formattedContext}\n${query}`;
        lastAIExecutionMap.set(caseIdStr || 'default', { promptText: fullPromptText, completionText: answerText, timestamp: Date.now() });
        lastAIExecutionMap.set('default', { promptText: fullPromptText, completionText: answerText, timestamp: Date.now() });

        // Extract cited IDs
        const citedRecordIds = [];
        const allIds = [caseIdStr, ...finalSuspects.map(s => s.id || s._id?.toString()), ...finalEvidence.map(e => e.id || e._id?.toString()), ...finalLinks.map(l => l.id || l._id?.toString())];
        allIds.forEach(id => {
          if (id && answerText.includes(id)) {
            citedRecordIds.push(id);
          }
        });

        const retrievedRecords = topKScored.map(r => ({
          id: r.id,
          type: r.type,
          score: Math.round(r.score * 100),
          label: r.label
        }));

        return {
          answer: answerText,
          confidenceScore: 95,
          citedRecordIds,
          retrievedRecords,
          explainability: {
            systemPrompt,
            formattedContext
          }
        };
      } else {
        console.error('Groq API failed:', await response.text());
      }
    } catch (err) {
      console.error('Failed to query Groq, falling back to local NLP templates:', err);
    }
  }

  const queryLower = query.toLowerCase();

  // 1. Check Indian Law & Police Knowledge Base first
  let kbMatch = null;
  for (const entry of IndianPoliceCrimeKB) {
    if (entry.keywords.test(queryLower)) {
      kbMatch = entry;
      break;
    }
  }

  const isGeneralIndiaPoliceCrimeQuery = /india|crime|police|procedure|law|court|criminal|lawyer|bns|bnss|bsa|ipc|crpc|ಸಾಕ್ಷ್ಯ|ಕಾನೂನು|ಅಪರಾಧ/i.test(queryLower);

  // 2. Keyword Intents classification (supporting both English and Kannada keywords)
  const isSuspectQuery = /suspect|who|person|people|offender|risk|aliases|ಶಂಕಿತರು|ಯಾರು|ವ್ಯಕ್ತಿ|ಹೆಸರು|ರೋಸ್ಟರ್/i.test(queryLower);
  const isCdrQuery = /cdr|call|phone|mobile|number|tower|signal|ಮೊಬೈಲ್|ಫೋನ್|ಕರೆ|ಕನೆಕ್ಷನ್|ಟವರ್|ಕಾಲ್|ನಂಬರ್/i.test(queryLower);
  const isNetworkQuery = /network|link|connection|relationship|associate|ಲಿಂಕ್|ಸಂಬಂಧ|ಸಂಪರ್ಕ|ನೆಟ್‌ವರ್ಕ್/i.test(queryLower);
  const isSummaryQuery = /summary|overview|details|fir|briefing|ಸಾರಾಂಶ|ಮಾಹಿತಿ|ಪ್ರಕರಣ/i.test(queryLower);
  const isGenericCaseQuery = /case|file|fir|record|data|info|pratishtha|ವರದಿ|ದಾಖಲೆ|ಪ್ರಕರಣ|ಸಹಾಯ/i.test(queryLower);

  // 2. Entity Extraction
  const matchedSuspects = allSuspects.filter(s => 
    queryLower.includes(s.name.toLowerCase()) || 
    s.aliases.some(a => queryLower.includes(a.toLowerCase()))
  );

  const matchedEvidence = allEvidence.filter(e => 
    (e.phone_number && queryLower.includes(e.phone_number)) ||
    (e.cell_tower && queryLower.includes(e.cell_tower.toLowerCase()))
  );

  // 3. Check for out-of-scope queries
  const isOutOfScope = !isSuspectQuery && !isCdrQuery && !isNetworkQuery && !isSummaryQuery && !isGenericCaseQuery && matchedSuspects.length === 0 && matchedEvidence.length === 0;

  // 4. Document Retrieval
  let citations = [];
  let answer = "";
  let confidenceScore = 85;

  // targetCase already resolved at top
  if (!targetCase) {
    return {
      answer: language === 'kn' 
        ? "ದತ್ತಸಂಚಯದಲ್ಲಿ ಯಾವುದೇ ಸಕ್ರಿಯ ಪ್ರಕರಣ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಹೊಸ ಪ್ರಕರಣವನ್ನು ದಾಖಲಿಸಿ." 
        : "No active case found in the database. Please register a case file to run queries.",
      confidenceScore: 0,
      citedRecordIds: []
    };
  }

  citations.push(targetCase.id || targetCase._id.toString());

  // NLP synthesis block
  if (language === 'kn') {
    if (kbMatch) {
      confidenceScore = 98;
      answer = `ಉಲ್ಲೇಖ: ${kbMatch.title}\n\n${kbMatch.kn}`;
    } else if (isGeneralIndiaPoliceCrimeQuery) {
      confidenceScore = 90;
      answer = "ಭಾರತೀಯ ಕಾನೂನು ಜಾರಿ ಮತ್ತು ಅಪರಾಧ ತನಿಖಾ ಉಲ್ಲೇಖ:\n- ಭಾರತದಲ್ಲಿ ಜುಲೈ 2024 ರಿಂದ ಹೊಸ ಕಾನೂನುಗಳು (BNS, BNSS, BSA) ಜಾರಿಗೆ ಬಂದಿವೆ.\n- ಡಿಜಿಟಲ್ ಸಾಕ್ಷ್ಯಗಳನ್ನು (ಕರೆ ದಾಖಲೆಗಳು ಮತ್ತು ವಾಹನ ಪ್ಲೇಟ್ ಸ್ಕ್ಯಾನ್) ಬಿಎಸ್ಎ ಸೆಕ್ಷನ್ 63 ಅಡಿಯಲ್ಲಿ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಸಲ್ಲಿಸಬಹುದು.\n- ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗೆ 'BNS', 'BNSS', 'BSA', ಅಥವಾ 'ಸೈಬರ್ ಅಪರಾಧ' ಎಂದು ಪ್ರಶ್ನಿಸಿ.";
    } else if (isOutOfScope) {
      confidenceScore = 100;
      answer = "ನಾನು ಸುರಕ್ಷಿತ ತನಿಖಾ ಸಹಾಯಕರಾಗಿದ್ದೇನೆ. ಸಕ್ರಿಯ ಪ್ರಕರಣದ ಮಾಹಿತಿ (FIR), ಶಂಕಿತರ ವಿವರಗಳು, ಫೋನ್ ಕರೆ ದಾಖಲೆಗಳು (CDR) ಅಥವಾ ವಾಹನ ಕ್ಯಾಮೆರಾ (ANPR) ಸಾಕ್ಷ್ಯಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮಾತ್ರ ನಾನು ಉತ್ತರಿಸಬಲ್ಲೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ತನಿಖೆಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.";
    } else if (isSuspectQuery) {
      if (matchedSuspects.length > 0) {
        confidenceScore = 95;
        answer = `ಪ್ರಕರಣದಲ್ಲಿ ಪತ್ತೆಯಾದ ಶಂಕಿತರ ವಿವರಗಳು ಹೀಗಿವೆ:\n`;
        matchedSuspects.forEach(s => {
          const idStr = s.id || s._id.toString();
          citations.push(idStr);
          const relatedLinks = allLinks.filter(l => l.suspect_a_id === idStr || l.suspect_b_id === idStr);
          answer += `• ${s.name} (ಇತರ ಹೆಸರುಗಳು: ${s.aliases?.join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ'}) ಅವರ ಅಪಾಯದ ಪ್ರಮಾಣ ${s.risk_score || 'ಮಾಪನ ಮಾಡಲಾಗಿಲ್ಲ'}% ಆಗಿದೆ.\n`;
          if (relatedLinks.length > 0) {
            answer += `  └─ ಸಂಪರ್ಕಗಳು: ಈ ಪ್ರಕರಣದಲ್ಲಿ ಇತರ ಶಂಕಿತರೊಂದಿಗೆ ${relatedLinks.length} ಸಂಪರ್ಕಗಳನ್ನು ಹೊಂದಿದ್ದಾರೆ.\n`;
          }
        });
      } else {
        confidenceScore = 80;
        if (allSuspects.length > 0) {
          answer = `ಪ್ರಕರಣ ${targetCase.fir_number} ಗೆ ಸಂಬಂಧಿಸಿದ ಶಂಕಿತರ ವಿವರಗಳು:\n`;
          allSuspects.forEach(s => {
            citations.push(s.id || s._id.toString());
            answer += `• ${s.name} (ಅಪಾಯದ ಶ್ರೇಣಿ: ${s.risk_score || 'ಮಾಪನ ಮಾಡಲಾಗಿಲ್ಲ'}%) - ಇತರ ಹೆಸರುಗಳು: ${s.aliases?.join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ'}\n`;
          });
        } else {
          answer = `ಪ್ರಕರಣ ${targetCase.fir_number} ಗೆ ಯಾವುದೇ ಶಂಕಿತರ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿಲ್ಲ.`;
        }
      }
    } else if (isCdrQuery) {
      if (matchedEvidence.length > 0) {
        confidenceScore = 95;
        answer = `ಕರೆ ದಾಖಲೆಗಳು (CDR) ವಿವರಗಳು:\n`;
        matchedEvidence.forEach(e => {
          citations.push(e.id || e._id.toString());
          answer += `• [${e.type.toUpperCase()}] ನಂಬರ್ ${e.phone_number || 'ಲಭ್ಯವಿಲ್ಲ'} ಟವರ್ ${e.cell_tower || 'ಲಭ್ಯವಿಲ್ಲ'} ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಪತ್ತೆಯಾಗಿದೆ. ಸಮಯ: ${new Date(e.captured_at).toLocaleString('kn-IN')}.\n`;
        });
      } else {
        confidenceScore = 75;
        if (allEvidence.length > 0) {
          answer = `ಪ್ರಕರಣ ${targetCase.fir_number} ರ ಕರೆ ಮತ್ತು ಫೋನ್ ದಾಖಲೆಗಳು:\n`;
          allEvidence.slice(0, 5).forEach(e => {
            citations.push(e.id || e._id.toString());
            answer += `• ಫೋನ್ ನಂಬರ್: ${e.phone_number || 'ಲಭ್ಯವಿಲ್ಲ'} ಟವರ್ ${e.cell_tower || 'ಟವರ್ ವ್ಯಾಪ್ತಿ'} (${e.type.toUpperCase()})\n`;
          });
          if (allEvidence.length > 5) {
            answer += `ಮತ್ತು ಇತರ ${allEvidence.length - 5} ದಾಖಲೆಗಳು ಲಭ್ಯವಿವೆ.`;
          }
        } else {
          answer = `ಪ್ರಕರಣ ${targetCase.fir_number} ಗೆ ಯಾವುದೇ ಕರೆ ಅಥವಾ ಫೋನ್ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ.`;
        }
      }
    } else if (isNetworkQuery) {
      if (allLinks.length > 0) {
        confidenceScore = 90;
        answer = `ಶಂಕಿತರ ನಡುವಿನ ಸಂಪರ್ಕಗಳು ಮತ್ತು ಜಾಲಬಂಧ:\n`;
        allLinks.forEach(l => {
          citations.push(l.id || l._id.toString());
          const suspA = allSuspects.find(s => (s.id || s._id.toString()) === l.suspect_a_id);
          const suspB = allSuspects.find(s => (s.id || s._id.toString()) === l.suspect_b_id);
          const nameA = suspA ? suspA.name : 'ಅಪರಿಚಿತ';
          const nameB = suspB ? suspB.name : 'ಅಪರಿಚಿತ';
          answer += `• ಸಂಪರ್ಕ: ${nameA} <-> ${nameB} ಅವರ ನಡುವೆ ${l.link_type === 'cdr_call' ? 'ಫೋನ್ ಕರೆ' : 'ಸಹವರ್ತಿ ಜಾಲಬಂಧ'} ಸಂಪರ್ಕ ಕಂಡುಬಂದಿದೆ (${l.detail || 'ಹೆಚ್ಚಿನ ವಿವರಗಳಿಲ್ಲ'}).\n`;
        });
      } else {
        answer = `ಪ್ರಕರಣ ${targetCase.fir_number} ರ ಶಂಕಿತರ ನಡುವೆ ಯಾವುದೇ ಸಂಬಂಧಗಳನ್ನು ಮ್ಯಾಪ್ ಮಾಡಲಾಗಿಲ್ಲ.`;
      }
    } else {
      confidenceScore = 88;
      const suspRoster = allSuspects.map(s => s.name).join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ';
      answer = `ಪ್ರಕರಣದ ಕಾರ್ಯಾಂಗ ಸಾರಾಂಶ (FIR ${targetCase.fir_number}):\n`;
      answer += `• ಶೀರ್ಷಿಕೆ: ${targetCase.title}\n`;
      answer += `• ಸ್ಥಿತಿ: ${targetCase.status === 'open' ? 'ಮುಕ್ತವಾಗಿದೆ' : 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ'} | ಆದ್ಯತೆ: ${targetCase.priority === 'high' ? 'ಹೆಚ್ಚು' : 'ಸಾಧಾರಣ'}\n`;
      answer += `• ವಿವರಣೆ: ${targetCase.description || 'ಪ್ರಕರಣದ ವಿವರಣೆಯನ್ನು ನಮೂದಿಸಲಾಗಿಲ್ಲ.'}\n`;
      answer += `• ಶಂಕಿತರ ಪಟ್ಟಿ: ${allSuspects.length} ಶಂಕಿತರನ್ನು ಗುರುತಿಸಲಾಗಿದೆ (${suspRoster}).\n`;
      answer += `• ದಾಖಲೆಗಳು: ${allEvidence.length} ಫೋನ್/ಕ್ಯಾಮೆರಾ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಲಾಗಿದೆ.`;
    }
  } else {
    // English Synthesis
    if (kbMatch) {
      confidenceScore = 98;
      answer = `Reference: ${kbMatch.title}\n\n${kbMatch.en}`;
    } else if (isGeneralIndiaPoliceCrimeQuery) {
      confidenceScore = 90;
      answer = "Indian Law Enforcement and Crime Reference:\n- The newly enacted laws (BNS, BNSS, BSA) govern all police investigations in India since July 2024.\n- Digital evidence (like CDR call records and ANPR camera logs) is admissible in court under BSA Section 63.\n- For general inquiries, you can query specific topics such as 'BNS', 'BNSS', 'BSA', 'Karnataka Police', or 'Cyber Crime'.";
    } else if (isOutOfScope) {
      confidenceScore = 100;
      answer = "I am a secure, grounded police intelligence assistant. I can only answer queries related to the active case file records (FIR), suspect roster profiles, phone call records (CDR), or vehicle license plate cameras (ANPR). Please ask a question related to your active investigation.";
    } else if (isSuspectQuery) {
      if (matchedSuspects.length > 0) {
        confidenceScore = 95;
        answer = `Suspect Details for ${matchedSuspects.map(s => s.name).join(', ')}:\n`;
        matchedSuspects.forEach(s => {
          const idStr = s.id || s._id.toString();
          citations.push(idStr);
          const relatedLinks = allLinks.filter(l => l.suspect_a_id === idStr || l.suspect_b_id === idStr);
          answer += `• ${s.name} (Aliases: ${s.aliases?.join(', ') || 'None'}) has a calculated risk score of ${s.risk_score || 'Unassessed'}%.\n`;
          if (relatedLinks.length > 0) {
            answer += `  └─ Connections: Linked to ${relatedLinks.length} other individuals in this case via ${relatedLinks.map(l => l.link_type.replace('_', ' ')).join(', ')} links.\n`;
          }
        });
      } else {
        confidenceScore = 80;
        if (allSuspects.length > 0) {
          answer = `Suspect roster for Case ${targetCase.fir_number}:\n`;
          allSuspects.forEach(s => {
            citations.push(s.id || s._id.toString());
            answer += `• ${s.name} (Risk: ${s.risk_score || 'Unassessed'}%) - Aliases: ${s.aliases?.join(', ') || 'None'}\n`;
          });
        } else {
          answer = `No suspect profiles have been registered yet for Case folder ${targetCase.fir_number}.`;
        }
      }
    } else if (isCdrQuery) {
      if (matchedEvidence.length > 0) {
        confidenceScore = 95;
        answer = `Telemetry & CDR Log matches:\n`;
        matchedEvidence.forEach(e => {
          citations.push(e.id || e._id.toString());
          answer += `• [${e.type.toUpperCase()}] Record for Phone ${e.phone_number || 'N/A'} at Location ${e.cell_tower || 'N/A'}. Timestamp: ${new Date(e.captured_at).toLocaleString()}.\n`;
        });
      } else {
        confidenceScore = 75;
        if (allEvidence.length > 0) {
          answer = `CDR logs for Case ${targetCase.fir_number}:\n`;
          allEvidence.slice(0, 5).forEach(e => {
            citations.push(e.id || e._id.toString());
            answer += `• Phone: ${e.phone_number || 'Unlinked'} detected at ${e.cell_tower || 'Tower'} (${e.type.toUpperCase()})\n`;
          });
          if (allEvidence.length > 5) {
            answer += `and ${allEvidence.length - 5} other evidence record(s).`;
          }
        } else {
          answer = `No telemetry, ANPR, or cell tower records have been uploaded for Case ${targetCase.fir_number}.`;
        }
      }
    } else if (isNetworkQuery) {
      if (allLinks.length > 0) {
        confidenceScore = 90;
        answer = `Geospatial & CDR Association Network Links:\n`;
        allLinks.forEach(l => {
          citations.push(l.id || l._id.toString());
          const suspA = allSuspects.find(s => (s.id || s._id.toString()) === l.suspect_a_id);
          const suspB = allSuspects.find(s => (s.id || s._id.toString()) === l.suspect_b_id);
          const nameA = suspA ? suspA.name : 'Unknown';
          const nameB = suspB ? suspB.name : 'Unknown';
          answer += `• Link: ${nameA} <-> ${nameB} via ${l.link_type.replace('_', ' ')} (${l.detail || 'No additional details'}).\n`;
        });
      } else {
        answer = `No network graph associations have been mapped for Case ${targetCase.fir_number}.`;
      }
    } else {
      // Default: Executive Case Summary
      confidenceScore = 88;
      const suspRoster = allSuspects.map(s => s.name).join(', ') || 'None';
      answer = `Case Dossier Executive Summary for FIR ${targetCase.fir_number}:\n`;
      answer += `• Title: ${targetCase.title}\n`;
      answer += `• Status: ${targetCase.status.toUpperCase()} | Priority: ${targetCase.priority.toUpperCase()}\n`;
      answer += `• Briefing: ${targetCase.description || 'No case synopsis registered.'}\n`;
      answer += `• Roster: ${allSuspects.length} suspect(s) identified (${suspRoster}).\n`;
      answer += `• Evidence: ${allEvidence.length} telecommunication / signal record(s) indexed.`;
    }
  }

  const caseIdKey = (targetCase ? (targetCase.id || targetCase._id?.toString()) : caseId) || 'default';
  lastAIExecutionMap.set(caseIdKey, { promptText: query, completionText: answer, timestamp: Date.now() });
  lastAIExecutionMap.set('default', { promptText: query, completionText: answer, timestamp: Date.now() });

  return {
    answer,
    confidenceScore,
    citedRecordIds: [...new Set(citations)]
  };
}

module.exports = {
  lastAIExecutionMap,
  deterministicStringify,
  generateLocalAIResponse
};
