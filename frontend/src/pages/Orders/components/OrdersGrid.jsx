import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPaiseToRupees, formatDate } from '@/utils/formatters';
import { CalendarDays } from 'lucide-react';

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

export default function OrdersGrid({ orders, onOrderClick }) {
  if (!orders || orders.length === 0) return <p className="text-slate-500 py-4 px-2">No orders found.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((o) => (
        <Card
          key={o.id}
          className="cursor-pointer hover:shadow-md transition-shadow border-slate-200"
          onClick={() => onOrderClick(o)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-base">{o.customer_name || `Customer #${o.customer_id}`}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <CalendarDays className="h-3 w-3" /> Due: {formatDate(o.due_date)}
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">#{o.id}</span>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-slate-600 truncate">
              {o.items?.map(i => `${i.menu_item_name || 'Item'} ×${i.quantity}`).join(', ') || '—'}
            </p>
            <p className="text-xl font-bold mt-2">{formatPaiseToRupees(o.total_paise)}</p>
          </CardContent>
          <CardFooter className="pt-3 border-t bg-slate-50/50 flex justify-between items-center ">
            <Badge className={`${PAYMENT_COLORS[o.payment_status] || 'bg-slate-400'} text-white text-xs`}>
              {o.payment_status}
            </Badge>
            <Badge className={`${STATUS_COLORS[o.status] || 'bg-slate-400'} text-white text-xs`}>
              {o.status.replace('_', ' ')}
            </Badge>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
