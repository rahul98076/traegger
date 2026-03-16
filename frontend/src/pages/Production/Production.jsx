import React, { useState, useEffect } from 'react';
import { fetchProductionSummary } from '@/api/production';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Printer, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This Week' },
];

export default function Production() {
  const [activeTab, setActiveTab] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await fetchProductionSummary({ range: activeTab });
      setData(result);
    } catch (err) {
      toast.error("Failed to load production summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeTab]);

  const toggleExpand = (menuItemId) => {
    setExpandedItems(prev => ({ ...prev, [menuItemId]: !prev[menuItemId] }));
  };

  const handlePrint = () => {
    if (!data || data.items.length === 0) return;
    const lines = [
      `PRODUCTION PLAN — ${data.date_range.from}${data.date_range.from !== data.date_range.to ? ` to ${data.date_range.to}` : ''}`,
      '═'.repeat(50),
      '',
      ...data.items.map(item =>
        `${item.total_quantity}× ${item.name} (${item.size_unit})${!item.is_available ? ' ⚠ UNAVAILABLE' : ''}`
      ),
      '',
      '═'.repeat(50),
      `Total ${data.items.length} items`,
    ];
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<pre style="font-size:18px;font-family:monospace;padding:24px">${lines.join('\n')}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  const totalItems = data?.items?.reduce((sum, i) => sum + i.total_quantity, 0) || 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Production Plan</h1>
          <p className="text-slate-500">What the kitchen needs to bake.</p>
        </div>
        <Button variant="outline" onClick={handlePrint} disabled={!data?.items?.length}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
        {TABS.map(t => (
          <Button
            key={t.key}
            variant={activeTab === t.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Date range + summary */}
      {data && (
        <div className="flex items-center gap-3 mb-4 text-sm text-slate-500">
          <span>{data.date_range.from}{data.date_range.from !== data.date_range.to ? ` → ${data.date_range.to}` : ''}</span>
          <Badge variant="secondary">{data.items.length} item{data.items.length !== 1 ? 's' : ''}</Badge>
          <Badge variant="secondary">{totalItems} total units</Badge>
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading production plan...</div>
      ) : !data?.items?.length ? (
        <Card><CardContent className="py-8 text-center text-slate-500">No items to produce for this period. Orders must be in Confirmed, In Progress, or Ready status.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {data.items.map(item => (
            <Card key={item.menu_item_id} className="overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                onClick={() => toggleExpand(item.menu_item_id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-slate-900 min-w-[48px] text-center">{item.total_quantity}</span>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.size_unit}</p>
                  </div>
                  {!item.is_available && (
                    <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                      <AlertTriangle className="h-3 w-3" /> Unavailable
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{item.orders.length} order{item.orders.length !== 1 ? 's' : ''}</Badge>
                  {expandedItems[item.menu_item_id] ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>
              {expandedItems[item.menu_item_id] && (
                <div className="border-t bg-slate-50 px-4 py-3 space-y-1">
                  {item.orders.map((o, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100 last:border-0">
                      <span
                        className="text-blue-600 hover:underline cursor-pointer font-medium"
                        onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.order_id}`); }}
                      >
                        #{o.order_id} — {o.customer_name}
                      </span>
                      <div className="flex items-center gap-3 text-slate-500">
                        <span>×{o.quantity}</span>
                        <span className="text-xs">{o.due_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
