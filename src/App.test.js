import { render, screen } from '@testing-library/react';
import App from './App';

test('renders agentic sales consultant header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Agentic Sales Consultant/i);
  expect(headerElement).toBeInTheDocument();
});