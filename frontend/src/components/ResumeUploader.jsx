import React, { useState, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';

export const ResumeUploader = ({ onUploadSuccess, onClear, initialFileName = '' }) => {
  const { showError, showSuccess } = useNotification();
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(initialFileName);
  const [pipelineState, setPipelineState] = useState(''); // '', 'uploading', 'extracting', 'understanding', 'identifying', 'preparing', 'done'
  const [percent, setPercent] = useState(0);

  const simulateProgress = (startPercent, endPercent, duration, nextState, callback) => {
    let current = startPercent;
    const interval = 30; // ms
    const step = (endPercent - startPercent) / (duration / interval);
    
    const timer = setInterval(() => {
      current += step;
      if (current >= endPercent) {
        clearInterval(timer);
        setPercent(endPercent);
        if (nextState) setPipelineState(nextState);
        if (callback) callback();
      } else {
        setPercent(Math.floor(current));
      }
    }, interval);
  };

  const processUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      showError('Please upload a valid PDF resume file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError('Resume file size must be less than 10MB.');
      return;
    }

    setFileName(file.name);
    setPipelineState('uploading');
    setPercent(0);

    // Step 1: Uploading Resume (0% -> 25%)
    simulateProgress(0, 25, 600, 'extracting', () => {
      // Step 2: Extracting Text (25% -> 50%)
      simulateProgress(25, 50, 700, 'understanding', () => {
        // Step 3: Understanding Projects (50% -> 70%)
        simulateProgress(50, 70, 800, 'identifying', async () => {
          // Trigger actual API analysis call
          try {
            const formData = new FormData();
            formData.append('resume', file);
            
            const response = await api.analyzeResume(formData);
            
            if (response.status === 'success' && response.data) {
              // Step 4: Identifying Skills & Preparing (70% -> 100%)
              simulateProgress(70, 100, 600, 'done', () => {
                showSuccess('Resume analyzed successfully!');
                onUploadSuccess(file, response.data);
              });
            } else {
              throw new Error('Analysis failed');
            }
          } catch (err) {
            console.error('Resume upload error:', err);
            setPipelineState('');
            setFileName('');
            showError(err.message || 'Failed to process resume. Please try again.');
            if (onClear) onClear();
          }
        });
      });
    });
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processUpload(e.target.files[0]);
    }
  };

  const triggerClear = () => {
    setFileName('');
    setPipelineState('');
    setPercent(0);
    if (onClear) onClear();
  };

  return (
    <div className="w-full font-chakra">
      {!fileName ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-purple-500 bg-purple-500/5' 
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/20'
          }`}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            id="resume-file-input"
            className="hidden"
          />
          <label htmlFor="resume-file-input" className="cursor-pointer block">
            <div className="w-16 h-16 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:scale-105 transition-transform">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1.5">Drag & drop your resume</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              Support PDF formats up to 10MB. We extract experience profiles to customize your practice.
            </p>
            <span className="mt-4 inline-flex px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-850 text-xs font-bold text-zinc-300 border border-zinc-850 hover:text-white transition-all select-none">
              Browse Files
            </span>
          </label>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-[#0C0C0E]/50 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 truncate">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0 text-lg">📄</div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate max-w-[220px]">{fileName}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {pipelineState === 'done' ? 'Ready' : 'Analyzing'}
                </p>
              </div>
            </div>
            {pipelineState === 'done' && (
              <button
                type="button"
                onClick={triggerClear}
                className="text-xs px-3 py-1.5 font-bold rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>

          {/* Progress / Pipeline visualizer */}
          {pipelineState !== 'done' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 pr-1">
                <span className="capitalize">
                  {pipelineState === 'uploading' && 'Uploading Resume...'}
                  {pipelineState === 'extracting' && 'Extracting text...'}
                  {pipelineState === 'understanding' && 'Understanding projects...'}
                  {pipelineState === 'identifying' && 'Identifying skills...'}
                  {pipelineState === 'preparing' && 'Preparing practice settings...'}
                </span>
                <span>{percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
