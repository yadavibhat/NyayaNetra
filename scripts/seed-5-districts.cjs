/**
 * Seed script to populate all 5 Karnataka districts with realistic police intelligence data
 * Computes embeddings and sets rich MO tags for behavioral profiling
 */

const fs = require('fs');
const path = require('path');
const { embedText } = require('../lib/embeddings.cjs');

const DB_FILE = path.join(__dirname, '..', 'db_backend.json');

async function seedDistricts() {
  console.log('Seeding 5 Karnataka Districts into db_backend.json...');

  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

  // 1. Stations (15 total stations across 5 districts)
  db.stations = [
    // Bengaluru City
    { id: 'stn-blr-mll', name: 'Malleshwaram Police Station', district: 'Bengaluru City' },
    { id: 'stn-blr-ind', name: 'Indiranagar Police Station', district: 'Bengaluru City' },
    { id: 'stn-cid-hq', name: 'Cyber Crime PS (CID Headquarters)', district: 'Bengaluru City' },

    // Mysuru District
    { id: 'stn-mys-ctl', name: 'Mysuru Central Police Station', district: 'Mysuru District' },
    { id: 'stn-mys-dev', name: 'Devaraja Police Station', district: 'Mysuru District' },
    { id: 'stn-mys-vij', name: 'Vijayanagar Police Station', district: 'Mysuru District' },

    // Mangaluru City
    { id: 'stn-mng-nth', name: 'Mangaluru North Police Station', district: 'Mangaluru City' },
    { id: 'stn-mng-pan', name: 'Panambur Coastal Police Station', district: 'Mangaluru City' },
    { id: 'stn-mng-kad', name: 'Kadri Police Station', district: 'Mangaluru City' },

    // Hubballi-Dharwad
    { id: 'stn-hub-dwd', name: 'Hubballi-Dharwad Town PS', district: 'Hubballi-Dharwad' },
    { id: 'stn-hub-gok', name: 'Gokul Road Police Station', district: 'Hubballi-Dharwad' },
    { id: 'stn-hub-vid', name: 'Vidyagiri Police Station', district: 'Hubballi-Dharwad' },

    // Belagavi
    { id: 'stn-bel-ctl', name: 'Belagavi City Central PS', district: 'Belagavi' },
    { id: 'stn-bel-kha', name: 'Khade Bazar Police Station', district: 'Belagavi' },
    { id: 'stn-bel-til', name: 'Tilakwadi Police Station', district: 'Belagavi' }
  ];

  // 2. Cases (At least 3-4 distinct cases per district)
  const casesData = [
    // Bengaluru City (4 cases)
    { id: 'case-1784704530759', fir_number: 'FIR #0184/2026', station_id: 'stn-blr-mll', title: 'Malleshwaram CDR & Telemetry Investigation', description: 'Investigation into unauthorized cell tower activity and gold store burglary near 18th Cross.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' },
    { id: 'case-blr-002', fir_number: 'FIR #0001/2026', station_id: 'stn-blr-ind', title: 'Bagaluru Cross Extortion and Threat Case', description: 'Commercial extortion calls made to shopkeepers near Bagaluru junction.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' },
    { id: 'case-blr-003', fir_number: 'FIR #0002/2026', station_id: 'stn-cid-hq', title: 'NMIT Cyber Harassment and SIM Swapping', description: 'Coordinated student SIM card cloning and unauthorized bank OTP intercepts.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' },
    { id: 'case-blr-004', fir_number: 'FIR #0099/2026', station_id: 'stn-blr-mll', title: 'Yeshwanthpur Railway Yard Cargo Theft', description: 'Night goods wagon seal tampering and industrial copper coil theft.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' },

    // Mysuru District (3 cases)
    { id: 'case-mys-001', fir_number: 'FIR #MYS-042/2026', station_id: 'stn-mys-ctl', title: 'Chamundi Hill Night Vehicle Intercept', description: 'Unregistered luxury vehicle evasion and illegal contraband transport.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' },
    { id: 'case-mys-002', fir_number: 'FIR #MYS-089/2026', station_id: 'stn-mys-dev', title: 'Devaraja Market Gold Smuggling Chain', description: 'Hawala cash transfers and undeclared bullion trading in central market stalls.', status: 'under_review', priority: 'medium', created_by: 'usr-1784704355604' },
    { id: 'case-mys-003', fir_number: 'FIR #MYS-104/2026', station_id: 'stn-mys-vij', title: 'Gokulam Commercial Estate Burglary', description: 'Night-time lock picking and safe burglary at an electronics warehouse.', status: 'closed', priority: 'low', created_by: 'usr-1784704355604' },

    // Mangaluru City (4 cases)
    { id: 'case-mng-001', fir_number: 'FIR #MNG-012/2026', station_id: 'stn-mng-pan', title: 'Panambur Port Maritime Fuel Pilferage', description: 'Illegal siphon valves installed on maritime fuel transport lines at dock 4.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' },
    { id: 'case-mng-002', fir_number: 'FIR #MNG-055/2026', station_id: 'stn-mng-kad', title: 'Kadri Telecom Spoofing Syndicate', description: 'International VoIP gateway rerouting and bank impersonation scams.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' },
    { id: 'case-mng-003', fir_number: 'FIR #MNG-078/2026', station_id: 'stn-mng-nth', title: 'Ullal Sand Transport Forgery', description: 'Forged mining revenue transit passes used on coastal highway trucks.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' },
    { id: 'case-mng-004', fir_number: 'FIR #MNG-091/2026', station_id: 'stn-mng-pan', title: 'Surathkal Offshore Smuggling Transfer', description: 'High-speed boat drop-off of unauthorized foreign electronics consignments.', status: 'under_review', priority: 'medium', created_by: 'usr-1784704355604' },

    // Hubballi-Dharwad (3 cases)
    { id: 'case-hub-001', fir_number: 'FIR #HUB-019/2026', station_id: 'stn-hub-gok', title: 'Gokul Road Industrial Warehouse Break-in', description: 'Heavy machinery spare parts theft during power outage at industrial estate.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' },
    { id: 'case-hub-002', fir_number: 'FIR #HUB-063/2026', station_id: 'stn-hub-dwd', title: 'Dharwad Highway Truck Hijack Attempt', description: 'Blunt weapon attack on commercial goods container along NH-48 bypass.', status: 'under_review', priority: 'high', created_by: 'usr-1784704355604' },
    { id: 'case-hub-003', fir_number: 'FIR #HUB-088/2026', station_id: 'stn-hub-vid', title: 'Unkal Lake ATM Skimming Racket', description: 'Micro-camera overlay and card skimming hardware deployed at standalone kiosk.', status: 'open', priority: 'medium', created_by: 'usr-1784704355604' },

    // Belagavi (4 cases)
    { id: 'case-bel-001', fir_number: 'FIR #BEL-007/2026', station_id: 'stn-bel-kha', title: 'Khade Bazar Jewellery Shop Heist', description: 'Daylight distraction theft of diamond ornaments using customer diversion tactics.', status: 'under_review', priority: 'medium', created_by: 'usr-1784704355604' },
    { id: 'case-bel-002', fir_number: 'FIR #BEL-031/2026', station_id: 'stn-bel-til', title: 'Tilakwadi Cross-Border Liquor Smuggling', description: 'Non-duty paid liquor crates smuggled via modified SUV false floors from Goa border.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' },
    { id: 'case-bel-003', fir_number: 'FIR #BEL-092/2026', station_id: 'stn-bel-ctl', title: 'Khanapur Forest Teak Timber Poaching', description: 'Midnight chainsaw logging and transport of protected teak wood logs.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' },
    { id: 'case-bel-004', fir_number: 'FIR #BEL-114/2026', station_id: 'stn-bel-til', title: 'Udyambag Copper Wire Stripping Ring', description: 'Substation cable stripping and transformer oil tapping during midnight grid maintenance.', status: 'open', priority: 'high', created_by: 'usr-1784704355604' }
  ];

  for (const c of casesData) {
    const summary = `FIR: ${c.fir_number} | Title: ${c.title} | Description: ${c.description} | Status: ${c.status} | Priority: ${c.priority}`;
    c.embedding = await embedText(summary, false);
  }
  db.cases = casesData;

  // 3. Suspects with rich MO tags
  const suspectsData = [
    // Bengaluru (5 suspects)
    { id: 'susp-1784704530760', case_id: 'case-1784704530759', name: 'Basavaraju H', aliases: ['Basa', 'BH-402'], risk_score: 88, mo_tags: ['night-time', 'forced-entry', 'weapon-blunt', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-1784704530761', case_id: 'case-1784704530759', name: 'Shivanna K', aliases: ['Shiva'], risk_score: 72, mo_tags: ['night-time', 'forced-entry', 'group-of-2+'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-blr-003', case_id: 'case-blr-002', name: 'Sharat Gowda', aliases: ['Bull', 'Bangalore Sharat'], risk_score: 78, mo_tags: ['day-time', 'weapon-blunt', 'known-to-victim', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-blr-004', case_id: 'case-blr-003', name: 'John Paul', aliases: ['JP', 'Hacker John'], risk_score: 100, mo_tags: ['telecom-spoofing', 'group-of-2+', 'insider-collusion', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-blr-005', case_id: 'case-blr-003', name: 'Joseph', aliases: ['Joe Cyber'], risk_score: 89, mo_tags: ['telecom-spoofing', 'lone-actor', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },

    // Mysuru (3 suspects)
    { id: 'susp-mys-001', case_id: 'case-mys-001', name: 'Ramesh Kumar M', aliases: ['Speedy Ramesh'], risk_score: 85, mo_tags: ['night-time', 'vehicle-escape', 'weapon-sharp', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-mys-002', case_id: 'case-mys-002', name: 'Manjunath K', aliases: ['Gold Manju'], risk_score: 55, mo_tags: ['day-time', 'insider-collusion', 'known-to-victim'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-mys-003', case_id: 'case-mys-003', name: 'Siddaramaiah B', aliases: ['Lock Siddha'], risk_score: 62, mo_tags: ['night-time', 'forced-entry', 'weapon-none'], image_url: null, created_by: 'usr-1784704355604' },

    // Mangaluru (4 suspects)
    { id: 'susp-mng-001', case_id: 'case-mng-001', name: 'Farooq Ahmed', aliases: ['Port Farooq'], risk_score: 92, mo_tags: ['night-time', 'group-of-2+', 'insider-collusion', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-mng-002', case_id: 'case-mng-002', name: 'Prashanth Shetty', aliases: ['VoIP Shetty'], risk_score: 86, mo_tags: ['telecom-spoofing', 'group-of-2+', 'insider-collusion', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-mng-003', case_id: 'case-mng-003', name: 'Abdul Rauf', aliases: ['Rauf Ullal'], risk_score: 79, mo_tags: ['day-time', 'lone-actor', 'weapon-none', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-mng-004', case_id: 'case-mng-004', name: 'Dinesh Poojary', aliases: ['Surathkal Dinesh'], risk_score: 81, mo_tags: ['night-time', 'vehicle-escape', 'group-of-2+', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },

    // Hubballi (3 suspects)
    { id: 'susp-hub-001', case_id: 'case-hub-001', name: 'Gurupadappa N', aliases: ['Guru Pehelwan'], risk_score: 82, mo_tags: ['night-time', 'forced-entry', 'group-of-2+', 'weapon-blunt', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-hub-002', case_id: 'case-hub-002', name: 'Veeresh Patil', aliases: ['Highway Veeru'], risk_score: 68, mo_tags: ['night-time', 'vehicle-escape', 'weapon-sharp'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-hub-003', case_id: 'case-hub-003', name: 'Mallikarjun S', aliases: ['ATM Malli'], risk_score: 52, mo_tags: ['telecom-spoofing', 'lone-actor', 'weapon-none'], image_url: null, created_by: 'usr-1784704355604' },

    // Belagavi (4 suspects)
    { id: 'susp-bel-001', case_id: 'case-bel-001', name: 'Anand Gaikwad', aliases: ['Khade Anand'], risk_score: 70, mo_tags: ['day-time', 'group-of-2+', 'known-to-victim'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-bel-002', case_id: 'case-bel-002', name: 'Sanjay Kulkarni', aliases: ['Goa Sanju'], risk_score: 87, mo_tags: ['night-time', 'vehicle-escape', 'group-of-2+', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-bel-003', case_id: 'case-bel-003', name: 'Datta Chavan', aliases: ['Chavan Timber'], risk_score: 76, mo_tags: ['night-time', 'vehicle-escape', 'weapon-sharp', 'repeat-offender'], image_url: null, created_by: 'usr-1784704355604' },
    { id: 'susp-bel-004', case_id: 'case-bel-004', name: 'Prakash Patil', aliases: ['Patil Wire'], risk_score: 65, mo_tags: ['night-time', 'forced-entry', 'weapon-blunt'], image_url: null, created_by: 'usr-1784704355604' }
  ];

  for (const s of suspectsData) {
    const moStr = s.mo_tags?.length ? ` | Modus Operandi: ${s.mo_tags.join(', ')}` : '';
    const summary = `Suspect: ${s.name} | Aliases: ${s.aliases?.join(', ') || 'None'} | Risk Score: ${s.risk_score || 0}%${moStr}`;
    s.embedding = await embedText(summary, false);
  }
  db.suspects = suspectsData;

  // 4. Evidence Records (Tower hit density)
  const evidenceData = [
    // Bengaluru
    { id: 'evid-blr-001', case_id: 'case-1784704530759', type: 'cdr', phone_number: '+91 94808-99402', cell_tower: 'KA-BLR-N4 (Malleshwaram 18th Cross)', captured_at: '2026-08-20T02:15:00Z', details: { notes: '14 calls to accomplice during burglary window.' }, created_by: 'usr-1784704355604' },
    { id: 'evid-blr-002', case_id: 'case-1784704530759', type: 'anpr', phone_number: '', cell_tower: 'KA-BLR-ANPR-09 (Sampige Road)', captured_at: '2026-08-20T03:30:00Z', details: { notes: 'KA-04-MB-4022 getaway car registered.' }, created_by: 'usr-1784704355604' },
    { id: 'evid-blr-003', case_id: 'case-blr-003', type: 'cdr', phone_number: '9380191739', cell_tower: 'KA-BLR-C2 (Yelahanka CID Mast)', captured_at: '2026-08-21T09:45:00Z', details: { notes: 'SIM swap SMS OTP flood.' }, created_by: 'usr-1784704355604' },
    { id: 'evid-blr-004', case_id: 'case-1784704530759', type: 'cdr', phone_number: '+91 94808-99402', cell_tower: 'KA-BLR-N4 (Malleshwaram 18th Cross)', captured_at: '2026-08-20T02:45:00Z', details: { notes: 'Secondary call intercept.' }, created_by: 'usr-1784704355604' },

    // Mysuru
    { id: 'evid-mys-001', case_id: 'case-mys-001', type: 'cdr', phone_number: '+91 98450-12345', cell_tower: 'KA-MYS-C1 (Chamundi Foothills Tower)', captured_at: '2026-08-22T01:20:00Z', details: { notes: 'Fast vehicle cell tower handover at 120km/h.' }, created_by: 'usr-1784704355604' },
    { id: 'evid-mys-002', case_id: 'case-mys-002', type: 'anpr', phone_number: '', cell_tower: 'KA-MYS-DEV-03 (Devaraja Market North Gate)', captured_at: '2026-08-22T14:10:00Z', details: { notes: 'KA-09-EA-9001 delivery scooter logged.' }, created_by: 'usr-1784704355604' },

    // Mangaluru
    { id: 'evid-mng-001', case_id: 'case-mng-001', type: 'cdr', phone_number: '+91 94481-99887', cell_tower: 'KA-MNG-P1 (Panambur Port Terminal 4)', captured_at: '2026-08-23T02:00:00Z', details: { notes: 'Call link to maritime tanker captain.' }, created_by: 'usr-1784704355604' },
    { id: 'evid-mng-002', case_id: 'case-mng-002', type: 'cdr', phone_number: '+91 98860-55443', cell_tower: 'KA-MNG-K2 (Kadri Telecom Exchange Hub)', captured_at: '2026-08-23T11:00:00Z', details: { notes: 'VoIP gateway burst traffic.' }, created_by: 'usr-1784704355604' },
    { id: 'evid-mng-003', case_id: 'case-mng-001', type: 'cdr', phone_number: '+91 94481-99887', cell_tower: 'KA-MNG-P1 (Panambur Port Terminal 4)', captured_at: '2026-08-23T03:15:00Z', details: { notes: 'Terminal coordination.' }, created_by: 'usr-1784704355604' },

    // Hubballi
    { id: 'evid-hub-001', case_id: 'case-hub-001', type: 'cdr', phone_number: '+91 94480-11223', cell_tower: 'KA-HUB-G4 (Gokul Road Industrial Grid)', captured_at: '2026-08-24T03:15:00Z', details: { notes: 'Night break-in telemetry signals.' }, created_by: 'usr-1784704355604' },
    { id: 'evid-hub-002', case_id: 'case-hub-002', type: 'anpr', phone_number: '', cell_tower: 'KA-HUB-NH4 (Dharwad Toll Plaza)', captured_at: '2026-08-24T04:20:00Z', details: { notes: 'Escape truck crossing toll with covered number plate.' }, created_by: 'usr-1784704355604' },

    // Belagavi
    { id: 'evid-bel-001', case_id: 'case-bel-002', type: 'anpr', phone_number: '', cell_tower: 'KA-BEL-GOA-01 (Chorla Ghat Border Checkpost)', captured_at: '2026-08-25T01:50:00Z', details: { notes: 'Modified SUV crossed border checkpost at midnight.' }, created_by: 'usr-1784704355604' },
    { id: 'evid-bel-002', case_id: 'case-bel-003', type: 'cdr', phone_number: '+91 94811-33221', cell_tower: 'KA-BEL-KHA (Khanapur Forest Range Mast)', captured_at: '2026-08-25T02:40:00Z', details: { notes: 'Logger coordination calls recorded.' }, created_by: 'usr-1784704355604' },
    { id: 'evid-bel-003', case_id: 'case-bel-004', type: 'cdr', phone_number: '+91 94811-77889', cell_tower: 'KA-BEL-UDY (Udyambag Grid Substation Tower)', captured_at: '2026-08-25T03:10:00Z', details: { notes: 'Transformer sabotage telemetry.' }, created_by: 'usr-1784704355604' }
  ];

  for (const e of evidenceData) {
    const detailsStr = e.details?.notes || JSON.stringify(e.details || {});
    const summary = `Evidence Type: ${e.type} | Phone: ${e.phone_number || 'N/A'} | Cell Tower: ${e.cell_tower || 'N/A'} | Details: ${detailsStr}`;
    e.embedding = await embedText(summary, false);
  }
  db.evidence_records = evidenceData;

  // 5. Suspect Links
  const linksData = [
    { id: 'link-1784704530760', case_id: 'case-1784704530759', suspect_a_id: 'susp-1784704530760', suspect_b_id: 'susp-1784704530761', link_type: 'cdr_call', detail: '14 calls recorded between 02:00 AM and 05:00 AM at Tower KA-BLR-N4', created_by: 'usr-1784704355604' },
    { id: 'link-blr-002', case_id: 'case-blr-003', suspect_a_id: 'susp-blr-004', suspect_b_id: 'susp-blr-005', link_type: 'cdr_call', detail: '12 calls between John and Joseph before SIM swap operation', created_by: 'usr-1784704355604' },
    { id: 'link-mys-001', case_id: 'case-mys-001', suspect_a_id: 'susp-mys-001', suspect_b_id: 'susp-mys-003', link_type: 'secondary_associate', detail: 'Identified together at Mysore Central lock repair garage', created_by: 'usr-1784704355604' },
    { id: 'link-mng-001', case_id: 'case-mng-002', suspect_a_id: 'susp-mng-001', suspect_b_id: 'susp-mng-002', link_type: 'cdr_call', detail: 'Coordinated encrypted calls between port and exchange hub', created_by: 'usr-1784704355604' },
    { id: 'link-hub-001', case_id: 'case-hub-001', suspect_a_id: 'susp-hub-001', suspect_b_id: 'susp-hub-002', link_type: 'anpr', detail: 'Joint transit logged across Dharwad highway toll', created_by: 'usr-1784704355604' },
    { id: 'link-bel-001', case_id: 'case-bel-002', suspect_a_id: 'susp-bel-002', suspect_b_id: 'susp-bel-003', link_type: 'secondary_associate', detail: 'Shared warehouse lease in Tilakwadi industrial zone', created_by: 'usr-1784704355604' }
  ];

  for (const l of linksData) {
    const summary = `Suspect Association: ${l.link_type} | Detail: ${l.detail || 'None'}`;
    l.embedding = await embedText(summary, false);
  }
  db.suspect_links = linksData;

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  console.log('Successfully seeded all 5 districts with diverse cases, suspects, and embeddings!');
}

seedDistricts().catch(err => {
  console.error('Failed to seed districts:', err);
  process.exit(1);
});
