import { TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function InvalidLinkAlert({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="warning" className="mb-4">
      <TriangleAlert />
      <AlertTitle>That link is invalid or has expired</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
