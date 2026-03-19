import React, { useState, useEffect } from 'react';

export const ContentEditor: React.FC = () => {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'review' | 'approved'>('draft');

  const handleSave = async () => {
    // TODO: POST to /api/campaigns
    console.log('Saving content:', { content, status });
  };

  return (
    <div className="content-editor">
      <h2>Create/Edit Campaign Content</h2>
      <div className="editor-form">
        <div className="form-group">
          <label>Campaign Title</label>
          <input type="text" placeholder="e.g., 'Phishing Awareness Week'" />
        </div>
        <div className="form-group">
          <label>Email Subject</label>
          <input type="text" placeholder="Email subject line" />
        </div>
        <div className="form-group">
          <label>Email Body</label>
          <textarea placeholder="Write your email content here..." rows={10} />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="draft">Draft</option>
            <option value="review">Pending Review</option>
            <option value="approved">Approved</option>
          </select>
        </div>
        <button onClick={handleSave}>Save Content</button>
      </div>
    </div>
  );
};
