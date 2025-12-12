import { render, screen, fireEvent } from '@testing-library/react';
import CreativesPage from '../app/app/creatives/page';

describe('CreativesPage', () => {
  it('renders asset upload form', () => {
    render(<CreativesPage />);
    expect(screen.getByText(/upload creative asset/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('shows error on failed upload', async () => {
    render(<CreativesPage />);
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));
    await screen.findByText(/upload error|upload failed/i);
  });
});
