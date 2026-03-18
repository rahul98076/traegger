import React, { useState, useEffect } from 'react';
import { fetchAuditLogs } from '@/api/admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

// No date-fns needed, using native format

const ENTITY_COLORS = {
  order: 'bg-blue-100 text-blue-700',
  customer: 'bg-purple-100 text-purple-700',
  menu_item: 'bg-amber-100 text-amber-700',
};

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  restore: 'bg-indigo-100 text-indigo-700',
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await fetchAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const search = searchTerm.toLowerCase();
    return (
      (log.username || '').toLowerCase().includes(search) ||
      (log.entity_type || '').toLowerCase().includes(search) ||
      (log.action || '').toLowerCase().includes(search)
    );
  });

  const renderDiff = (diff) => {
    if (!diff) return null;
    try {
      return Object.entries(diff).map(([key, val]) => {
        let oldVal = null;
        let newVal = val;
        if (Array.isArray(val) && val.length === 2) {
          oldVal = val[0];
          newVal = val[1];
        }
        
        return (
          <div key={key} className="text-xs mt-1">
            <span className="text-slate-500 dark:text-slate-400">{key.replace('_', ' ')}:</span>{" "}
            {oldVal !== null && <span className="line-through text-slate-400 mr-1">{typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)}</span>}
            <span className="text-slate-900 border-l px-1 ml-1 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 font-medium break-all">{typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)}</span>
          </div>
        );
      });
    } catch(e) {
      return <div className="text-xs text-red-500">Error rendering diff</div>;
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500">Loading audit trail...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="h-6 w-6 text-slate-500 dark:text-slate-400 dark:text-slate-500" /> System Audit Trail
          </h1>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm">Monitor all changes across the system</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input 
            placeholder="Search logs..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="overflow-hidden border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-8 w-8  bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                  {log.username ? log.username[0].toUpperCase() : '-'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{log.username || 'System'}</span>
                    <Badge variant="secondary" className={`${ACTION_COLORS[log.action]} border-none capitalize text-[10px] px-1.5 h-4`}>
                      {log.action}
                    </Badge>
                    <Badge variant="secondary" className={`${ENTITY_COLORS[log.entity_type]} border-none capitalize text-[10px] px-1.5 h-4`}>
                      {log.entity_type} #{log.entity_id}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0 sm:pl-4 sm:border-l border-slate-100">
                {renderDiff(log.diff) || <span className="text-xs text-slate-400 dark:text-slate-500 italic">No specific field changes recorded</span>}
              </div>
            </div>
          </Card>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600">
            <History className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500">No audit logs found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
