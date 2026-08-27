/**
 * One-time backfill script to compute local multilingual embeddings
 * for all Cases, Suspects, EvidenceRecords, and SuspectLinks
 */

const fs = require('fs');
const path = require('path');
const { embedText } = require('../lib/embeddings.cjs');

const DB_FILE = path.join(__dirname, '..', 'db_backend.json');

async function runBackfill() {
  console.log('\n================ Starting Embedding Backfill ================');
  if (!fs.existsSync(DB_FILE)) {
    console.error('Database file not found:', DB_FILE);
    process.exit(1);
  }

  const rawData = fs.readFileSync(DB_FILE, 'utf8');
  const db = JSON.parse(rawData);

  let caseCount = 0;
  let suspectCount = 0;
  let evidenceCount = 0;
  let linkCount = 0;

  // 1. Cases
  console.log(`\n1. Processing ${db.cases?.length || 0} cases...`);
  for (const c of db.cases || []) {
    if (!c.embedding || c.embedding.length === 0) {
      const summary = `FIR: ${c.fir_number} | Title: ${c.title} | Description: ${c.description || ''} | Status: ${c.status} | Priority: ${c.priority}`;
      c.embedding = await embedText(summary, false);
      caseCount++;
    }
  }

  // 2. Suspects
  console.log(`2. Processing ${db.suspects?.length || 0} suspects...`);
  for (const s of db.suspects || []) {
    if (!s.embedding || s.embedding.length === 0) {
      const summary = `Suspect: ${s.name} | Aliases: ${s.aliases?.join(', ') || 'None'} | Risk Score: ${s.risk_score || 0}% | Case ID: ${s.case_id}`;
      s.embedding = await embedText(summary, false);
      suspectCount++;
    }
  }

  // 3. Evidence Records
  console.log(`3. Processing ${db.evidence_records?.length || 0} evidence records...`);
  for (const e of db.evidence_records || []) {
    if (!e.embedding || e.embedding.length === 0) {
      const detailsStr = e.details?.notes || JSON.stringify(e.details || {});
      const summary = `Evidence Type: ${e.type} | Phone: ${e.phone_number || 'N/A'} | Cell Tower: ${e.cell_tower || 'N/A'} | Details: ${detailsStr} | Case ID: ${e.case_id}`;
      e.embedding = await embedText(summary, false);
      evidenceCount++;
    }
  }

  // 4. Suspect Links
  console.log(`4. Processing ${db.suspect_links?.length || 0} suspect links...`);
  for (const l of db.suspect_links || []) {
    if (!l.embedding || l.embedding.length === 0) {
      const summary = `Suspect Association: ${l.link_type} | Detail: ${l.detail || 'None'} | Case ID: ${l.case_id}`;
      l.embedding = await embedText(summary, false);
      linkCount++;
    }
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

  console.log('\n--------------------------------------------------------------');
  console.log(`BACKFILL COMPLETE:`);
  console.log(`- Cases Embedded: ${caseCount}`);
  console.log(`- Suspects Embedded: ${suspectCount}`);
  console.log(`- Evidence Records Embedded: ${evidenceCount}`);
  console.log(`- Suspect Links Embedded: ${linkCount}`);
  console.log(`Total Records Backfilled: ${caseCount + suspectCount + evidenceCount + linkCount}`);
  console.log('--------------------------------------------------------------\n');
}

runBackfill().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
