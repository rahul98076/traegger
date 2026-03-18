import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { getOrder, updateOrderStatus, updateOrderPayment, deleteOrder, restoreOrder, duplicateOrder, fetchOrderAudit } from '@/api/orders';
import { getCustomer } from '@/api/customers';
import { formatPaiseToRupees } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft, Edit, Trash2, Copy, RotateCcw, Phone, MessageCircle,
  ChevronDown, History, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['confirmed', 'in_progress', 'ready', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  confirmed: 'bg-blue-500', in_progress: 'bg-amber-500',
  ready: 'bg-green-500', delivered: 'bg-green-700', cancelled: 'bg-red-500',
};
const PAYMENT_COLORS = { unpaid: 'bg-red-500', partial: 'bg-amber-400', paid: 'bg-green-500' };

const renderDiff = (log) => {
  if (!log.diff) return "No changes recorded";
  try {
    return Object.entries(log.diff).map(([key, val]) => {
      let oldVal = null;
      let newVal = val;
      if (Array.isArray(val) && val.length === 2) {
        oldVal = val[0];
        newVal = val[1];
      }
      return (
        <div key={key} className="mt-1 text-sm">
          <span className="text-slate-500">{key.replace('_', ' ')}:</span>{" "}
          {oldVal !== null && <span className="line-through text-slate-400 mr-1">{typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)}</span>}
          <span className="text-slate-900 font-medium">{typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)}</span>
        </div>
      );
    });
  } catch (e) {
    return <div className="mt-1 text-red-500 text-sm">Error rendering changes</div>;
  }
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAudit, setShowAudit] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await getOrder(id);
      setOrder(data);
      // Fetch full customer details
      try {
        const cust = await getCustomer(data.customer_id);
        setCustomer(cust);
      } catch { setCustomer(null); }
    } catch (err) {
      toast.error("Failed to load order");
      navigate('/orders');
    } finally {
      setLoading(false);
    }

    // Fetch audit logs
    try {
      const logs = await fetchOrderAudit(id);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    }
  };

  useEffect(() => { loadOrder(); }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      toast.success(`Status changed to ${newStatus}`);
      setShowStatusMenu(false);
      loadOrder();
    } catch (err) {
      toast.error("Failed to update status", { description: err.response?.data?.detail || err.message });
    }
  };

  const handleMarkPaid = async () => {
    try {
      await updateOrderPayment(id, { amount_paid_paise: order.total_paise });
      toast.success("Marked as paid");
      loadOrder();
    } catch (err) {
      toast.error("Failed to update payment");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete Order #${order.id}? It can be restored later.`)) return;
    try {
      await deleteOrder(id);
      toast.success("Order deleted");
      navigate('/orders');
    } catch (err) {
      toast.error("Failed to delete order");
    }
  };

  const handleRestore = async () => {
    try {
      await restoreOrder(id);
      toast.success("Order restored");
      loadOrder();
    } catch (err) {
      toast.error("Failed to restore order");
    }
  };

  const handleDuplicate = async () => {
    try {
      const dup = await duplicateOrder(id);
      toast.success(`Order #${dup.id} created as copy`);
      navigate(`/orders/${dup.id}`);
    } catch (err) {
      toast.error("Failed to duplicate order");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading order...</div>;
  if (!order) return <div className="p-8 text-center text-slate-500">Order not found.</div>;

  const balanceDue = order.total_paise - order.amount_paid_paise;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <Button variant="ghost" className="mb-4" onClick={() => navigate('/orders')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
      </Button>

      {/* Section 1: Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Order #{order.id}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="relative">
              <Badge
                className={`${STATUS_COLORS[order.status] || 'bg-slate-400'} text-white cursor-pointer flex items-center gap-1`}
                onClick={() => canEdit && setShowStatusMenu(!showStatusMenu)}
              >
                {order.status.replace('_', ' ')}
                {canEdit && <ChevronDown className="h-3 w-3" />}
              </Badge>
              {showStatusMenu && canEdit && (
                <div className="absolute z-10 mt-1 bg-white border  shadow-lg min-w-[140px]">
                  {STATUS_OPTIONS.map(s => (
                    <div key={s} className="px-3 py-1.5 text-sm hover:bg-slate-100 cursor-pointer capitalize"
                      onClick={() => handleStatusChange(s)}
                    >
                      {s.replace('_', ' ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Badge className={`${PAYMENT_COLORS[order.payment_status] || 'bg-slate-400'} text-white`}>
              {order.payment_status}
            </Badge>
            <span className="text-sm text-slate-500">Due: {order.due_date}</span>
            <Badge variant="outline" className="capitalize">{order.fulfillment_type}</Badge>
            {order.is_deleted && <Badge variant="destructive">Deleted</Badge>}
          </div>
        </div>

        {/* Action buttons */}
        {canEdit && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate(`/orders/${order.id}/edit`)}>
              <Edit className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            {order.payment_status !== 'paid' && (
              <Button variant="outline" size="sm" onClick={handleMarkPaid} className="text-green-600">
                Mark Paid
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
            </Button>
            {order.is_deleted && isAdmin ? (
              <Button variant="outline" size="sm" onClick={handleRestore} className="text-blue-600">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="text-red-600" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Section 2: Customer block */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold text-base">{order.customer_name || 'Unknown'}</p>
            {customer && (
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Phone className="h-3.5 w-3.5" /> {customer.phone}
                  </a>
                )}
                {customer.whatsapp && (
                  <a href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:underline">
                    <MessageCircle className="h-3.5 w-3.5" /> {customer.whatsapp}
                  </a>
                )}
                {customer.email && <p>{customer.email}</p>}
              </div>
            )}
            {order.fulfillment_type === 'delivery' && order.delivery_address && (
              <p className="mt-2 text-sm text-slate-600"><strong>Delivery:</strong> {order.delivery_address}</p>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Items table */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Items</CardTitle></CardHeader>
          <CardContent>
            <div className=" border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <React.Fragment key={item.id}>
                      <TableRow className={item.sub_items && item.sub_items.length > 0 ? "bg-slate-50" : ""}>
                        <TableCell>
                          <span className="font-medium">{item.custom_name || item.menu_item_name || `Item #${item.menu_item_id}`}</span>
                          {item.sub_items && item.sub_items.length > 0 && (
                             <Badge variant="secondary" className="ml-2 text-[10px] h-5 py-0 px-2 bg-purple-100 text-purple-700 hover:bg-purple-100">Custom Basket</Badge>
                          )}
                          {(!item.sub_items || item.sub_items.length === 0) && item.menu_item_size_unit && (
                            <span className="text-xs text-slate-500 ml-2">{item.menu_item_size_unit}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatPaiseToRupees(item.unit_price_paise)}</TableCell>
                        <TableCell className="text-right font-medium">{formatPaiseToRupees(item.line_total_paise)}</TableCell>
                      </TableRow>
                      {item.sub_items && item.sub_items.map((sub) => (
                         <TableRow key={sub.id} className="bg-slate-50/50">
                           <TableCell className="pl-8 text-slate-600 py-2">
                              <span className="text-xl leading-none text-slate-300 mr-2">↳</span>
                              {sub.menu_item_name || `Item #${sub.menu_item_id}`}
                              {sub.menu_item_size_unit && <span className="text-xs text-slate-400 ml-1">({sub.menu_item_size_unit})</span>}
                           </TableCell>
                           <TableCell className="text-center text-slate-600 py-2">{sub.quantity} <span className="text-[10px] text-slate-400">/basket</span></TableCell>
                           <TableCell className="text-right text-slate-500 py-2">{formatPaiseToRupees(sub.unit_price_paise)}</TableCell>
                           <TableCell className="text-right text-slate-500 py-2">{formatPaiseToRupees(sub.line_total_paise)}</TableCell>
                         </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Pricing block */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Pricing</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm max-w-xs ml-auto">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-medium">{formatPaiseToRupees(order.subtotal_paise)}</span></div>
              {order.discount_paise > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({order.discount_type === 'percent' ? `${order.discount_value / 100}%` : 'flat'})</span>
                  <span>-{formatPaiseToRupees(order.discount_paise)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t pt-1.5"><span>Total</span><span>{formatPaiseToRupees(order.total_paise)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600">Paid</span><span className="text-green-600 font-medium">{formatPaiseToRupees(order.amount_paid_paise)}</span></div>
              {balanceDue > 0 && (
                <div className="flex justify-between text-sm font-bold text-red-600"><span>Balance Due</span><span>{formatPaiseToRupees(balanceDue)}</span></div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Instructions */}
        {(order.special_instructions || order.internal_notes) && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-lg">Notes</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.special_instructions && (
                <div><strong>Special Instructions:</strong><p className="text-slate-600 mt-0.5">{order.special_instructions}</p></div>
              )}
              {order.internal_notes && (
                <div><strong>Internal Notes:</strong><p className="text-slate-600 mt-0.5">{order.internal_notes}</p></div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section 6: Kitchen Status */}
        {order.status !== 'cancelled' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Kitchen Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 italic">
                View detailed production stages in the <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/kitchen')}>Kitchen Tracker</Button>.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 7: Audit Log */}
        <Card>
          <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setShowAudit(!showAudit)}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-4 w-4" /> Activity History
              </CardTitle>
              {showAudit ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CardHeader>
          {showAudit && (
            <CardContent className="pt-2">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No activity recorded yet.</p>
              ) : (
                <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[21px] top-1 h-3 w-3  bg-slate-200 border-2 border-white" />
                      <div className="text-xs text-slate-400 mb-1">{log.timestamp} by {log.username}</div>
                      <div className="text-sm">
                        <span className="font-semibold capitalize">{log.action}:</span> {renderDiff(log)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <p className="text-xs text-slate-400 text-center">
          Created {order.created_at} · Updated {order.updated_at}
        </p>
      </div>
    </div>
  );
}
