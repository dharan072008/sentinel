import React, { useState } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Send, 
  Download, 
  HelpCircle, 
  Radio, 
  Flame, 
  MapPin, 
  Clock, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { ExplainableDossier } from '../types';
import { logOperatorAction } from '../services/api';

interface ExplainableAlertDossierProps {
  dossier: ExplainableDossier | null;
  onActionComplete?: () => void;
}

export const ExplainableAlertDossier: React.FC<ExplainableAlertDossierProps> = ({
  dossier,
  onActionComplete
}) => {
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!dossier) {
    return (
      <div className="p-6 bg-[#0b1326] border border-slate-800 rounded-xl text-center font-mono text-xs text-slate-500 shadow-xl">
        Select a track or run surveillance analysis to inspect the explainable 5W incident dossier and evidence breakdown.
      </div>
    );
  }

  const { priority, five_w, operator_actions, operator_audit_log } = dossier;

  const handleAction = async (actionId: string) => {
    if (actionId === 'EXPORT_DOSSIER') {
      // Export JSON file
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossier, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${dossier.dossier_id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      return;
    }

    try {
      setIsSubmitting(true);
      await logOperatorAction(dossier.track_id, actionId, actionNotes);
      setSuccessMsg(`Action '${actionId}' successfully logged to defense audit trail.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      if (onActionComplete) onActionComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#0b1326] border border-cyan-900/50 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
      {/* Dossier Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-white tracking-wider">
            EXPLAINABLE INCIDENT DOSSIER // {dossier.track_id}
          </h2>
        </div>

        {/* Priority Badge */}
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md border"
          style={{ 
            backgroundColor: `${priority.color_hex}20`,
            borderColor: priority.color_hex,
            color: priority.color_hex
          }}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{priority.badge_label}</span>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[580px] overflow-y-auto">
        {/* Recommended Triage Banner */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Operational Recommendation:</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5">
              {priority.recommended_triage_action}
            </div>
          </div>
        </div>

        {/* 5W Explainability Section */}
        <div className="space-y-2.5">
          {/* 1. WHAT */}
          <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
            <div className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1.5 mb-1">
              <span>1. WHAT HAPPENED?</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {five_w.what}
            </p>
          </div>

          {/* 2. WHERE & WHEN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
              <div className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1.5 mb-1">
                <MapPin className="w-3 h-3" />
                <span>2. WHERE?</span>
              </div>
              <p className="text-slate-300">
                {five_w.where}
              </p>
            </div>

            <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
              <div className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3" />
                <span>3. WHEN?</span>
              </div>
              <p className="text-slate-300">
                {five_w.when}
              </p>
            </div>
          </div>

          {/* 4. WHY WAS IT UNUSUAL? */}
          <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
            <div className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3 h-3" />
              <span>4. WHY WAS IT UNUSUAL? (CONTRIBUTING EVIDENCE)</span>
            </div>
            <ul className="space-y-1 mt-1 text-slate-300 list-disc list-inside">
              {five_w.why.map((reason, i) => (
                <li key={i} className="text-[11px]">
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* 5. MULTI-SENSOR EVIDENCE BREAKDOWN */}
          <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800">
            <div className="text-[10px] font-bold text-purple-400 uppercase mb-2 flex items-center justify-between">
              <span>5. EVIDENCE FUSION WEIGHT BREAKDOWN</span>
              <span className="text-slate-400 font-normal">Score: {(priority.priority_score * 100).toFixed(0)}%</span>
            </div>
            <div className="space-y-2">
              {five_w.evidence.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{item.channel} ({item.weight_pct}%)</span>
                    <strong className="text-slate-200">+{item.weighted_contribution} pts</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, item.raw_score * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Existing Audit Log Status if logged */}
        {operator_audit_log && (
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded text-emerald-300 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <div>
              <strong>Audit Logged:</strong> {operator_audit_log.action_taken} by {operator_audit_log.operator_id} at {operator_audit_log.action_timestamp}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-2 bg-cyan-950 border border-cyan-500/50 rounded text-cyan-300 text-[11px]">
            {successMsg}
          </div>
        )}

        {/* Operator Action Decision Controls */}
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            OPERATOR ACTION DECISION // HUMAN OVERSIGHT
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {operator_actions.map(action => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                disabled={isSubmitting}
                className={`px-3 py-2 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow ${
                  action.id === 'DISPATCH_PATROL'
                    ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400'
                    : action.id === 'ACKNOWLEDGE'
                    ? 'bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-500'
                    : action.id === 'EXPORT_DOSSIER'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                    : 'bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600'
                }`}
              >
                {action.id === 'EXPORT_DOSSIER' ? <Download className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
