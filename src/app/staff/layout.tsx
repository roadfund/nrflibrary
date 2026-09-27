import { StaffShell } from '@/components/layout/staff-shell';
import { requireStaff } from '@/lib/auth';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireStaff();

  return <StaffShell user={user}>{children}</StaffShell>;
}
