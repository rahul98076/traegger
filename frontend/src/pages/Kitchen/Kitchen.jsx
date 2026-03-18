import React, { useState, useEffect } from 'react';
import { fetchActiveOrders, updateItemStatus } from '@/api/kitchen';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, Package, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchActiveOrders();
      setOrders(data);
    } catch (err) {
      toast.error("Failed to load active orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleItemReady = async (itemId, currentStatus) => {
    const newStatus = currentStatus === 'ready' ? 'pending' : 'ready';
    try {
      await updateItemStatus(itemId, newStatus);
      // Optimistic update
      setOrders(prev => prev.map(order => ({
        ...order,
        items: updateItemInHierarchy(order.items, itemId, newStatus),
        ready_items: countReady(updateItemInHierarchy(order.items, itemId, newStatus))
      })));
      
      // If everything is ready now, maybe we should refresh to see if order moved to ready
      if (newStatus === 'ready') loadData(); 
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const updateItemInHierarchy = (items, targetId, status) => {
    return items.map(item => {
      if (item.id === targetId) {
        return { ...item, status, sub_items: item.sub_items.map(s => ({ ...s, status })) };
      }
      if (item.sub_items.length > 0) {
        return { ...item, sub_items: updateItemInHierarchy(item.sub_items, targetId, status) };
      }
      return item;
    });
  };

  const countReady = (items) => {
    let count = 0;
    items.forEach(i => {
      if (i.status === 'ready') count++;
      count += countReady(i.sub_items);
    });
    return count;
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  if (loading && orders.length === 0) {
    return <div className="p-8 text-center text-xl font-black uppercase">Loading Kitchen Board...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24 space-y-6">
      <header className="mb-8 border-b-2 border-black pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Packing Station</h1>
          <p className="font-bold text-slate-600 flex items-center gap-2">
            <Clock className="w-4 h-4" /> {orders.filter(o => o.ready_items < o.total_items).length} PENDING · {orders.filter(o => o.ready_items >= o.total_items).length} DONE
          </p>
        </div>
        <Button 
          variant={showCompleted ? "default" : "outline"}
          onClick={() => setShowCompleted(!showCompleted)}
          className="rounded-none border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-[1px] transition-all"
        >
          {showCompleted ? "Hide Done" : "Show Done"}
        </Button>
      </header>

      {orders.length === 0 ? (
        <Card className="border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-none">
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-xl font-bold uppercase">All caught up!</p>
            <p className="text-slate-500">New orders will appear here automatically.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders
            .filter(order => showCompleted || order.ready_items < order.total_items)
            .map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              isExpanded={!!expandedOrders[order.id]}
              onToggleExpand={() => toggleOrderExpand(order.id)}
              onToggleItem={toggleItemReady}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, isExpanded, onToggleExpand, onToggleItem }) {
  const isAllReady = order.ready_items >= order.total_items;

  return (
    <Card className={`border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-none transition-all ${isAllReady ? 'bg-green-50' : 'bg-white'}`}>
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={onToggleExpand}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white text-black border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)]">#{order.id}</span>
            <span className="font-black uppercase tracking-tight text-lg">{order.customer_name}</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {order.due_date}</span>
            <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {order.ready_items}/{order.total_items} READY</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAllReady ? (
            <Badge className="bg-green-500 text-white rounded-none border-2 border-black font-black uppercase px-2 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">READY TO GO</Badge>
          ) : (
             <div className="w-20 h-5 border-2 border-black bg-slate-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)] relative overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all border-r-2 border-black" 
                  style={{ width: `${(order.ready_items / (order.total_items || 1)) * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase text-slate-700">
                   {Math.round((order.ready_items / (order.total_items || 1)) * 100)}%
                </span>
             </div>
          )}
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t-2 border-black p-4 space-y-4 bg-slate-50">
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <h4 className="text-xs font-black uppercase mb-3 text-slate-400 border-b border-slate-100 pb-1">Items Checklist</h4>
            <div className="space-y-4">
              {order.items.map(item => (
                <ItemRow key={item.id} item={item} onToggle={onToggleItem} depth={0} />
              ))}
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-slate-400 uppercase">Delivery Mode: {order.fulfillment_type}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function ItemRow({ item, onToggle, depth }) {
  const hasSubItems = item.sub_items && item.sub_items.length > 0;
  const isReady = item.status === 'ready';

  return (
    <div className={`space-y-2 ${depth > 0 ? 'ml-6 border-l-2 border-slate-200 pl-4' : ''}`}>
      <div 
        className={`flex items-start justify-between p-3 border-2 border-black transition-all cursor-pointer select-none
          ${isReady ? 'bg-green-100 border-green-600' : 'bg-white hover:bg-slate-50'}
          ${depth === 0 ? 'shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : ''}
        `}
        onClick={() => onToggle(item.id, item.status)}
      >
        <div className="flex gap-3">
          <div className="mt-0.5">
            {isReady ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 fill-green-50" />
            ) : (
              <Circle className="w-6 h-6 text-black" />
            )}
          </div>
          <div>
            <p className={`font-black leading-tight uppercase ${isReady ? 'line-through text-green-700 opacity-50' : 'text-slate-900'}`}>
              <span className="text-xl mr-2">{item.quantity}×</span> 
              {item.name}
            </p>
            {hasSubItems && !isReady && (
              <p className="text-[10px] font-black uppercase text-amber-600 mt-1 flex items-center gap-1">
                <Package className="w-3 h-3" /> Includes {item.sub_items.length} items
              </p>
            )}
          </div>
        </div>
      </div>

      {hasSubItems && !isReady && (
        <div className="space-y-2">
          {item.sub_items.map(sub => (
            <ItemRow key={sub.id} item={sub} onToggle={onToggle} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
