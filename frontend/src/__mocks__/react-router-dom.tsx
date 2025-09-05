import React from 'react';

const mockNavigate = jest.fn();

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const Routes = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Route = ({ element }: { element: React.ReactNode }) => <>{element}</>;
export const Link = ({ children, to }: { children: React.ReactNode; to: string }) => (
  <a href={to}>{children}</a>
);
export const useNavigate = () => mockNavigate;
export const useLocation = () => ({ pathname: '/' });
export const useParams = () => ({});