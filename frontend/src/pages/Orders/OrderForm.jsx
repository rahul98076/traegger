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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBasket } from 'lucide-react';
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

  // Basket builder state
  const [isBasketModalOpen, setIsBasketModalOpen] = useState(false);
  const [basketName, setBasketName] = useState('');
  const [basketItems, setBasketItems] = useState([]);
  const [basketItemSearch, setBasketItemSearch] = useState('');
  const [showBasketItemDropdown, setShowBasketItemDropdown] = useState(false);

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
        setOrderItems(order.items.map(i => {
           if (i.sub_items && i.sub_items.length > 0) {
              return {
                 is_basket: true,
                 custom_name: i.custom_name,
                 name: i.custom_name || 'Custom Basket',
                 quantity: i.quantity,
                 unit_price_paise: i.unit_price_paise,
                 sub_items: i.sub_items.map(sub => ({
                    menu_item_id: sub.menu_item_id,
                    name: sub.menu_item_name,
                    size_unit: sub.menu_item_size_unit,
                    quantity: sub.quantity,
                    unit_price_paise: sub.unit_price_paise
                 }))
              };
           }
           return {
             menu_item_id: i.menu_item_id,
             name: i.menu_item_name || `Item #${i.menu_item_id}`,
             size_unit: i.menu_item_size_unit || '',
             quantity: i.quantity,
             unit_price_paise: i.unit_price_paise,
           };
        }));
        setDiscountType(order.discount_type || '');
        setDiscountValue(order.discount_value ? String(order.discount_value / 100) : '');
        setPaymentStatus(order.payment_status);
        setAmountPaid(order.amount_paid_paise ? String(order.amount_paid_paise / 100) : '');
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
    if (!itemSearch.trim()) return menuItems.filter(m => m.is_available).slice(0, 100);
    return menuItems.filter(m =>
      m.is_available && m.name.toLowerCase().includes(itemSearch.toLowerCase())
    ).slice(0, 100);
  }, [menuItems, itemSearch]);

  const filteredBasketMenuItems = useMemo(() => {
    if (!basketItemSearch.trim()) return menuItems.filter(m => m.is_available).slice(0, 100);
    return menuItems.filter(m =>
      m.is_available && m.name.toLowerCase().includes(basketItemSearch.toLowerCase())
    ).slice(0, 100);
  }, [menuItems, basketItemSearch]);

  // Live calculations (preview only — server is authoritative)
  const subtotal = orderItems.reduce((sum, i) => sum + i.quantity * i.unit_price_paise, 0);
  const discountPaise = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (discountType === 'flat') return Math.round(val * 100);
    if (discountType === 'percent') return Math.round(subtotal * val / 100);
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
  
  // Custom basket helpers
  const openBasketModal = () => {
    setBasketName('');
    setBasketItems([]);
    setBasketItemSearch('');
    setIsBasketModalOpen(true);
  };

  const addBasketItem = (mi) => {
    const existing = basketItems.find(i => i.menu_item_id === mi.id);
    if (existing) {
      setBasketItems(prev => prev.map(i =>
        i.menu_item_id === mi.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setBasketItems(prev => [...prev, {
        menu_item_id: mi.id,
        name: mi.name,
        size_unit: mi.size_unit,
        custom_unit: mi.size_unit,
        quantity: 1,
        unit_price_paise: mi.price_paise,
      }]);
    }
    setBasketItemSearch('');
    setShowBasketItemDropdown(false);
  };
  
  const updateBasketItemQty = (idx, delta) => {
    setBasketItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return { ...item, quantity: Math.max(1, item.quantity + delta) };
    }));
  };
  
  const removeBasketItem = (idx) => {
    setBasketItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateBasketItemPrice = (idx, newPriceRupees) => {
    const paise = Math.round((parseFloat(newPriceRupees) || 0) * 100);
    setBasketItems(prev => prev.map((item, i) => 
      i === idx ? { ...item, unit_price_paise: paise } : item
    ));
  };

  const updateBasketItemUnit = (idx, newUnit) => {
    setBasketItems(prev => prev.map((item, i) => 
      i === idx ? { ...item, custom_unit: newUnit } : item
    ));
  };

  const saveBasketToOrder = () => {
    if (!basketName.trim()) return toast.error("Basket must have a name");
    if (basketItems.length === 0) return toast.error("Basket cannot be empty");
    
    const basketUnitPrice = basketItems.reduce((sum, i) => sum + (i.quantity * i.unit_price_paise), 0);
    
    setOrderItems(prev => [...prev, {
      custom_name: basketName.trim(),
      name: basketName.trim(),
      is_basket: true,
      quantity: 1,
      unit_price_paise: basketUnitPrice,
      sub_items: basketItems.map(i => ({ ...i, custom_unit: i.custom_unit || i.size_unit }))
    }]);
    setIsBasketModalOpen(false);
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
          menu_item_id: i.is_basket ? null : i.menu_item_id,
          custom_name: i.custom_name || null,
          quantity: i.quantity,
          unit_price_paise: i.unit_price_paise,
          sub_items: i.is_basket ? i.sub_items.map(sub => ({
             menu_item_id: sub.menu_item_id,
             quantity: sub.quantity,
             unit_price_paise: sub.unit_price_paise
          })) : null
        })),
        discount_type: discountType || null,
        discount_value: discountType ? Math.round((parseFloat(discountValue) || 0) * 100) : 0,
        payment_status: paymentStatus,
        amount_paid_paise: Math.round((parseFloat(amountPaid) || 0) * 100),
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
        <Card className="overflow-visible">
          <CardHeader className="pb-3"><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                placeholder="Search existing or type new customer name..."
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); setCustomerId(''); }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setShowCustomerDropdown(false)}
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border  shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-h-48 overflow-y-auto">
                  {filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                      onMouseDown={(e) => { e.preventDefault(); selectCustomer(c); }}
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
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }} required />
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
        <Card className="overflow-visible">
          <CardHeader className="pb-3"><CardTitle className="text-lg">Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Item search */}
            <div className="flex gap-3 relative">
              <div className="relative flex-grow">
                <Input
                  placeholder="Search standard menu items..."
                  value={itemSearch}
                  onChange={(e) => { setItemSearch(e.target.value); setShowItemDropdown(true); }}
                  onFocus={() => setShowItemDropdown(true)}
                  onBlur={() => setShowItemDropdown(false)}
                />
                {showItemDropdown && filteredMenuItems.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border shadow-lg max-h-48 overflow-y-auto">
                    {filteredMenuItems.map(mi => (
                      <div
                        key={mi.id}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm flex justify-between items-center"
                        onMouseDown={(e) => { e.preventDefault(); addItem(mi); }}
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
              <Button type="button" variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100" onClick={openBasketModal}>
                <ShoppingBasket className="h-4 w-4 mr-2" /> Custom Basket
              </Button>
            </div>

            {/* Item lines */}
            {orderItems.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No items added yet. Search above to add items.</p>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <p className="font-medium text-sm flex items-center gap-2">
                          {item.is_basket && <Badge variant="secondary" className="text-[10px] h-5 py-0 px-2 bg-purple-100 text-purple-700 hover:bg-purple-100 border-black border rounded-none">Custom Basket</Badge>}
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.is_basket ? 'Composite Item' : item.size_unit} · {formatPaiseToRupees(item.unit_price_paise)} {item.is_basket ? 'Base Total' : 'each'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-50 border-2 border-black">
                          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 border-r-2 border-black rounded-none" onClick={() => updateQty(idx, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 border-l-2 border-black rounded-none" onClick={() => updateQty(idx, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="w-24 text-right">
                           <span className="font-bold text-slate-700">{formatPaiseToRupees(item.quantity * item.unit_price_paise)}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-none" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {item.is_basket && item.sub_items && (
                      <div className="mt-3 ml-1 pl-3 border-l-2 border-purple-300 space-y-2 py-1">
                        {item.sub_items.map((sub, sidx) => (
                           <div key={sidx} className="flex justify-between items-center bg-purple-50/50 px-2 py-1 text-xs text-slate-700 border border-purple-100">
                             <span className="font-medium">{sub.quantity}x {sub.name} <span className="text-slate-400 font-normal">({sub.size_unit})</span></span>
                             <span className="text-slate-500">{formatPaiseToRupees(sub.quantity * sub.unit_price_paise)}</span>
                           </div>
                        ))}
                      </div>
                    )}
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
                    {discountType === 'flat' ? 'Amount (₹)' : 'Percent (e.g. 10)'}
                  </label>
                  <Input 
                    type="number" 
                    step="any"
                    value={discountValue} 
                    onChange={(e) => setDiscountValue(e.target.value)} 
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
                  <label className="text-sm font-medium block mb-1">Amount Paid (₹)</label>
                  <Input type="number" step="any" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" />
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

      {/* Custom Basket Modal */}
      <Dialog open={isBasketModalOpen} onOpenChange={setIsBasketModalOpen}>
        <DialogContent className="sm:max-w-2xl overflow-visible">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingBasket className="h-5 w-5 text-purple-600" />
              Build Custom Basket
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div>
              <label className="text-sm font-medium block mb-2 text-slate-700">Basket Name</label>
              <Input 
                placeholder="e.g. Valentine's Day Special Assortment" 
                value={basketName} 
                onChange={e => setBasketName(e.target.value)} 
                className="text-lg font-medium"
              />
            </div>
            
            <div className="bg-slate-50 border-2 border-black p-4 space-y-4">
               <div>
                 <label className="text-sm font-medium block mb-2 text-slate-900">Add Items to Basket</label>
                 <div className="relative">
                   <Input
                     placeholder="Search to add contents..."
                     value={basketItemSearch}
                     onChange={(e) => { setBasketItemSearch(e.target.value); setShowBasketItemDropdown(true); }}
                     onFocus={() => setShowBasketItemDropdown(true)}
                     onBlur={() => setShowBasketItemDropdown(false)}
                     className="bg-white border-2 border-black"
                   />
                   {showBasketItemDropdown && filteredBasketMenuItems.length > 0 && (
                     <div className="absolute z-10 w-full mt-1 bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-h-48 overflow-y-auto">
                       {filteredBasketMenuItems.map(mi => (
                         <div
                           key={mi.id}
                           className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm flex justify-between items-center border-b border-slate-100 last:border-b-0"
                           onMouseDown={(e) => { e.preventDefault(); addBasketItem(mi); }}
                         >
                           <div>
                             <span className="font-medium">{mi.name}</span>
                             <span className="text-slate-500 ml-2 text-xs">{mi.size_unit}</span>
                           </div>
                           <span className="text-slate-700 font-medium">{formatPaiseToRupees(mi.price_paise)}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>

               {/* Basket Contents */}
               {basketItems.length > 0 && (
                 <div className="space-y-2 mt-4">
                   {basketItems.map((item, idx) => (
                       <div key={idx} className="bg-white p-3 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-sm space-y-2">
                         <div className="flex justify-between items-center">
                           <div className="flex-grow">
                             <span className="font-medium text-slate-900">{item.name}</span>
                             <span className="text-xs text-slate-400 ml-2">({item.size_unit})</span>
                           </div>
                           <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-none text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => removeBasketItem(idx)}>
                              <Trash2 className="h-3 w-3" />
                           </Button>
                         </div>
                         <div className="flex items-center gap-3 flex-wrap">
                           <div className="flex items-center gap-1">
                             <label className="text-[10px] font-bold text-slate-400 uppercase">Qty</label>
                             <div className="flex items-center border-2 border-black bg-slate-50">
                               <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-none border-r-2 border-black hover:bg-slate-200" onClick={() => updateBasketItemQty(idx, -1)}><Minus className="h-3 w-3" /></Button>
                               <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                               <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-none border-l-2 border-black hover:bg-slate-200" onClick={() => updateBasketItemQty(idx, 1)}><Plus className="h-3 w-3" /></Button>
                             </div>
                           </div>
                           <div className="flex items-center gap-1">
                             <label className="text-[10px] font-bold text-slate-400 uppercase">Unit</label>
                             <Input 
                               value={item.custom_unit || ''}
                               onChange={(e) => updateBasketItemUnit(idx, e.target.value)}
                               className="h-7 w-24 text-xs border-2 border-black rounded-none px-2"
                               placeholder="e.g. piece"
                             />
                           </div>
                           <div className="flex items-center gap-1">
                             <label className="text-[10px] font-bold text-slate-400 uppercase">Price</label>
                             <Input 
                               type="number"
                               step="0.01"
                               value={(item.unit_price_paise / 100).toFixed(2)}
                               onChange={(e) => updateBasketItemPrice(idx, e.target.value)}
                               className="h-7 w-24 text-xs border-2 border-black rounded-none px-2 text-right"
                             />
                           </div>
                           <div className="ml-auto font-bold text-slate-800 text-xs">
                             = {formatPaiseToRupees(item.quantity * item.unit_price_paise)}
                           </div>
                         </div>
                       </div>
                    ))}
                   
                   <div className="flex justify-between items-center pt-3 mt-3 border-t">
                     <span className="font-semibold text-slate-700">Basket Unit Price:</span>
                     <span className="text-lg font-bold text-emerald-600">
                        {formatPaiseToRupees(basketItems.reduce((sum, i) => sum + (i.quantity * i.unit_price_paise), 0))}
                     </span>
                   </div>
                 </div>
               )}
               {basketItems.length === 0 && (
                 <p className="text-xs text-slate-400 text-center py-4 italic">Basket is currently empty.</p>
               )}
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsBasketModalOpen(false)}>Cancel</Button>
              <Button onClick={saveBasketToOrder}>Add to Order</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
