import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBatches, createBatch, updateBatchStage, assignBatch, getBatchLog } from '@/api/kitchen';
import { fetchProductionSummary } from '@/api/production';
import { fetchOrders } from '@/api/orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ChevronDown, ChevronUp, Plus, Play, Package, Clock, X,
} from 'lucide-react';
import { toast } from 'sonner';

const STAGES = ['queued', 'prepping', 'baking', 'cooling', 'decorating', 'packed', 'assigned'];
const STAGE_COLORS = {
  queued: 'bg-slate-400', prepping: 'bg-blue-500', baking: 'bg-amber-500',
  cooling: 'bg-cyan-500', decorating: 'bg-purple-500', packed: 'bg-green-500', assigned: 'bg-green-700',
};

export default function Kitchen() {
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [batchLogs, setBatchLogs] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null); // batch id
  const [productionItems, setProductionItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [assignQuantities, setAssignQuantities] = useState({});
  const navigate = useNavigate();

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await fetchBatches({ date: batchDate });
      setBatches(data);
    } catch { toast.error("Failed to load batches"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBatches(); }, [batchDate]);

  const toggleExpand = async (batchId) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
      return;
    }
    setExpandedBatch(batchId);
    if (!batchLogs[batchId]) {
      try {
        const logs = await getBatchLog(batchId);
        setBatchLogs(prev => ({ ...prev, [batchId]: logs }));
      } catch { /* ignore */ }
    }
  };

  const handleAdvanceStage = async (batch) => {
    const idx = STAGES.indexOf(batch.stage);
    if (idx >= STAGES.length - 1) return;
    try {
      await updateBatchStage(batch.id, { stage: STAGES[idx + 1] });
      toast.success(`Stage → ${STAGES[idx + 1]}`);
      loadBatches();
      setBatchLogs(prev => ({ ...prev, [batch.id]: null })); // force reload
    } catch (err) { toast.error("Failed to advance stage"); }
  };

  const handleSetStage = async (batch, stage) => {
    try {
      await updateBatchStage(batch.id, { stage });
      toast.success(`Stage → ${stage}`);
      loadBatches();
      setBatchLogs(prev => ({ ...prev, [batch.id]: null }));
    } catch { toast.error("Failed to set stage"); }
  };

  // Create batch modal
  const openCreateModal = async () => {
    try {
      const prod = await fetchProductionSummary({ date: batchDate });
      setProductionItems(prod.items || []);
    } catch { setProductionItems([]); }
    setShowCreateModal(true);
  };

  const handleCreateBatch = async (menuItemId, qty) => {
    try {
      await createBatch({ menu_item_id: menuItemId, batch_date: batchDate, quantity: qty });
      toast.success("Batch created");
      setShowCreateModal(false);
      loadBatches();
    } catch (err) { toast.error("Failed to create batch"); }
  };

  // Assign modal
  const openAssignModal = async (batchId) => {
    try {
      const batch = batches.find(b => b.id === batchId);
      const ordersData = await fetchOrders({ status: 'confirmed' });
      // Filter orders that need this menu item
      setOrders(ordersData.filter(o =>
        o.items?.some(i => i.menu_item_id === batch?.menu_item_id)
      ));
    } catch { setOrders([]); }
    setAssignQuantities({});
    setShowAssignModal(batchId);
  };

  const handleAssign = async () => {
    const assignments = Object.entries(assignQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([orderId, quantity]) => ({ order_id: parseInt(orderId), quantity: parseInt(quantity) }));

    if (assignments.length === 0) return toast.error("Select at least one order");
    try {
      await assignBatch(showAssignModal, { assignments });
      toast.success("Assigned to orders");
      setShowAssignModal(null);
      loadBatches();
    } catch { toast.error("Failed to assign"); }
  };

  // Stats
  const activeBatches = batches.filter(b => b.stage !== 'assigned');
  const doneBatches = batches.filter(b => b.stage === 'assigned');
  const progress = batches.length ? Math.round((doneBatches.length / batches.length) * 100) : 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kitchen Tracker</h1>
          <p className="text-slate-500">Track batch progress through the kitchen.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Input type="date" value={batchDate} onChange={e => setBatchDate(e.target.value)} className="w-40" />
          <Button onClick={openCreateModal}><Plus className="h-4 w-4 mr-1" /> New Batch</Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-600 mb-1">
          <span>{doneBatches.length} of {batches.length} batches assigned</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading batches...</div>
      ) : batches.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-slate-500">No batches for {batchDate}. Click "New Batch" to create one from the production plan.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {/* Active batches */}
          {activeBatches.length > 0 && (
            <div className="space-y-3">
              {activeBatches.map(batch => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  expanded={expandedBatch === batch.id}
                  logs={batchLogs[batch.id]}
                  onToggle={() => toggleExpand(batch.id)}
                  onAdvance={() => handleAdvanceStage(batch)}
                  onSetStage={(stage) => handleSetStage(batch, stage)}
                  onAssign={() => openAssignModal(batch.id)}
                  navigate={navigate}
                />
              ))}
            </div>
          )}

          {/* Done section */}
          {doneBatches.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Done Today ({doneBatches.length})</h3>
              <div className="space-y-2 opacity-60">
                {doneBatches.map(batch => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    expanded={expandedBatch === batch.id}
                    logs={batchLogs[batch.id]}
                    onToggle={() => toggleExpand(batch.id)}
                    onAdvance={() => {}}
                    onSetStage={(stage) => handleSetStage(batch, stage)}
                    onAssign={() => {}}
                    navigate={navigate}
                    isDone
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create Batch from Production Plan</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              {productionItems.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No items in production plan for {batchDate}.</p>
              ) : (
                <div className="space-y-2">
                  {productionItems.map(item => (
                    <div key={item.menu_item_id} className="flex items-center justify-between p-3 border rounded-md hover:bg-slate-50">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.size_unit} · {item.total_quantity} needed</p>
                      </div>
                      <Button size="sm" onClick={() => handleCreateBatch(item.menu_item_id, item.total_quantity)}>
                        <Plus className="h-3 w-3 mr-1" /> Create ({item.total_quantity})
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assign to Orders</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAssignModal(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No confirmed orders need this item.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => {
                    const batch = batches.find(b => b.id === showAssignModal);
                    const relevantItem = order.items?.find(i => i.menu_item_id === batch?.menu_item_id);
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="font-medium">#{order.id} — {order.customer_name}</p>
                          <p className="text-xs text-slate-500">Needs {relevantItem?.quantity || '?'} · Due: {order.due_date}</p>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          className="w-20"
                          placeholder="Qty"
                          value={assignQuantities[order.id] || ''}
                          onChange={e => setAssignQuantities(prev => ({ ...prev, [order.id]: e.target.value }))}
                        />
                      </div>
                    );
                  })}
                  <Button className="w-full mt-2" onClick={handleAssign}>Assign</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function BatchCard({ batch, expanded, logs, onToggle, onAdvance, onSetStage, onAssign, navigate, isDone }) {
  const [showStages, setShowStages] = useState(false);
  const nextStage = STAGES[STAGES.indexOf(batch.stage) + 1];

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-slate-900">{batch.quantity}×</span>
            <div>
              <p className="font-semibold">{batch.menu_item_name}</p>
              <p className="text-xs text-slate-500">{batch.menu_item_size_unit}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Badge
                className={`${STAGE_COLORS[batch.stage] || 'bg-slate-400'} text-white cursor-pointer flex items-center gap-1`}
                onClick={() => setShowStages(!showStages)}
              >
                {batch.stage} <ChevronDown className="h-3 w-3" />
              </Badge>
              {showStages && (
                <div className="absolute right-0 z-10 mt-1 bg-white border rounded-md shadow-lg min-w-[130px]">
                  {STAGES.map(s => (
                    <div key={s} className="px-3 py-1.5 text-sm hover:bg-slate-100 cursor-pointer capitalize"
                      onClick={() => { onSetStage(s); setShowStages(false); }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span>
            <Clock className="h-3 w-3 inline mr-1" />
            {batch.stage_updated_at}{batch.stage_updated_by_name ? ` by ${batch.stage_updated_by_name}` : ''}
          </span>
          {batch.total_assigned > 0 && (
            <Badge variant="secondary" className="text-xs">{batch.total_assigned} assigned</Badge>
          )}
        </div>

        {/* Action buttons */}
        {!isDone && (
          <div className="flex gap-2 flex-wrap">
            {nextStage && (
              <Button size="sm" onClick={onAdvance}>
                <Play className="h-3 w-3 mr-1" /> {nextStage}
              </Button>
            )}
            {batch.stage === 'packed' && (
              <Button size="sm" variant="outline" onClick={onAssign} className="text-green-600">
                <Package className="h-3 w-3 mr-1" /> Assign to Order
              </Button>
            )}
          </div>
        )}

        {/* Assignments list */}
        {batch.assignments?.length > 0 && (
          <div className="mt-3 border-t pt-2 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase">Assigned to:</p>
            {batch.assignments.map(a => (
              <div key={a.id} className="flex justify-between text-sm py-0.5">
                <span
                  className="text-blue-600 hover:underline cursor-pointer"
                  onClick={() => navigate(`/orders/${a.order_id}`)}
                >
                  Order #{a.order_id} {a.customer_name ? `— ${a.customer_name}` : ''}
                </span>
                <span className="text-slate-500">×{a.quantity}</span>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {batch.notes && (
          <p className="mt-2 text-sm text-slate-600 italic">📝 {batch.notes}</p>
        )}
      </div>

      {/* Expandable stage log */}
      <div
        className="border-t px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 text-sm text-slate-500"
        onClick={onToggle}
      >
        <span>Stage History</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
      {expanded && logs && (
        <div className="bg-slate-50 px-4 py-2 space-y-1 text-xs border-t">
          {logs.map(l => (
            <div key={l.id} className="flex justify-between py-0.5">
              <span>
                {l.from_stage ? `${l.from_stage} → ` : ''}<strong>{l.to_stage}</strong>
                {l.changed_by_name && <span className="text-slate-400 ml-1">by {l.changed_by_name}</span>}
              </span>
              <span className="text-slate-400">{l.changed_at}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
