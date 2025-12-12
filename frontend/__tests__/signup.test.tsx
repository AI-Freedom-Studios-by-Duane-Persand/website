import { render, screen, fireEvent } from '@testing-library/react';
import SignupPage from '../app/signup/page';

describe('SignupPage', () => {
  it('renders signup form', () => {
    render(<SignupPage />);
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/tenant|company name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows error on invalid signup', async () => {
    render(<SignupPage />);
    fireEvent.change(screen.getByPlaceholderText(/tenant|company name/i), { target: { value: 'TestCo' } });
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await screen.findByText(/signup failed/i);
  });
}
