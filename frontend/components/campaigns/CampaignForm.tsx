import React, { useState } from 'react';

interface CampaignFormProps {
  onSubmit: (data: any) => void;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    postToMeta: false,
    publishToAds: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isCheckbox = e.target instanceof HTMLInputElement && e.target.type === 'checkbox';
    setFormData({
      ...formData,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="budget">Budget</label>
        <input
          type="number"
          id="budget"
          name="budget"
          value={formData.budget}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            name="postToMeta"
            checked={formData.postToMeta}
            onChange={handleChange}
          />
          Post to Meta
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            name="publishToAds"
            checked={formData.publishToAds}
            onChange={handleChange}
          />
          Publish to Meta Ads
        </label>
      </div>
      <button type="submit">Create Campaign</button>
    </form>
  );
};

export default CampaignForm;