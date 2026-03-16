import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCustomers, createCustomer } from '@/api/customers';
import { fetchMenu } from '@/api/menu';
import { createOrder, getOrder, updateOrder } from '@/api/orders';
import { formatPaiseToRupees } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderForm() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = Boolean(editId);

  // Data sources
  const [customers, setCustomers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [dueDate, setDueDate] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [orderItems, setOrderItems] = useState([]);  // { menu_item_id, name, size_unit, quantity, unit_price_paise }
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  const [discountType, setDiscountType] = useState('');
  const [discountValue, setDiscountValue] = useState('');

  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [amountPaid, setAmountPaid] = useState('');

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    fetchCustomers().then(setCustomers).catch(() => {});
    fetchMenu().then(setMenuItems).catch(() => {});
  }, []);

  // Load existing order for edit mode
  useEffect(() => {
    if (!isEdit) return;
    const loadOrder = async () => {
      try {
        const order = await getOrder(editId);
        setCustomerId(order.customer_id);
        setCustomerSearch(order.customer_name || `Customer #${order.customer_id}`);
        setDueDate(order.due_date);
        setFulfillmentType(order.fulfillment_type);
        setDeliveryAddress(order.delivery_address || '');
        setOrderItems(order.items.map(i => ({
          menu_item_id: i.menu_item_id,
          name: i.menu_item_name || `Item #${i.menu_item_id}`,
          size_unit: i.menu_item_size_unit || '',
          quantity: i.quantity,
          unit_price_paise: i.unit_price_paise,
        })));
        setDiscountType(order.discount_type || '');
        setDiscountValue(order.discount_value ? String(order.discount_value) : '');
        setPaymentStatus(order.payment_status);
        setAmountPaid(order.amount_paid_paise ? String(order.amount_paid_paise) : '');
        setSpecialInstructions(order.special_instructions || '');
        setInternalNotes(order.internal_notes || '');
      } catch (err) {
        toast.error('Failed to load order for editing');
        navigate('/orders');
      }
    };
    loadOrder();
  }, [editId, isEdit]);

  // Customer search filter
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 10);
    return customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch))
    ).slice(0, 10);
  }, [customers, customerSearch]);

  // Menu item search filter
  const filteredMenuItems = useMemo(() => {
    if (!itemSearch.trim()) return menuItems.filter(m => m.is_available).slice(0, 10);
    return menuItems.filter(m =>
      m.is_available && m.name.toLowerCase().includes(itemSearch.toLowerCase())
    ).slice(0, 10);
  }, [menuItems, itemSearch]);

  // Live calculations (preview only — server is authoritative)
  const subtotal = orderItems.reduce((sum, i) => sum + i.quantity * i.unit_price_paise, 0);
  const discountPaise = useMemo(() => {
    const val = parseInt(discountValue) || 0;
    if (discountType === 'flat') return val;
    if (discountType === 'percent') return Math.round(subtotal * val / 10000);
    return 0;
  }, [subtotal, discountType, discountValue]);
  const total = Math.max(subtotal - discountPaise, 0);

  // Handlers
  const selectCustomer = (c) => {
    setCustomerId(c.id);
    setCustomerSearch(c.name);
    setShowCustomerDropdown(false);
  };

  const addItem = (mi) => {
    const existing = orderItems.find(i => i.menu_item_id === mi.id);
    if (existing) {
      setOrderItems(prev => prev.map(i =>
        i.menu_item_id === mi.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setOrderItems(prev => [...prev, {
        menu_item_id: mi.id,
        name: mi.name,
        size_unit: mi.size_unit,
        quantity: 1,
        unit_price_paise: mi.price_paise,
      }]);
    }
    setItemSearch('');
    setShowItemDropdown(false);
  };

  const updateQty = (idx, delta) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const newQty = Math.max(1, item.quantity + delta);
      return { ...item, quantity: newQty };
    }));
  };

  const removeItem = (idx) => {
    setOrderItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId && !customerSearch.trim()) return toast.error("Please select or type a customer name");
    if (!dueDate) return toast.error("Please set a due date");
    if (orderItems.length === 0) return toast.error("Add at least one item");

    setSubmitting(true);
    try {
      let finalCustomerId = customerId;

      // Auto-create customer if it's a new name
      if (!finalCustomerId && customerSearch.trim()) {
        const newCustomer = await createCustomer({ name: customerSearch.trim() });
        finalCustomerId = newCustomer.id;
        toast.success(`Created new customer profile: ${customerSearch.trim()}`);
      }

      const payload = {
        customer_id: parseInt(finalCustomerId),
        due_date: dueDate,
        fulfillment_type: fulfillmentType,
        delivery_address: fulfillmentType === 'delivery' ? deliveryAddress : null,
        items: orderItems.map(i => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          unit_price_paise: i.unit_price_paise,
        })),
        discount_type: discountType || null,
        discount_value: parseInt(discountValue) || 0,
        payment_status: paymentStatus,
        amount_paid_paise: parseInt(amountPaid) || 0,
        special_instructions: specialInstructions || null,
        internal_notes: internalNotes || null,
      };

      if (isEdit) {
        await updateOrder(editId, payload);
        toast.success(`Order #${editId} updated!`);
        navigate(`/orders/${editId}`);
      } else {
        const created = await createOrder(payload);
        toast.success(`Order #${created.id} created!`);
        navigate('/orders');
      }
    } catch (err) {
      toast.error(isEdit ? "Failed to update order" : "Failed to create order", {
        description: err.response?.data?.detail || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <Button variant="ghost" className="mb-4" onClick={() => isEdit ? navigate(`/orders/${editId}`) : navigate('/orders')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> {isEdit ? 'Back to Order' : 'Back to Orders'}
      </Button>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">{isEdit ? `Edit Order #${editId}` : 'New Order'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                placeholder="Search existing or type new customer name..."
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); setCustomerId(''); }}
                onFocus={() => setShowCustomerDropdown(true)}
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border  shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-h-48 overflow-y-auto">
                  {filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                      onClick={() => selectCustomer(c)}
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.phone && <span className="text-slate-500 ml-2">{c.phone}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {customerId && <Badge variant="secondary" className="mt-2">Selected: {customerSearch}</Badge>}
            {!customerId && customerSearch.trim() && (
              <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200 shadow-none">
                ✨ Will create new customer: {customerSearch}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg">Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Due Date *</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Fulfillment</label>
                <div className="flex gap-2">
                  <Button type="button" variant={fulfillmentType === 'pickup' ? "default" : "outline"} size="sm" onClick={() => setFulfillmentType('pickup')}>Pickup</Button>
                  <Button type="button" variant={fulfillmentType === 'delivery' ? "default" : "outline"} size="sm" onClick={() => setFulfillmentType('delivery')}>Delivery</Button>
                </div>
              </div>
            </div>
            {fulfillmentType === 'delivery' && (
              <div>
                <label className="text-sm font-medium block mb-1">Delivery Address</label>
                <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Full delivery address" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg">Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Item search */}
            <div className="relative">
              <Input
                placeholder="Search menu items..."
                value={itemSearch}
                onChange={(e) => { setItemSearch(e.target.value); setShowItemDropdown(true); }}
                onFocus={() => setShowItemDropdown(true)}
              />
              {showItemDropdown && filteredMenuItems.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border  shadow-lg max-h-48 overflow-y-auto">
                  {filteredMenuItems.map(mi => (
                    <div
                      key={mi.id}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm flex justify-between items-center"
                      onClick={() => addItem(mi)}
                    >
                      <div>
                        <span className="font-medium">{mi.name}</span>
                        <span className="text-slate-500 ml-2 text-xs">{mi.size_unit}</span>
                      </div>
                      <span className="text-slate-600 font-medium">{formatPaiseToRupees(mi.price_paise)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Item lines */}
            {orderItems.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No items added yet. Search above to add items.</p>
            ) : (
              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50  p-3 border">
                    <div className="flex-grow">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.size_unit} · {formatPaiseToRupees(item.unit_price_paise)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => updateQty(idx, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => updateQty(idx, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="w-20 text-right font-medium text-sm">{formatPaiseToRupees(item.quantity * item.unit_price_paise)}</span>
                      <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing & Payment */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg">Pricing & Payment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Discount Type</label>
                <div className="flex gap-1.5">
                  <Button type="button" variant={!discountType ? "default" : "outline"} size="sm" onClick={() => { setDiscountType(''); setDiscountValue(''); }}>None</Button>
                  <Button type="button" variant={discountType === 'flat' ? "default" : "outline"} size="sm" onClick={() => setDiscountType('flat')}>Flat ₹</Button>
                  <Button type="button" variant={discountType === 'percent' ? "default" : "outline"} size="sm" onClick={() => setDiscountType('percent')}>Percent %</Button>
                </div>
              </div>
              {discountType && (
                <div>
                  <label className="text-sm font-medium block mb-1">
                    {discountType === 'flat' ? 'Amount (paise)' : 'Percent (e.g. 10)'}
                  </label>
                  <Input 
                    type="number" 
                    value={discountType === 'percent' && discountValue ? discountValue / 100 : discountValue} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) { setDiscountValue(''); return; }
                      setDiscountValue(discountType === 'percent' ? String(Math.round(parseFloat(val) * 100)) : val);
                    }} 
                    placeholder="0" 
                  />
                </div>
              )}
            </div>

            {/* Totals preview */}
            <div className="bg-slate-50  p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-medium">{formatPaiseToRupees(subtotal)}</span></div>
              {discountPaise > 0 && (
                <div className="flex justify-between text-red-600"><span>Discount</span><span>-{formatPaiseToRupees(discountPaise)}</span></div>
              )}
              <div className="flex justify-between text-base font-bold border-t pt-1 mt-1"><span>Total</span><span>{formatPaiseToRupees(total)}</span></div>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Payment Status</label>
                <div className="flex gap-1.5">
                  {['unpaid', 'partial', 'paid'].map(ps => (
                    <Button key={ps} type="button" variant={paymentStatus === ps ? "default" : "outline"} size="sm" className="capitalize" onClick={() => setPaymentStatus(ps)}>{ps}</Button>
                  ))}
                </div>
              </div>
              {paymentStatus === 'partial' && (
                <div>
                  <label className="text-sm font-medium block mb-1">Amount Paid (paise)</label>
                  <Input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg">Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Special Instructions</label>
              <Input value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="E.g. extra icing, no nuts" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Internal Notes</label>
              <Input value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Staff-only notes" />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/orders')}>Cancel</Button>
          <Button type="submit" disabled={submitting} className="font-semibold px-8">
            {submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Order')}
          </Button>
        </div>
      </form>
    </div>
  );
}
