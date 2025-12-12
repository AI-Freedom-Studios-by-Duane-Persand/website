import { render, screen, fireEvent } from '@testing-library/react';
import CampaignsPage from '../app/app/campaigns/page';

describe('CampaignsPage', () => {
  it('renders campaign creation form', () => {
    render(<CampaignsPage />);
    expect(screen.getByText(/campaigns/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/campaign name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/objective/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create campaign/i })).toBeInTheDocument();
  });

  it('shows error on failed campaign creation', async () => {
    render(<CampaignsPage />);
    fireEvent.change(screen.getByPlaceholderText(/campaign name/i), { target: { value: 'Test Campaign' } });
    fireEvent.change(screen.getByPlaceholderText(/objective/i), { target: { value: 'Awareness' } });
    fireEvent.click(screen.getByRole('button', { name: /create campaign/i }));
    await screen.findByText(/error creating campaign|failed to create campaign/i);
  });
});
