import React, { useState } from 'react';
import { api, Campaign } from '../../lib/api';

export const CampaignScheduler: React.FC = () => {
  const [sendTime, setSendTime] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    const load = async () => {
      try {
        const list = await api.listCampaigns();
        setCampaigns(list);
        if (list.length > 0) {
          setSelectedCampaignId(list[0].id);
        }
      } catch (error) {
        console.error('Failed to load campaigns:', error);
        setMessage('Failed to load campaigns.');
      }
    };

    load();
  }, []);

  const handleSchedule = async () => {
    setMessage('');

    if (!selectedCampaignId) {
      setMessage('Select a campaign first.');
      return;
    }

    if (!sendTime) {
      setMessage('Choose send date and time.');
      return;
    }

    try {
      const scheduled = await api.scheduleCampaign(selectedCampaignId, new Date(sendTime).toISOString());
      setMessage(`Campaign #${scheduled.id} scheduled for ${new Date(sendTime).toLocaleString()}.`);
    } catch (error) {
      console.error('Scheduling campaign failed:', error);
      setMessage('Failed to schedule campaign.');
    }
  };

  const approvedOrReview = campaigns.filter((c) => c.status === 'approved' || c.status === 'review' || c.status === 'draft');

  return (
    <div className="campaign-scheduler">
      <h2>Schedule Campaign</h2>
      <div className="scheduler-form">
        <div className="form-group">
          <label>Campaign</label>
          <select
            value={selectedCampaignId ?? ''}
            onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
          >
            {approvedOrReview.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                #{campaign.id} {campaign.title} ({campaign.status})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Send Date & Time</label>
          <input type="datetime-local" value={sendTime} onChange={(e) => setSendTime(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Recipients</label>
          <p>Recipients are calculated at send time from active users.</p>
        </div>
        <button onClick={handleSchedule}>Schedule Send</button>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
};
