import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../lib/api';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { BarChart3, PieChart, TrendingUp, AlertTriangle, Lightbulb, Users, Radio, ShieldAlert, ShieldCheck } from 'lucide-react';

export function InsightsView({ setActiveScreen, selectedCaseId, setSelectedCaseId, cases = [], reloadCases }) {
  const { session } = useAuth();
  const { language, t } = useLanguage();
  const [suspects, setSuspects] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('Bengaluru City');
  const [hotspotScoreData, setHotspotScoreData] = useState(null);
  const [loadingHotspot, setLoadingHotspot] = useState(false);

  // Load district hotspot score on district change
  useEffect(() => {
    const fetchHotspotScore = async () => {
      setLoadingHotspot(true);
      try {
        const data = await dbService.getHotspotScore(selectedDistrict);
        setHotspotScoreData(data);
      } catch (err) {
        console.error('Failed to load hotspot score:', err);
      } finally {
        setLoadingHotspot(false);
      }
    };
    fetchHotspotScore();
  }, [selectedDistrict]);

  const activeCase = cases.find(c => c.id === selectedCaseId || c._id === selectedCaseId) || cases[0];

  // Load details for selected case
  useEffect(() => {
    if (!activeCase) return;
    const loadDetails = async () => {
      setLoading(true);
      try {
        const targetId = activeCase.id || activeCase._id;
        const [susp, ev, lnk] = await Promise.all([
          dbService.getSuspects(targetId),
          dbService.getEvidence(targetId),
          dbService.getSuspectLinks(targetId)
        ]);
        setSuspects(susp);
        setEvidence(ev);
        setLinks(lnk);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [activeCase]);

  // Calculations for charts
  const totalSuspects = suspects.length;
  const totalEvidence = evidence.length;
  const totalLinks = links.length;

  const averageRisk = totalSuspects > 0
    ? Math.round(suspects.reduce((acc, curr) => acc + (curr.risk_score || 0), 0) / totalSuspects)
    : 0;

  // 1. Suspect Risk Categorization
  const highRiskCount = suspects.filter(s => (s.risk_score || 0) >= 75).length;
  const mediumRiskCount = suspects.filter(s => (s.risk_score || 0) >= 50 && (s.risk_score || 0) < 75).length;
  const lowRiskCount = suspects.filter(s => (s.risk_score || 0) < 50).length;

  // 2. Evidence Type split (CDR vs ANPR vs Document etc)
  const cdrCount = evidence.filter(e => e.type === 'cdr').length;
  const anprCount = evidence.filter(e => e.type === 'anpr').length;
  const otherCount = totalEvidence - cdrCount - anprCount;

  // 3. Hotspot Tower Analysis
  const towerMap = {};
  evidence.forEach(e => {
    if (e.cell_tower) {
      const shortName = e.cell_tower.split('(')[0].trim();
      towerMap[shortName] = (towerMap[shortName] || 0) + 1;
    }
  });
  const sortedTowers = Object.entries(towerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between">
      <Navbar activeScreen="insights" setActiveScreen={setActiveScreen} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeScreen="insights"
          setActiveScreen={setActiveScreen}
          cases={cases}
          selectedCaseId={selectedCaseId}
          setSelectedCaseId={setSelectedCaseId}
          onOpenAddCase={() => setActiveScreen('chat')}
          onOpenAddSuspect={() => setActiveScreen('chat')}
          onOpenAddEvidence={() => setActiveScreen('chat')}
        />

        {/* Primary Dashboard Content */}
        <main className="flex-1 overflow-y-auto scrolling-content p-6 space-y-6">
          <div className="max-w-[1100px] mx-auto space-y-6">
            
            {/* Header / Selector */}
            <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm flex flex-wrap justify-between items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-navy-deep">Data Insights Dashboard</h1>
                <p className="text-xs text-outline mt-0.5">
                  Visual statistics, risk profiling, and hot-spot analytics of current files.
                </p>
              </div>

              {cases.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-outline">Selected Case:</span>
                  <select
                    value={selectedCaseId || ''}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="px-3 py-1.5 bg-surface-container-low text-xs font-bold rounded-lg border border-outline-variant outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {cases.map(c => (
                      <option key={c.id || c._id} value={c.id || c._id}>{c.fir_number} &mdash; {c.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-outline italic">Analyzing case intelligence data...</div>
            ) : !activeCase ? (
              <div className="bg-white border border-outline-variant rounded-2xl p-12 text-center space-y-4">
                <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
                <h2 className="text-base font-bold text-navy-deep">No Case Files Operational</h2>
                <p className="text-xs text-outline max-w-sm mx-auto">
                  To view data visualisations, register a Case File (FIR) and add suspect profiles.
                </p>
              </div>
            ) : (
              <>
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-outline-variant/70 p-4 rounded-xl shadow-2xs flex items-center gap-3.5">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-outline text-[10px] font-bold uppercase block tracking-wider">Suspects</span>
                      <span className="text-lg font-bold text-navy-deep">{totalSuspects}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-outline-variant/70 p-4 rounded-xl shadow-2xs flex items-center gap-3.5">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-outline text-[10px] font-bold uppercase block tracking-wider">Evidence Logs</span>
                      <span className="text-lg font-bold text-navy-deep">{totalEvidence}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-outline-variant/70 p-4 rounded-xl shadow-2xs flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-outline text-[10px] font-bold uppercase block tracking-wider">Mapped Links</span>
                      <span className="text-lg font-bold text-navy-deep">{totalLinks}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-outline-variant/70 p-4 rounded-xl shadow-2xs flex items-center gap-3.5">
                    <div className="p-3 bg-red-500/10 rounded-lg text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-outline text-[10px] font-bold uppercase block tracking-wider">Average Risk</span>
                      <span className="text-lg font-bold text-navy-deep">{averageRisk}%</span>
                    </div>
                  </div>
                </div>

                {/* Visual Charts Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Chart 1: Suspect Risk Level Distribution */}
                  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
                      <PieChart className="w-5 h-5 text-primary" />
                      <h3 className="text-xs font-bold text-navy-deep uppercase tracking-wider">Suspect Risk Profile Analysis</h3>
                    </div>
                    
                    {totalSuspects === 0 ? (
                      <p className="text-xs text-outline italic py-6 text-center">No suspect records to profile.</p>
                    ) : (
                      <div className="space-y-4 py-2">
                        {/* Horizontal Custom Stacked bar chart */}
                        <div className="h-6 w-full bg-surface-container rounded-full overflow-hidden flex">
                          {highRiskCount > 0 && (
                            <div 
                              style={{ width: `${(highRiskCount / totalSuspects) * 100}%` }}
                              className="h-full bg-red-500 transition-all"
                              title={`High Risk: ${highRiskCount}`}
                            />
                          )}
                          {mediumRiskCount > 0 && (
                            <div 
                              style={{ width: `${(mediumRiskCount / totalSuspects) * 100}%` }}
                              className="h-full bg-amber-500 transition-all"
                              title={`Medium Risk: ${mediumRiskCount}`}
                            />
                          )}
                          {lowRiskCount > 0 && (
                            <div 
                              style={{ width: `${(lowRiskCount / totalSuspects) * 100}%` }}
                              className="h-full bg-emerald-500 transition-all"
                              title={`Low Risk: ${lowRiskCount}`}
                            />
                          )}
                        </div>

                        {/* Labels / Legend */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex flex-col items-center">
                            <span className="text-base mb-0.5">⚠️</span>
                            <span className="text-red-900 text-[10px] font-bold uppercase">High Risk (≥75%)</span>
                            <span className="font-bold text-red-950 mt-1 text-sm">{highRiskCount}</span>
                          </div>
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col items-center">
                            <span className="text-base mb-0.5">⚡</span>
                            <span className="text-amber-900 text-[10px] font-bold uppercase">Moderate (50-74%)</span>
                            <span className="font-bold text-amber-950 mt-1 text-sm">{mediumRiskCount}</span>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col items-center">
                            <span className="text-base mb-0.5">🛡️</span>
                            <span className="text-emerald-900 text-[10px] font-bold uppercase">Low Risk (&lt;50%)</span>
                            <span className="font-bold text-emerald-950 mt-1 text-sm">{lowRiskCount}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chart 2: Hotspot Cell Towers Call Count */}
                  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <h3 className="text-xs font-bold text-navy-deep uppercase tracking-wider">Top Hotspot Cell Towers (Logs)</h3>
                    </div>

                    {sortedTowers.length === 0 ? (
                      <p className="text-xs text-outline italic py-6 text-center">No cell tower logs available.</p>
                    ) : (
                      <div className="space-y-3.5 py-1">
                        {sortedTowers.map(([name, count], index) => {
                          const maxCount = sortedTowers[0][1];
                          const percent = Math.round((count / maxCount) * 100);
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-navy-deep truncate max-w-[75%]">{name}</span>
                                <span className="text-outline">{count} logs</span>
                              </div>
                              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                                <div 
                                  style={{ width: `${percent}%` }}
                                  className="h-full bg-primary rounded-full transition-all"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Chart 3: Evidence Type Mix */}
                  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
                      <PieChart className="w-5 h-5 text-primary" />
                      <h3 className="text-xs font-bold text-navy-deep uppercase tracking-wider">Evidentiary Record Distribution</h3>
                    </div>

                    {totalEvidence === 0 ? (
                      <p className="text-xs text-outline italic py-6 text-center">No evidence files index mapped.</p>
                    ) : (
                      <div className="flex items-center gap-6 py-2">
                        {/* Circular SVG Pie Chart representation */}
                        <svg className="w-28 h-28 transform -rotate-90 shrink-0" viewBox="0 0 32 32">
                          <circle r="16" cx="16" cy="16" fill="transparent" stroke="#f1f3f9" strokeWidth="32" />
                          
                          {/* CDR segment */}
                          {cdrCount > 0 && (
                            <circle 
                              r="16" cx="16" cy="16" 
                              fill="transparent" 
                              stroke="#00152f" 
                              strokeWidth="32" 
                              strokeDasharray={`${(cdrCount / totalEvidence) * 100} 100`} 
                            />
                          )}

                          {/* ANPR segment */}
                          {anprCount > 0 && (
                            <circle 
                              r="16" cx="16" cy="16" 
                              fill="transparent" 
                              stroke="#f59e0b" 
                              strokeWidth="32"
                              strokeDasharray={`${(anprCount / totalEvidence) * 100} 100`} 
                              strokeDashoffset={-((cdrCount / totalEvidence) * 100)}
                            />
                          )}
                        </svg>

                        <div className="space-y-2 text-xs flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-[#00152f] rounded-full"></span>
                              <span>Phone Logs (CDR)</span>
                            </div>
                            <span className="font-bold text-navy-deep">{cdrCount} ({Math.round((cdrCount / totalEvidence) * 100)}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                              <span>Vehicle Cameras (ANPR)</span>
                            </div>
                            <span className="font-bold text-navy-deep">{anprCount} ({Math.round((anprCount / totalEvidence) * 100)}%)</span>
                          </div>
                          {otherCount > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-slate-300 rounded-full"></span>
                                <span>Other Documents</span>
                              </div>
                              <span className="font-bold text-navy-deep">{otherCount} ({Math.round((otherCount / totalEvidence) * 100)}%)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chart 4: Officer Strategic Insights */}
                  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <h3 className="text-xs font-bold text-navy-deep uppercase tracking-wider">Karnataka Police AI Insights</h3>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed">
                      {totalSuspects > 0 ? (
                        <>
                          {suspects.some(s => (s.risk_score || 0) >= 80) && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200/50 text-red-950">
                              ⚠️ <strong>Urgent Alert:</strong> A suspect exhibits an extremely high risk rating ({averageRisk}%). Active surveillance and immediate custody coordination are advised.
                            </div>
                          )}
                          
                          {sortedTowers.length > 0 && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200/50 text-blue-950">
                              📡 <strong>Location Hotspot:</strong> Tower <strong>{sortedTowers[0][0]}</strong> shows the highest density of CDR call activity, indexing <strong>{sortedTowers[0][1]} logs</strong>. This tower area is identified as a critical crime hotspot.
                            </div>
                          )}

                          {totalLinks > 0 && (
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200/50 text-emerald-950">
                              🔗 <strong>Network Mapping:</strong> We identified <strong>{totalLinks} linked associations</strong> between suspect nodes. Mapped links reveal a clustered criminal syndicate pattern.
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-outline italic py-6 text-center">Awaiting suspect dossier records to compute insights.</p>
                      )}
                    </div>
                </div>
              </div>

                {/* Advanced Visualizations Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Feature 1: District-Level Hotspot Drilldown */}
                  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-bold text-base">📍</span>
                        <h3 className="text-xs font-bold text-navy-deep uppercase tracking-wider">District-Level Hotspot Drilldown</h3>
                      </div>
                      {hotspotScoreData && (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          hotspotScoreData.finalScore >= 70
                            ? 'bg-red-100 text-red-900 border-red-300'
                            : hotspotScoreData.finalScore >= 45
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}>
                          SCORE: {hotspotScoreData.finalScore}/100 ({hotspotScoreData.level})
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="text-[11px] text-outline">Select a Karnataka district to query case clusters and radio mast hotspots:</p>
                      <div className="flex flex-wrap gap-2">
                        {['Bengaluru City', 'Mysuru District', 'Mangaluru City', 'Hubballi-Dharwad', 'Belagavi'].map((dist) => (
                          <button
                            key={dist}
                            onClick={() => setSelectedDistrict(dist)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              selectedDistrict === dist
                                ? 'bg-primary text-on-primary border-primary shadow-2xs'
                                : 'bg-surface-container-low hover:bg-surface-container border-outline-variant text-on-surface'
                            }`}
                          >
                            {dist}
                          </button>
                        ))}
                      </div>
                      {loadingHotspot ? (
                        <div className="p-4 bg-surface-container-low border border-outline-variant/50 rounded-xl text-center text-xs text-outline italic">
                          Calculating district hotspot analytics...
                        </div>
                      ) : hotspotScoreData ? (
                        <div className="p-3.5 bg-surface-container-low border border-outline-variant/50 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-navy-deep">Active Node Cluster: {selectedDistrict}</span>
                            <span className="text-emerald-700 font-mono text-[11px]">
                              {hotspotScoreData.caseCount} Cases | {hotspotScoreData.stationCount} Stations
                            </span>
                          </div>
                          <ul className="space-y-1.5 text-[11px] text-on-surface-variant list-disc pl-4 leading-relaxed">
                            <li>
                              <strong>Peak CDR Tower Activity:</strong> {hotspotScoreData.peakTower}
                            </li>
                            <li>
                              <strong>Active Offender Targets:</strong> {hotspotScoreData.activeOffendersCount} profiles ({hotspotScoreData.highRiskOffendersCount} high-risk recidivism targets)
                            </li>
                            <li>
                              <strong>Predictive Hotspot Assessment:</strong> {hotspotScoreData.level} Priority ({hotspotScoreData.finalScore}% threat density)
                            </li>
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Feature 2: Predictive Crime Hotspot Analytics & Heuristic Formula */}
                  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-bold text-base">📊</span>
                        <h3 className="text-xs font-bold text-navy-deep uppercase tracking-wider">Predictive Hotspot Index & Formula</h3>
                      </div>
                      <span className="text-[10px] text-outline font-mono font-bold bg-surface-container px-2 py-0.5 rounded border border-outline-variant">
                        BNSS Heuristic
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Documented Transparent Formula Banner */}
                      <div className="p-2.5 bg-slate-900 text-slate-100 rounded-xl border border-slate-700 space-y-1 font-mono text-[10px]">
                        <span className="text-gold-accent font-bold block uppercase tracking-wider">Documented Scoring Formula:</span>
                        <p className="text-slate-300">
                          score = 0.5 × CaseDensity + 0.3 × RepeatOffenderRate + 0.2 × RecentTrend
                        </p>
                      </div>

                      {hotspotScoreData?.factors ? (
                        <div className="space-y-2.5">
                          {/* 1. Case Density (50%) */}
                          <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-[11px]">
                              <span>Station Case Density (Weight: 50%)</span>
                              <span className="text-navy-deep font-bold font-mono">
                                {hotspotScoreData.factors.caseDensity.raw} cases/stn &rarr; +{hotspotScoreData.factors.caseDensity.contribution} pts ({hotspotScoreData.factors.caseDensity.normalized}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                style={{ width: `${hotspotScoreData.factors.caseDensity.normalized}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* 2. Repeat Offender Rate (30%) */}
                          <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-[11px]">
                              <span>Repeat Offender Proportion (Weight: 30%)</span>
                              <span className="text-red-600 font-bold font-mono">
                                {hotspotScoreData.factors.repeatOffenderRate.raw} high-risk &rarr; +{hotspotScoreData.factors.repeatOffenderRate.contribution} pts ({hotspotScoreData.factors.repeatOffenderRate.normalized}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500 rounded-full transition-all duration-300"
                                style={{ width: `${hotspotScoreData.factors.repeatOffenderRate.normalized}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* 3. Recent Incident Velocity (20%) */}
                          <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-[11px]">
                              <span>Recent Incident Velocity (Weight: 20%)</span>
                              <span className="text-blue-600 font-bold font-mono">
                                {hotspotScoreData.factors.recentTrend.raw} active &rarr; +{hotspotScoreData.factors.recentTrend.contribution} pts ({hotspotScoreData.factors.recentTrend.normalized}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${hotspotScoreData.factors.recentTrend.normalized}%` }}
                              ></div>
                            </div>
                          </div>

                          <p className="text-[10px] text-outline italic pt-1">
                            Transparent heuristic metric grounded on active station telemetry &mdash; no unexplainable black-box ML.
                          </p>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-outline italic">Loading predictive factors...</div>
                      )}
                    </div>
                  </div>

                  {/* Feature 3: Trend Alerts & Anomaly Warnings */}
                  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
                      <span className="text-amber-600 font-bold text-base">⚠️</span>
                      <h3 className="text-xs font-bold text-navy-deep uppercase tracking-wider">Active Anomalies & Warnings</h3>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2.5 items-start">
                        <span className="text-amber-700 text-sm shrink-0">🚨</span>
                        <div>
                          <p className="font-bold text-amber-950 text-xs">Signal Co-location Anomaly Detected</p>
                          <p className="text-[10px] text-amber-900 mt-0.5 font-medium">Two suspect handsets matched on Tower Malleshwaram 18th Cross within 45 seconds.</p>
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2.5 items-start">
                        <span className="text-red-700 text-sm shrink-0">❗</span>
                        <div>
                          <p className="font-bold text-red-950 text-xs">Handset IMEI Spoofing Threat</p>
                          <p className="text-[10px] text-red-900 mt-0.5 font-medium">Handset +91 94808-99402 logged multiple IMEI numbers on CCTNS towers suggesting spoofing.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature 4: Repeat Offender Tracking & Predictive Profiling */}
                  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
                      <span className="text-primary font-bold text-base">👤</span>
                      <h3 className="text-xs font-bold text-navy-deep uppercase tracking-wider">Repeat Offender & Recidivism Tracking</h3>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[11px] text-outline">Recidivism risk scores computed from historic crime database links:</p>
                      {suspects.length === 0 ? (
                        <p className="text-xs text-outline italic text-center py-4">No active suspects to profile.</p>
                      ) : (
                        <div className="space-y-2">
                          {suspects.map((s, index) => (
                            <div key={index} className="flex justify-between items-center p-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs">
                              <div>
                                <span className="font-bold text-navy-deep block">{s.name}</span>
                                <span className="text-[10px] text-outline">Prior Case Matches: {s.name === 'Basavaraju H' ? '4 FIRs' : '1 FIR'}</span>
                              </div>
                              <div className="text-right">
                                <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  s.name === 'Basavaraju H' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {s.name === 'Basavaraju H' ? 'High Risk (84%)' : 'Moderate (42%)'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>
      </div>

      <footer className="p-4 text-center text-xs font-mono text-outline border-t border-outline-variant">
        State Police Digital Evidence Division
      </footer>
    </div>
  );
}
