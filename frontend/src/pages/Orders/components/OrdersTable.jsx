import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatPaiseToRupees, formatDate } from '@/utils/formatters';
import { ChevronUp, ChevronDown } from 'lucide-react';

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

export default function OrdersTable({ orders, onOrderClick, sortField, sortOrder, onSort }) {
  if (!orders || orders.length === 0) return <p className="text-slate-500 py-4">No orders found.</p>;

  return (
    <div className=" border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-16 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onSort('id')}>
              <div className="flex items-center space-x-1">
                <span>#</span>
                {sortField === 'id' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onSort('customer_name')}>
              <div className="flex items-center space-x-1">
                <span>Customer</span>
                {sortField === 'customer_name' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onSort('due_date')}>
              <div className="flex items-center space-x-1">
                <span>Due Date</span>
                {sortField === 'due_date' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </div>
            </TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onSort('total_paise')}>
              <div className="flex items-center justify-end space-x-1">
                <span>Total</span>
                {sortField === 'total_paise' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </div>
            </TableHead>
            <TableHead className="text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onSort('payment_status')}>
              <div className="flex items-center justify-center space-x-1">
                <span>Payment</span>
                {sortField === 'payment_status' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </div>
            </TableHead>
            <TableHead className="text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onSort('status')}>
              <div className="flex items-center justify-center space-x-1">
                <span>Status</span>
                {sortField === 'status' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </div>
            </TableHead>
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
              <TableCell>{formatDate(o.due_date)}</TableCell>
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
