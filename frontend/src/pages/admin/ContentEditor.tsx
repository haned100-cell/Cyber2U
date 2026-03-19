import React, { useState } from 'react';
import { api, Campaign } from '../../lib/api';

export const ContentEditor: React.FC = () => {
  const [title, setTitle] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'review' | 'approved'>('draft');
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setMessage('');

    if (!title.trim()) {
      setMessage('Title is required.');
      return;
    }

    try {
      let campaign: Campaign;
      if (campaignId) {
        campaign = await api.updateCampaign(campaignId, {
          title,
          description,
          subjectLine,
          emailBodyText: content,
          caseStudyContent: content,
        });
      } else {
        campaign = await api.createCampaign({
          title,
          description,
          campaignType: 'weekly_email',
          subjectLine,
          emailBodyText: content,
          caseStudyContent: content,
        });
        setCampaignId(campaign.id);
      }

      if (status === 'review') {
        await api.submitCampaignForReview(campaign.id);
      }

      if (status === 'approved') {
        await api.submitCampaignForReview(campaign.id);
        await api.approveCampaign(campaign.id, 'Approved from content editor workflow');
      }

      setMessage(`Saved campaign #${campaign.id} with status ${status}.`);
    } catch (error) {
      console.error('Save campaign error:', error);
      setMessage('Failed to save campaign.');
    }
  };

  return (
    <div className="content-editor">
      <h2>Create/Edit Campaign Content</h2>
      <div className="editor-form">
        <div className="form-group">
          <label>Campaign Title</label>
          <input
            type="text"
            placeholder="e.g., 'Phishing Awareness Week'"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Brief description of this campaign"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Email Subject</label>
          <input
            type="text"
            placeholder="Email subject line"
            value={subjectLine}
            onChange={(e) => setSubjectLine(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Email Body</label>
          <textarea
            placeholder="Write your email content here..."
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
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
        {campaignId && <p>Editing Campaign ID: {campaignId}</p>}
        {message && <p>{message}</p>}
      </div>
    </div>
  );
};
