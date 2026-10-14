import React, { useState, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { API_BASE_URL } from '../config';

export const ResumeUploader = ({ onUploadSuccess, onClear, initialFileName = '' }) => {
  const { showError, showSuccess } = useNotification();
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(initialFileName);
  const [pipelineState, setPipelineState] = useState(''); // '', 'uploading', 'extracting', 'done'
  const [percent, setPercent] = useState(0);
  const [inProgress, setInProgress] = useState(false);

  const processUpload = (file) => {
    if (inProgress) return;
    if (!file || file.type !== 'application/pdf') {
      showError('Please upload a valid PDF resume file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError('Resume file size must be less than 10MB.');
      return;
    }

    setFileName(file.name);
    setInProgress(true);
    setPipelineState('uploading');
    setPercent(0);

    const formData = new FormData();
    formData.append('resume', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/api/interview/analyze-resume`);
    const token = localStorage.getItem('firebaseToken');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setPercent(Math.round((event.loaded / event.total) * 100));
    };
    xhr.upload.onload = () => { setPercent(100); setPipelineState('extracting'); };

    xhr.onload = () => {
      setInProgress(false);
      let payload = null;
      try { payload = JSON.parse(xhr.responseText); } catch { payload = null; }
      if (xhr.status >= 200 && xhr.status < 300 && payload?.status === 'success' && payload.data) {
        setPipelineState('done');
        showSuccess('Resume analyzed successfully!');
        onUploadSuccess(file, payload.data);
      } else {
        setPipelineState(''); setFileName(''); setPercent(0);
        showError(payload?.message || 'Failed to process resume. Please try again.');
        if (onClear) onClear();
      }
    };

    xhr.onerror = () => {
      setInProgress(false);
      setPipelineState(''); setFileName(''); setPercent(0);
      showError('Network error while uploading resume. Please try again.');
      if (onClear) onClear();
    };

    xhr.send(formData);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processUpload(e.dataTransfer.files[0]);
  }, [inProgress]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) processUpload(e.target.files[0]);
  };

  const triggerClear = () => {
    setFileName(''); setPipelineState(''); setPercent(0); setInProgress(false);
    if (onClear) onClear();
  };

  return (
    <div style={{ width: '100%' }}>
      {!fileName ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `1.5px dashed ${dragActive ? 'var(--accent)' : 'var(--line-2)'}`,
            borderRadius: 'var(--r-lg)', padding: 44, textAlign: 'center',
            background: dragActive ? 'var(--accent-soft)' : 'var(--surface)',
            transition: 'border-color .2s, background .2s',
          }}
        >
          <input type="file" accept=".pdf" onChange={handleFileChange} id="resume-file-input" style={{ display: 'none' }} />
          <label htmlFor="resume-file-input" style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, border: '1px solid var(--line)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', margin: '0 auto 18px', color: 'var(--ink-2)' }}>
              <svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Drag &amp; drop your resume</h3>
            <p className="muted" style={{ fontSize: 13.5, maxWidth: 320, margin: '0 auto' }}>
              PDF format up to 10MB. We extract your experience profile to customise the practice.
            </p>
            <span className="btn btn--ink" style={{ marginTop: 18 }}>Browse files</span>
          </label>
        </div>
      ) : (
        <div className="card card--lg card--pad stack" style={{ gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', flex: 'none', color: 'var(--ink-2)' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6a1 1 0 01.7.3l5.4 5.4a1 1 0 01.3.7V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{fileName}</p>
                <p className="kicker" style={{ marginTop: 3 }}>{pipelineState === 'done' ? 'Ready' : 'Analyzing'}</p>
              </div>
            </div>
            {pipelineState === 'done' && (
              <button type="button" onClick={triggerClear} className="btn btn--outline btn--sm" style={{ color: 'var(--rose)', borderColor: 'var(--rose-soft)' }}>
                Remove
              </button>
            )}
          </div>

          {pipelineState !== 'done' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>
                <span>{pipelineState === 'uploading' ? 'Uploading resume…' : 'Extracting text & skills…'}</span>
                <span>{pipelineState === 'extracting' ? 'Working…' : `${percent}%`}</span>
              </div>
              <div className="meter">
                <i style={{ width: pipelineState === 'extracting' ? '100%' : `${percent}%`, opacity: pipelineState === 'extracting' ? 0.5 : 1, transition: 'width .3s' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
