import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Invoice, InvoiceStatus } from '@/lib/types';

const STATUS_VARIANT: Record<InvoiceStatus, 'success' | 'destructive' | 'secondary' | 'warning'> = {
  PAID: 'success',
  OPEN: 'secondary',
  FAILED: 'destructive',
  VOID: 'warning',
};

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No invoices yet"
        description="Your first invoice will appear here once your current billing period closes."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="text-foreground font-medium">{invoice.number}</TableCell>
            <TableCell>
              {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
            </TableCell>
            <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[invoice.status]}>{invoice.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
