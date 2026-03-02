import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Avatar from '../components/Avatar';
import './ResultsPage.css';

const CHART_COLORS = ['#0f766e', '#ea580c', '#2563eb'];
const DRUG_SWITCH_OPTIONS = [
  { value: '', label: 'Model Best (Default)' },
  { value: 'ACE_Inhibitor', label: 'ACE Inhibitor' },
  { value: 'ARB', label: 'ARB' },
  { value: 'Calcium_Channel_Blocker', label: 'Calcium Channel Blocker' },
  { value: 'Diuretic', label: 'Diuretic' },
  { value: 'Beta_Blocker', label: 'Beta Blocker' },
  { value: 'Alpha_Blocker', label: 'Alpha Blocker' },
  { value: 'Central_Acting', label: 'Central Acting Agent' }
];

const ResultsPage = ({ results, userData, onNewAssessment }) => {
  const [resultsView, setResultsView] = useState('summary');
  const [chartMetric, setChartMetric] = useState('systolic');
  const [scenario, setScenario] = useState({
    dosage_multiplier: 1.0,
    exercise_level: userData?.exercise ?? 1,
    sodium_reduction_percent: 0,
    salt_intake_mg: 3400,
    adherence_percent: 95,
    stress_intervention_percent: 0,
    sleep_hours: 7,
    sleep_quality: 1,
    weight_change_kg: 0,
    forced_drug_class: ''
  });
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfError, setWhatIfError] = useState('');

  const normalizeTipLines = (tip) => {
    if (!tip) {
      return ['No additional tip available.'];
    }

    const normalized = String(tip)
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.replace(/^\s*(?:[-•]|\d+[.)])\s*/, '').trim())
      .filter(Boolean);

    return normalized.length > 0 ? normalized : [String(tip).trim()];
  };

  const activeResults = whatIfResult || results;

  const runWhatIf = async () => {
    try {
      setWhatIfLoading(true);
      setWhatIfError('');
      const response = await fetch('http://localhost:5000/api/what-if', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          patient_data: userData,
          scenario
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to run what-if simulation');
      }
      setWhatIfResult(data);
    } catch (error) {
      setWhatIfError(error.message);
    } finally {
      setWhatIfLoading(false);
    }
  };

  const resetWhatIf = () => {
    setScenario({
      dosage_multiplier: 1.0,
      exercise_level: userData?.exercise ?? 1,
      sodium_reduction_percent: 0,
      salt_intake_mg: 3400,
      adherence_percent: 95,
      stress_intervention_percent: 0,
      sleep_hours: 7,
      sleep_quality: 1,
      weight_change_kg: 0,
      forced_drug_class: ''
    });
    setWhatIfResult(null);
    setWhatIfError('');
  };

  const buildChartPath = (trajectory, metric, minY, maxY, width, height, padLeft, padTop, padBottom) => {
    if (!trajectory || trajectory.length === 0) {
      return '';
    }
    const plotWidth = width - padLeft - 16;
    const plotHeight = height - padTop - padBottom;
    const yRange = Math.max(1, maxY - minY);

    return trajectory
      .map((point, idx) => {
        const x = padLeft + (idx / Math.max(1, trajectory.length - 1)) * plotWidth;
        const y = padTop + ((maxY - point[metric]) / yRange) * plotHeight;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  if (!activeResults || !activeResults.success) {
    return (
      <div className="results-page">
        <div className="results-container">
          <p style={{color: '#0f172a', textAlign: 'center', fontSize: '18px'}}>
            {activeResults?.error || 'Error loading results. Please try again.'}
          </p>
          <button onClick={onNewAssessment} className="new-assessment-btn">Try Again</button>
        </div>
      </div>
    );
  }

  const { best_recommendation, all_recommendations, patient_summary, ai_tips, disclaimer, simulation, risk_summary } = activeResults;
  const chartTrajectories = simulation?.drug_comparisons || [];
  const metricValues = chartTrajectories.flatMap((item) => item.trajectory.map((point) => point[chartMetric]));
  const chartMax = metricValues.length > 0 ? Math.ceil((Math.max(...metricValues) + 4) / 5) * 5 : 160;
  const chartMin = metricValues.length > 0 ? Math.floor((Math.min(...metricValues) - 4) / 5) * 5 : 70;

  return (
    <div className="results-page">
      {/* Header */}
      <div className="results-header">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          Your Personalized Treatment Plan
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {patient_summary.age} years old | BP: {patient_summary.bp}
          {patient_summary.on_medication && ` | Currently on: ${patient_summary.current_medication}`}
          {patient_summary.has_allergies && ' | Has medication allergies'}
        </motion.p>
      </div>

      <div className="results-container">
        <div className="results-view-switch">
          <button
            type="button"
            className={`view-btn ${resultsView === 'summary' ? 'active' : ''}`}
            onClick={() => setResultsView('summary')}
          >
            Summary
          </button>
          <button
            type="button"
            className={`view-btn ${resultsView === 'insights' ? 'active' : ''}`}
            onClick={() => setResultsView('insights')}
          >
            AI Insights
          </button>
        </div>

        {resultsView === 'summary' && (
        <div className="results-layout">
          {/* Left: Recommendations */}
          <div className="results-main">
            {/* Best Recommendation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="best-card"
            >
              <h2>{best_recommendation.is_current ? 'Continue Current Medication' : 'Best Recommendation'}</h2>
              <h3>{best_recommendation.drug_name}</h3>
              <p>{best_recommendation.message}</p>
              <div className="metrics">
                <span>{best_recommendation.confidence.toFixed(0)}% Match</span>
                <span>{best_recommendation.expected_bp_reduction.toFixed(1)} mmHg Reduction</span>
              </div>
            </motion.div>

            {/* Alternative Options */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="alternatives-title"
            >
              Alternative Treatment Options
            </motion.h2>

            {all_recommendations.slice(1).map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="option-card"
              >
                <div className="option-header">
                  <span className="option-rank">Option {option.rank}</span>
                  <span className="option-name">{option.drug_name}</span>
                </div>
                <div className="option-metrics">
                  <span>{option.confidence.toFixed(0)}% Match</span>
                  <span>{option.expected_bp_reduction.toFixed(1)} mmHg</span>
                </div>
                <p>{option.explanation}</p>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62 }}
              className="what-if-section"
            >
              <div className="what-if-header">
                <h3>What-If Modeling</h3>
                <p>Adjust interventions and run a counterfactual simulation.</p>
              </div>

              <div className="what-if-grid">
                <label className="what-if-control">
                  <span>Dosage Multiplier: {scenario.dosage_multiplier.toFixed(2)}x</span>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={scenario.dosage_multiplier}
                    onChange={(e) => setScenario((prev) => ({ ...prev, dosage_multiplier: parseFloat(e.target.value) }))}
                  />
                </label>

                <label className="what-if-control">
                  <span>Medication Switch</span>
                  <select
                    value={scenario.forced_drug_class}
                    onChange={(e) => setScenario((prev) => ({ ...prev, forced_drug_class: e.target.value }))}
                  >
                    {DRUG_SWITCH_OPTIONS.map((opt) => (
                      <option key={opt.value || 'default'} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>

                <label className="what-if-control">
                  <span>Exercise Level</span>
                  <select
                    value={scenario.exercise_level}
                    onChange={(e) => setScenario((prev) => ({ ...prev, exercise_level: parseInt(e.target.value, 10) }))}
                  >
                    <option value={0}>Rarely / Never</option>
                    <option value={1}>1-2 times/week</option>
                    <option value={2}>3-4 times/week</option>
                    <option value={3}>Daily / almost daily</option>
                  </select>
                </label>

                <label className="what-if-control">
                  <span>Sodium Reduction: {scenario.sodium_reduction_percent}%</span>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="5"
                    value={scenario.sodium_reduction_percent}
                    onChange={(e) => setScenario((prev) => ({ ...prev, sodium_reduction_percent: parseInt(e.target.value, 10) }))}
                  />
                </label>

                <label className="what-if-control">
                  <span>Salt Intake: {scenario.salt_intake_mg} mg/day</span>
                  <input
                    type="range"
                    min="1800"
                    max="5000"
                    step="100"
                    value={scenario.salt_intake_mg}
                    onChange={(e) => setScenario((prev) => ({ ...prev, salt_intake_mg: parseInt(e.target.value, 10) }))}
                  />
                </label>

                <label className="what-if-control">
                  <span>Medication Adherence: {scenario.adherence_percent}%</span>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={scenario.adherence_percent}
                    onChange={(e) => setScenario((prev) => ({ ...prev, adherence_percent: parseInt(e.target.value, 10) }))}
                  />
                </label>

                <label className="what-if-control">
                  <span>Stress Intervention: {scenario.stress_intervention_percent}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={scenario.stress_intervention_percent}
                    onChange={(e) => setScenario((prev) => ({ ...prev, stress_intervention_percent: parseInt(e.target.value, 10) }))}
                  />
                </label>

                <label className="what-if-control">
                  <span>Sleep Hours: {scenario.sleep_hours.toFixed(1)} h</span>
                  <input
                    type="range"
                    min="4"
                    max="10"
                    step="0.5"
                    value={scenario.sleep_hours}
                    onChange={(e) => setScenario((prev) => ({ ...prev, sleep_hours: parseFloat(e.target.value) }))}
                  />
                </label>

                <label className="what-if-control">
                  <span>Sleep Quality</span>
                  <select
                    value={scenario.sleep_quality}
                    onChange={(e) => setScenario((prev) => ({ ...prev, sleep_quality: parseInt(e.target.value, 10) }))}
                  >
                    <option value={0}>Poor</option>
                    <option value={1}>Average</option>
                    <option value={2}>Good</option>
                  </select>
                </label>

                <label className="what-if-control">
                  <span>Weight Change: {scenario.weight_change_kg > 0 ? '+' : ''}{scenario.weight_change_kg} kg</span>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={scenario.weight_change_kg}
                    onChange={(e) => setScenario((prev) => ({ ...prev, weight_change_kg: parseInt(e.target.value, 10) }))}
                  />
                </label>

              </div>

              <div className="what-if-actions">
                <button type="button" onClick={runWhatIf} className="what-if-btn" disabled={whatIfLoading}>
                  {whatIfLoading ? 'Running Simulation...' : 'Run What-If'}
                </button>
                <button type="button" onClick={resetWhatIf} className="what-if-reset-btn">
                  Reset Scenario
                </button>
              </div>

              {risk_summary && (
                <div className="risk-summary">
                  <span>Baseline Risk: {risk_summary.baseline}</span>
                  <span>Projected Week 4: {risk_summary.projected_week4}</span>
                  <span>Projected BP: {risk_summary.projected_bp}</span>
                </div>
              )}

              {whatIfError && <p className="what-if-error">{whatIfError}</p>}
            </motion.div>

            {/* BP Simulation */}
            {simulation?.best_trajectory?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.66 }}
                className="simulation-section"
              >
                <div className="simulation-header">
                  <h3>4-Week BP Simulation</h3>
                  <p>Projected response for {best_recommendation.drug_name}</p>
                </div>

                <div className="trajectory-grid">
                  {simulation.best_trajectory.map((point) => (
                    <div className="trajectory-card" key={point.week}>
                      <span className="trajectory-week">Week {point.week}</span>
                      <span className="trajectory-bp">{point.systolic}/{point.diastolic}</span>
                      <span className={`trajectory-risk risk-${point.risk.toLowerCase().replace(/\s+/g, '-')}`}>{point.risk}</span>
                    </div>
                  ))}
                </div>

                {simulation?.drug_comparisons?.length > 0 && (
                  <div className="drug-comparison">
                    <div className="comparison-header">
                      <h4>Drug Comparison (Week 4)</h4>
                      <div className="metric-toggle">
                        <button
                          type="button"
                          className={chartMetric === 'systolic' ? 'active' : ''}
                          onClick={() => setChartMetric('systolic')}
                        >
                          Systolic
                        </button>
                        <button
                          type="button"
                          className={chartMetric === 'diastolic' ? 'active' : ''}
                          onClick={() => setChartMetric('diastolic')}
                        >
                          Diastolic
                        </button>
                      </div>
                    </div>
                    <div className="trajectory-chart-card">
                      <svg className="trajectory-chart" viewBox="0 0 680 260" role="img" aria-label={`Drug comparison ${chartMetric} blood pressure trajectories over 4 weeks`}>
                        {[0, 1, 2, 3, 4].map((week) => {
                          const x = 56 + (week / 4) * 600;
                          return (
                            <g key={`x-${week}`}>
                              <line x1={x} y1="20" x2={x} y2="214" className="chart-grid-v" />
                              <text x={x} y="236" textAnchor="middle" className="chart-axis-text">W{week}</text>
                            </g>
                          );
                        })}
                        {[0, 1, 2, 3, 4].map((tick) => {
                          const value = chartMax - ((chartMax - chartMin) / 4) * tick;
                          const y = 20 + (tick / 4) * 194;
                          return (
                            <g key={`y-${tick}`}>
                              <line x1="56" y1={y} x2="656" y2={y} className="chart-grid-h" />
                              <text x="48" y={y + 4} textAnchor="end" className="chart-axis-text">{Math.round(value)}</text>
                            </g>
                          );
                        })}
                        {chartTrajectories.map((item, idx) => (
                          <path
                            key={item.drug_class}
                            d={buildChartPath(item.trajectory, chartMetric, chartMin, chartMax, 680, 260, 56, 20, 46)}
                            className="chart-line"
                            style={{ stroke: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                        ))}
                      </svg>
                      <div className="chart-legend">
                        {chartTrajectories.map((item, idx) => (
                          <div className="chart-legend-item" key={`legend-${item.drug_class}`}>
                            <span className="chart-swatch" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                            <span>{item.drug_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="comparison-list">
                      {simulation.drug_comparisons.map((item) => {
                        const finalPoint = item.trajectory[item.trajectory.length - 1];
                        return (
                          <div className="comparison-row" key={item.drug_class}>
                            <span className="comparison-drug">{item.drug_name}</span>
                            <span className="comparison-bp">{finalPoint.systolic}/{finalPoint.diastolic}</span>
                            <span className="comparison-risk">{finalPoint.risk}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="disclaimer"
            >
              {disclaimer}
            </motion.div>
          </div>

          {/* Right: Avatar & AI Tips */}
          <div className="results-sidebar">
            {/* Digital Twin Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="avatar-section"
            >
              <h3>Your Digital Twin</h3>
              <Avatar gender={patient_summary.gender} recommendations={all_recommendations} />
            </motion.div>
          </div>
        </div>
        )}

        {resultsView === 'insights' && (
          <motion.div
            key="insights-view"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="insights-page"
          >
            <div className="insights-top">
              <h2>AI Health Insights</h2>
              <p>Personalized guidance based on your profile, model recommendations, and scenario state.</p>
            </div>
            {ai_tips && ai_tips.length > 0 ? (
              <div className="ai-tips-section ai-tips-landscape">
                <div className="ai-tips-header">
                  <span className="gemini-icon">AI</span>
                  <h3>Actionable Tips</h3>
                  <span className="powered-by">Powered by Gemini</span>
                </div>
                <div className="ai-tips-list">
                  {ai_tips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.06 }}
                      className="ai-tip-card"
                    >
                      <span className="tip-number">{index + 1}</span>
                      <div className="ai-tip-content">
                        {normalizeTipLines(tip).map((line, lineIndex) => (
                          <p key={`${index}-${lineIndex}`} className="tip-line">{line}</p>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-insights">No AI insights available yet. Run a prediction or what-if simulation.</div>
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="disclaimer"
            >
              This is just an AI recommendation. Please consult a physician before making any medication or treatment decisions.
            </motion.div>
          </motion.div>
        )}

        {/* New Assessment Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewAssessment}
          className="new-assessment-btn"
        >
          Start New Assessment
        </motion.button>
      </div>
    </div>
  );
};

export default ResultsPage;
