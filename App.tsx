
import React, { useState, useMemo, useEffect } from 'react';
import { NARRATION_TEMPLATES } from './data/templates';
import { NarrationTemplate, UserInputs } from './types';
import { refineNarration } from './services/geminiService';
import { 
  Search, 
  FileText, 
  Copy, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Info,
  Clock,
  Briefcase
} from 'lucide-react';

const DISCLAIMER_SENTENCE = "Fee does not include follow-up or escalation services which will be quoted for separately as required.";

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<NarrationTemplate | null>(null);
  const [inputs, setInputs] = useState<UserInputs>({
    placeholders: {},
    additionalNotes: '',
    isUrgent: false,
    urgencyFee: '',
    includeTimeSpent: false,
    timeSpentDetails: ''
  });
  const [copied, setCopied] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [finalText, setFinalText] = useState('');

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    return NARRATION_TEMPLATES.filter(t => 
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subCategory.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Extract placeholders from template string
  const activePlaceholders = useMemo(() => {
    if (!selectedTemplate) return [];
    const matches = selectedTemplate.description.match(/<[^>]+>/g);
    return matches ? Array.from(new Set(matches)) : [];
  }, [selectedTemplate]);

  // Update placeholders when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const newPlaceholders: Record<string, string> = {};
      activePlaceholders.forEach(p => {
        newPlaceholders[p] = inputs.placeholders[p] || '';
      });
      setInputs(prev => ({ ...prev, placeholders: newPlaceholders }));
    }
  }, [selectedTemplate, activePlaceholders]);

  // Generate the preview text
  const generatedText = useMemo(() => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.description;

    // Replace placeholders
    Object.entries(inputs.placeholders).forEach(([placeholder, value]) => {
      const displayValue = (value as string).trim() || placeholder;
      text = text.split(placeholder).join(displayValue);
    });

    // Add Urgency
    if (inputs.isUrgent) {
      const urgencyStr = inputs.urgencyFee 
        ? ` Note: An urgency fee of ${inputs.urgencyFee} has been applied for this application.`
        : ` Note: An urgency fee for this urgent application has been clearly stated.`;
      text += urgencyStr;
    }

    // Add Time Spent
    if (inputs.includeTimeSpent) {
      const timeStr = inputs.timeSpentDetails 
        ? ` Total time spent since last invoice: ${inputs.timeSpentDetails}.`
        : ` Time spent since last invoice dated _________ has been included.`;
      text += timeStr;
    }

    return text;
  }, [selectedTemplate, inputs]);

  // Initialize finalText
  useEffect(() => {
    setFinalText(generatedText);
  }, [generatedText]);

  const handlePlaceholderChange = (p: string, val: string) => {
    setInputs(prev => ({
      ...prev,
      placeholders: { ...prev.placeholders, [p]: val }
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (!inputs.additionalNotes) {
      alert("Please provide additional coordination notes to integrate.");
      return;
    }
    setIsRefining(true);
    const refined = await refineNarration(generatedText, inputs.additionalNotes);
    setFinalText(refined);
    setIsRefining(false);
  };

  // Helper to render text with special formatting for the disclaimer
  const renderFormattedText = (text: string) => {
    if (!text.includes(DISCLAIMER_SENTENCE)) {
      return <span>{text}</span>;
    }

    const parts = text.split(DISCLAIMER_SENTENCE);
    return (
      <>
        <span>{parts[0]}</span>
        <span className="italic">{DISCLAIMER_SENTENCE}</span>
        <span>{parts.slice(1).join(DISCLAIMER_SENTENCE)}</span>
      </>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <FileText size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">XP Narration Builder</h1>
          </div>
          <div className="hidden md:block text-slate-500 font-medium">
             July 2025 Edition
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Selection & Configuration */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Search & Select */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">1. Select Application Type</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search categories (e.g. Critical Skills)..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
              {filteredTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`w-full text-left p-3 rounded-lg transition-colors group ${
                    selectedTemplate?.id === t.id 
                    ? 'bg-blue-50 border-blue-200 border' 
                    : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <p className="text-xs font-semibold text-blue-600 mb-1">{t.category}</p>
                  <p className={`font-medium ${selectedTemplate?.id === t.id ? 'text-blue-900' : 'text-slate-700'}`}>
                    {t.subCategory}
                  </p>
                  <p className="text-xs text-slate-500 group-hover:text-slate-600 mt-0.5">{t.type}</p>
                </button>
              ))}
              {filteredTemplates.length === 0 && (
                <div className="p-8 text-center text-slate-400 italic">
                  No matching application types found.
                </div>
              )}
            </div>
          </section>

          {/* Placeholders & Notes */}
          {selectedTemplate && (
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-4 block">2. Fill Details</label>
                <div className="grid grid-cols-1 gap-4">
                  {activePlaceholders.map(p => (
                    <div key={p}>
                      <label className="font-medium text-slate-700 mb-1 block">
                        {p.replace(/[<>]/g, '')}
                      </label>
                      <input 
                        type="text" 
                        value={inputs.placeholders[p] || ''}
                        onChange={(e) => handlePlaceholderChange(p, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                        placeholder={`Enter ${p.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3 block">3. Adjustments</label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-orange-500" />
                      <span className="font-medium text-slate-700">Urgent Application?</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 rounded" 
                      checked={inputs.isUrgent}
                      onChange={(e) => setInputs(prev => ({ ...prev, isUrgent: e.target.checked }))}
                    />
                  </div>
                  {inputs.isUrgent && (
                    <input 
                      type="text" 
                      placeholder="e.g. R2,500 urgency fee"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      value={inputs.urgencyFee}
                      onChange={(e) => setInputs(prev => ({ ...prev, urgencyFee: e.target.value }))}
                    />
                  )}

                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-500" />
                      <span className="font-medium text-slate-700">Include Time Spent?</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 rounded" 
                      checked={inputs.includeTimeSpent}
                      onChange={(e) => setInputs(prev => ({ ...prev, includeTimeSpent: e.target.checked }))}
                    />
                  </div>
                  {inputs.includeTimeSpent && (
                    <input 
                      type="text" 
                      placeholder="e.g. 5 hours since 01/01/2025"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      value={inputs.timeSpentDetails}
                      onChange={(e) => setInputs(prev => ({ ...prev, timeSpentDetails: e.target.value }))}
                    />
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Output Preview */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white rounded-xl shadow-lg border border-slate-200 h-full flex flex-col min-h-[600px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 rounded-t-xl text-white">
              <div className="flex items-center gap-2">
                <Briefcase size={20} className="text-blue-400" />
                <h2 className="font-bold">Narration Preview</h2>
              </div>
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-semibold"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            
            <div className="flex-1 p-8">
              {selectedTemplate ? (
                <div className="space-y-8">
                  {/* Final Text Display - Wrapped in a div that forces 11pt */}
                  <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 relative group narration-content">
                    <div className="text-slate-800 leading-relaxed">
                      {finalText ? renderFormattedText(finalText) : 'Generating narration...'}
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Draft Narration</span>
                    </div>
                  </div>

                  {/* Refinement Section */}
                  <div className="space-y-4 pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Sparkles size={18} className="text-blue-600" />
                      <h3 className="font-bold">Advanced: Integration & Refinement</h3>
                    </div>
                    <p className="text-slate-500">
                      Add additional coordination, time spent, or specific case nuances. Our AI will blend them seamlessly into the narration.
                    </p>
                    <textarea 
                      placeholder="e.g. Additional 3 hours spent coordinating with the client's local HR team and vetting multiple versions of the support letter."
                      className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      value={inputs.additionalNotes}
                      onChange={(e) => setInputs(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    />
                    <button 
                      onClick={handleRefine}
                      disabled={isRefining || !inputs.additionalNotes}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                    >
                      {isRefining ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Blending Details...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Integrate & Refine with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <FileText size={40} className="text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-500">No application type selected</p>
                    <p>Select a category from the left sidebar to begin.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Rules */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-xl">
              <div className="flex items-start gap-3">
                <Info size={16} className="text-slate-400 mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">General Rules & Notes</p>
                  <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                    <li>Yellow highlights in documentation must be amended per Applicant.</li>
                    <li>Additional coordination time should be added to the narration.</li>
                    <li>Urgency fees must be clearly stated.</li>
                    <li>All text is rendered in Calibri 11pt.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-200 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
};

export default App;
