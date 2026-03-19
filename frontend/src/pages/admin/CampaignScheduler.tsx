import React, { useState } from 'react';

export const CampaignScheduler: React.FC = () => {
  const [sendTime, setSendTime] = useState('');
  const [recipientCount, setRecipientCount] = useState(0);

  const handleSchedule = async () => {
    // TODO: POST to /api/campaigns/:id/schedule
    console.log('Scheduling campaign:', { sendTime, recipientCount });
  };

  return (
    <div className="campaign-scheduler">
      <h2>Schedule Campaign</h2>
      <div className="scheduler-form">
        <div className="form-group">
          <label>Send Date & Time</label>
          <input type="datetime-local" value={sendTime} onChange={(e) => setSendTime(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Recipients</label>
          <p>{recipientCount} users will receive this campaign</p>
        </div>
        <button onClick={handleSchedule}>Schedule Send</button>
      </div>
    </div>
  );
};
