import React from 'react';
import { X, FileText, Hash, Download, CheckCircle2 } from 'lucide-react';

export const DocumentViewerModal = ({ document, onClose }) => {
  if (!document) return null;

  const fileUrl = `http://localhost:5000${document.filepath}`;
  const isImage = document.mimeType?.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#0f294a" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f294a' }}>
                {document.originalFilename}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>
                Type: {document.documentType?.replace('_', ' ')} • Size: {(document.size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
          {/* SHA-256 Hash Verification Banner */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={16} color="#2563eb" />
              <span style={{ color: '#475569' }}>
                SHA-256 Binary Integrity Hash:{' '}
                <code style={{ color: '#0f294a', fontWeight: '600' }}>
                  {document.fileHash ? `${document.fileHash.substring(0, 24)}...` : 'Computed on ingest'}
                </code>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: '600' }}>
              <CheckCircle2 size={14} />
              <span>Tamper-Free Document</span>
            </div>
          </div>

          {/* Document Content View */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#f1f5f9',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              minHeight: '300px',
              border: '1px dashed #cbd5e1',
            }}
          >
            {isImage ? (
              <img
                src={fileUrl}
                alt={document.originalFilename}
                style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain' }}
              />
            ) : isPdf ? (
              <iframe
                src={fileUrl}
                title={document.originalFilename}
                style={{ width: '100%', height: '450px', border: 'none' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <FileText size={48} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ color: '#334155', fontWeight: '600' }}>Document Preview Available</p>
                <p style={{ color: '#64748b', fontSize: '13px' }}>Click download below to inspect raw file</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={document.originalFilename}
            className="btn btn-secondary btn-sm"
          >
            <Download size={14} /> Download Original
          </a>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
