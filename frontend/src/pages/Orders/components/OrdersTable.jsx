import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatPaiseToRupees } from '@/utils/formatters';

const STATUS_COLORS = {
  confirmed: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  ready: 'bg-green-500',
  delivered: 'bg-green-700',
  cancelled: 'bg-red-500',
};

const PAYMENT_COLORS = {
  unpaid: 'bg-red-500',
  partial: 'bg-amber-400',
  paid: 'bg-green-500',
};

export default function OrdersTable({ orders, onOrderClick }) {
  if (!orders || orders.length === 0) return <p className="text-slate-500 py-4">No orders found.</p>;

  return (
    <div className=" border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-16">#</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Payment</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow
              key={o.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => onOrderClick(o)}
            >
              <TableCell className="font-mono text-sm text-slate-500">{o.id}</TableCell>
              <TableCell className="font-medium">{o.customer_name || `Customer #${o.customer_id}`}</TableCell>
              <TableCell>{o.due_date}</TableCell>
              <TableCell className="text-sm text-slate-600 max-w-[200px] truncate">
                {o.items?.map(i => `${i.menu_item_name || 'Item'} ×${i.quantity}`).join(', ') || '—'}
              </TableCell>
              <TableCell className="text-right font-medium">{formatPaiseToRupees(o.total_paise)}</TableCell>
              <TableCell className="text-center">
                <Badge className={`${PAYMENT_COLORS[o.payment_status] || 'bg-slate-400'} text-white text-xs`}>
                  {o.payment_status}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge className={`${STATUS_COLORS[o.status] || 'bg-slate-400'} text-white text-xs`}>
                  {o.status.replace('_', ' ')}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
