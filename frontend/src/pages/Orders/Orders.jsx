import React, { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import { fetchOrders } from '@/api/orders';
import OrdersTable from './components/OrdersTable';
import OrdersGrid from './components/OrdersGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LayoutGrid, List, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['pending', 'confirmed', 'in_progress', 'ready', 'delivered', 'cancelled'];
const PAYMENT_OPTIONS = ['unpaid', 'partial', 'paid'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState([]);
  const [dueDateFilter, setDueDateFilter] = useState('');

  const { user } = useAuthStore();
  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const navigate = useNavigate();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter.length > 0) params.status_filter = statusFilter.join(',');
      if (paymentFilter.length > 0) params.payment_status = paymentFilter.join(',');
      if (dueDateFilter) params.due_date = dueDateFilter;
      const data = await fetchOrders(params);
      setOrders(data);
    } catch (err) {
      toast.error("Error loading orders", {
        description: err.response?.data?.detail || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => loadOrders(), 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, statusFilter, paymentFilter, dueDateFilter]);

  const toggleStatusFilter = (s) => {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const togglePaymentFilter = (p) => {
    setPaymentFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleOrderClick = (order) => {
    navigate(`/orders/${order.id}`);
  };

  // Quick date helpers
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="text-slate-500">Track and manage customer orders.</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 border text-slate-500 dark:text-slate-300 dark:border-white">
            <Button variant={viewMode === 'grid' ? "default" : "ghost"} size="sm" className="h-8 px-2 shadow-none dark:shadow-none hover:shadow-none" onClick={() => setViewMode('grid')} title="Grid View">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'table' ? "default" : "ghost"} size="sm" className="h-8 px-2 shadow-none dark:shadow-none hover:shadow-none" onClick={() => setViewMode('table')} title="Table View">
              <List className="h-4 w-4" />
            </Button>
          </div>
          {canEdit && (
            <Button onClick={() => navigate('/orders/new')} className="shadow-sm font-semibold">
              <Plus className="h-4 w-4 mr-1" /> New Order
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Quick date buttons */}
          <div className="flex gap-1.5 flex-wrap">
            <Button variant={dueDateFilter === today ? "default" : "outline"} className="shadow-none dark:shadow-none hover:shadow-none" size="sm" onClick={() => setDueDateFilter(dueDateFilter === today ? '' : today)}>
              Today
            </Button>
            <Button variant={dueDateFilter === tomorrow ? "default" : "outline"} className="shadow-none dark:shadow-none hover:shadow-none" size="sm" onClick={() => setDueDateFilter(dueDateFilter === tomorrow ? '' : tomorrow)}>
              Tomorrow
            </Button>
            <Input type="date" value={dueDateFilter} onChange={(e) => setDueDateFilter(e.target.value)} className="w-36 h-8 text-sm" />
          </div>
          {!loading && (
            <Badge variant="secondary" className="text-xs whitespace-nowrap">{orders.length} order{orders.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>

        {/* Status pills */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 self-center mr-1">Status:</span>
          {STATUS_OPTIONS.map(s => (
            <Button key={s} variant={statusFilter.includes(s) ? "default" : "outline"} size="sm" className="h-7 text-xs capitalize" onClick={() => toggleStatusFilter(s)}>
              {s.replace('_', ' ')}
            </Button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 self-center mr-1">Payment:</span>
          {PAYMENT_OPTIONS.map(p => (
            <Button key={p} variant={paymentFilter.includes(p) ? "default" : "outline"} size="sm" className="h-7 text-xs capitalize" onClick={() => togglePaymentFilter(p)}>
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading orders...</div>
      ) : viewMode === 'grid' ? (
        <OrdersGrid orders={orders} onOrderClick={handleOrderClick} />
      ) : (
        <OrdersTable orders={orders} onOrderClick={handleOrderClick} />
      )}
    </div>
  );
}
