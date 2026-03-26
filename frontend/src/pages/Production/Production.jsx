import React, { useState, useEffect } from 'react';
import { fetchProductionSummary } from '@/api/production';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Printer, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { key: 'upcoming', label: 'All Upcoming' },
];

export default function Production() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [customDate, setCustomDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const params = activeTab === 'custom' && customDate ? { date: customDate } : { range: activeTab };
      const result = await fetchProductionSummary(params);
      setData(result);
    } catch (err) {
      toast.error("Failed to load production summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeTab, customDate]);

  const toggleExpand = (menuItemId) => {
    setExpandedItems(prev => ({ ...prev, [menuItemId]: !prev[menuItemId] }));
  };

  const handlePrint = () => {
    if (!data || !data.days || data.days.length === 0) return;
    const lines = [
      `PRODUCTION PLAN`,
      '═'.repeat(50),
      '',
    ];
    let grandTotal = 0;
    data.days.forEach(day => {
      lines.push(`DATE: ${day.date}`);
      lines.push('-'.repeat(30));
      day.items.forEach(item => {
        lines.push(`${item.total_quantity}× ${item.name} (${item.size_unit})${!item.is_available ? ' ⚠ UNAVAILABLE' : ''}`);
        grandTotal += item.total_quantity;
      });
      lines.push('');
    });
    lines.push('═'.repeat(50));
    lines.push(`Total ${grandTotal} units active`);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<pre style="font-size:18px;font-family:monospace;padding:24px">${lines.join('\n')}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  const totalItems = data?.days?.reduce((sum, day) => sum + day.items.reduce((ds, i) => ds + i.total_quantity, 0), 0) || 0;
  const uniqueItemCount = data?.days ? new Set(data.days.flatMap(d => d.items.map(i => i.menu_item_id))).size : 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Production Plan</h1>
          <p className="text-slate-500">What the kitchen needs to bake.</p>
        </div>
        <Button variant="outline" onClick={handlePrint} disabled={!data?.days?.length}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-1 bg-slate-100 p-1 w-fit border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          {TABS.map(t => (
            <Button
              key={t.key}
              variant={activeTab === t.key ? "default" : "ghost"}
              size="sm" className="shadow-none rounded-none"
              onClick={() => { setActiveTab(t.key); setCustomDate(''); }}
            >
              {t.label}
            </Button>
          ))}
          <Button
            variant={activeTab === 'custom' ? "default" : "ghost"}
            size="sm" className="shadow-none rounded-none"
            onClick={() => setActiveTab('custom')}
          >
            Custom Date
          </Button>
        </div>

        {activeTab === 'custom' && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="border-2 border-black px-3 py-1.5 text-sm font-medium shadow-[4px_4px_0_0_rgba(0,0,0,1)] focus:outline-none focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all bg-white"
          />
        )}
      </div>

      {/* Summary */}
      {data && (
        <div className="flex items-center gap-3 mb-4 text-sm text-slate-500">
          <Badge variant="secondary">{uniqueItemCount} distinct item{uniqueItemCount !== 1 ? 's' : ''}</Badge>
          <Badge variant="secondary">{totalItems} total units</Badge>
        </div>
      )}

      {/* Grand Totals Chart */}
      {data?.grand_totals?.length > 0 && (
        <div className="mb-10 bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-4 sm:p-6">
          <h2 className="text-xl font-black uppercase tracking-tight border-b-2 border-black pb-2 mb-4">
            Grand Totals
          </h2>
          <div className="space-y-3">
            {data.grand_totals.map((item, idx) => {
              const maxQty = data.grand_totals[0].total_quantity || 1;
              const widthPct = Math.max(2, (item.total_quantity / maxQty) * 100);
              return (
                <div key={idx} className="flex flex-row items-center gap-2 sm:gap-4 relative group">
                  <div className="w-1/3 sm:w-48 flex-shrink-0 font-bold truncate text-sm sm:text-base" title={item.name}>
                    {item.name} <span className="text-xs font-normal text-slate-500 ml-1 hidden sm:inline">({item.size_unit})</span>
                  </div>
                  <div className="flex-1 h-6 sm:h-8 bg-slate-100 border border-black relative">
                    <div
                      className="h-full bg-amber-300 border-r-2 border-black transition-all overflow-hidden"
                      style={{ width: `${widthPct}%` }}
                    >
                    </div>
                  </div>
                  <div className="w-10 text-right font-mono font-bold text-sm sm:text-lg text-slate-900 border-l-2 border-slate-200 pl-2 sm:border-0 sm:pl-0">
                    {item.total_quantity}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading production plan...</div>
      ) : !data?.days?.length ? (
        <Card><CardContent className="py-8 text-center text-slate-500">No upcoming items to produce. Orders must be Confirmed, In Progress, or Ready.</CardContent></Card>
      ) : (
        <div className="space-y-8">
          {data.days.map(day => (
            <div key={day.date}>
              <h2 className="text-xl font-bold bg-white text-black border-2 border-black px-4 py-2 inline-block mb-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] uppercase tracking-wider">{day.date}</h2>
              <div className="space-y-3">
                {day.items.map(item => (
                  <Card key={`${day.date}-${item.key}`} className="overflow-hidden border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-none">
                    <div
                      className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-slate-50"
                      onClick={() => toggleExpand(`${day.date}-${item.key}`)}
                    >
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-2">
                        <span className="text-xl sm:text-2xl font-bold text-slate-900 w-8 sm:min-w-[48px] text-center pt-0.5 sm:pt-0 shrink-0">{item.total_quantity}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base leading-tight truncate">{item.name}</p>
                          <p className="text-xs text-slate-500 truncate">{item.size_unit}</p>
                          {!item.is_available && (
                            <Badge variant="destructive" className="mt-1 flex w-fit items-center gap-1 text-[10px] leading-none px-1 py-0.5">
                              <AlertTriangle className="h-2.5 w-2.5" /> Unavailable
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-2">{item.orders.length} order{item.orders.length !== 1 ? 's' : ''}</Badge>
                        {expandedItems[`${day.date}-${item.key}`] ? (
                          <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                      </div>
                    </div>
                    {expandedItems[`${day.date}-${item.key}`] && (
                      <div className="border-t-2 border-black bg-slate-50 px-4 py-3 space-y-1">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
