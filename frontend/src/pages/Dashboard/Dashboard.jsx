import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  LayoutDashboard, ShoppingBag, IndianRupee, Users, 
  TrendingUp, Clock, CheckCircle2, AlertCircle, PlusCircle,
  Package, UtensilsCrossed, CalendarDays, Cloud
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchDashboardSummary } from '@/api/dashboard';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';

const STATUS_COLORS = {
  confirmed: '#3b82f6',  // blue-500
  in_progress: '#f59e0b', // amber-500
  ready: '#10b981',      // emerald-500
  cancelled: '#ef4444'   // red-500
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchDashboardSummary();
        setSummary(data);
      } catch (err) {
        toast.error('Failed to load dashboard metrics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Poll every 60s (Phase 13)
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-vh-100">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent  animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Crunching bakery numbers...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const statusData = summary.orders_by_status.map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1).replace('_', ' '),
    value: s.count,
    color: STATUS_COLORS[s.status] || '#cbd5e1'
  }));

  return (
    <div className="p-4 md:p-8 space-y-8 pb-12 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-blue-600" />
            Bakery Dashboard 🥚🐰
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-300">
              Welcome back, <span className="font-semibold text-slate-700">{user?.username}</span>.
            </p>
            <SyncBadge status={summary.firebase_sync_status} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => navigate('/orders/new')} 
            className="bg-white text-black border-2 border-black rounded-none font-black uppercase tracking-tight shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-slate-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all px-6"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> New Order
          </Button>
          <Button 
            onClick={() => navigate('/production')} 
            className="bg-white text-black border-2 border-black rounded-none font-black uppercase tracking-tight shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-slate-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <CalendarDays className="mr-2 h-5 w-5" /> Production
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Daily Revenue" 
          value={`₹${summary.revenue_today.toLocaleString()}`}
          icon={<IndianRupee className="h-5 w-5" />}
          description="Total value of orders due today"
          trend="+12% from avg"
          trendColor="text-emerald-600"
        />
        <MetricCard 
          title="Target Collection" 
          value={`₹${summary.pending_collection_today.toLocaleString()}`}
          icon={<ShoppingBag className="h-5 w-5" />}
          description="Unpaid balance for today's orders"
          color="bg-orange-50 text-orange-600 border-orange-100"
        />
        <MetricCard 
          title="Orders Ready" 
          value={summary.orders_ready_today}
          icon={<Package className="h-5 w-5" />}
          description="Waiting for customer pickup"
          color="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <MetricCard 
          title="New Orders" 
          value={summary.new_orders_today}
          icon={<PlusCircle className="h-5 w-5" />}
          description="Orders created today"
          color="bg-purple-50 text-purple-600 border-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Revenue Trend (Last 7 Days)
            </CardTitle>
            <CardDescription>Order value based on due dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.revenue_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={12}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                  />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Order Pipeline
            </CardTitle>
            <CardDescription>Active order status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card >
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Recent Orders
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/orders')} className="text-blue-600 font-semibold hover:text-blue-700 hover:bg-blue-50">
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {summary.recent_orders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{order.customer_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      Order #{order.id} • Due {order.due_date}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold text-slate-900 dark:text-slate-50">₹{order.total_price.toLocaleString()}</p>
                    <Badge variant="secondary" className="scale-90 origin-right capitalize">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {summary.recent_orders.length === 0 && (
                <div className="p-8 text-center text-slate-400 dark:text-slate-300">No orders yet. Start by creating one!</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card >
          <CardHeader className="py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-indigo-500" />
              Bestsellers
            </CardTitle>
            <CardDescription>Top products in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.top_items.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="w-8 h-8  bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-50">{item.name}</p>
                    <div className="w-full bg-slate-100  h-1.5 mt-1">
                      <div 
                        className="bg-indigo-500 h-1.5 " 
                        style={{ width: `${(item.quantity / summary.top_items[0].quantity) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="font-bold text-slate-700">{item.quantity} units</p>
                </div>
              ))}
              {summary.top_items.length === 0 && (
                <div className="p-8 text-center text-slate-400 dark:text-slate-300">No sales data yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Nav Bar */}
      <div className="flex flex-wrap gap-2 pt-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/menu')}>Items Menu</Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/customers')}>Customer Base</Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/kitchen')}>Kitchen Tracker</Button>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, description, color = "bg-blue-50 text-blue-600 border-blue-100", trend, trendColor }) {
  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">{title}</p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">{value}</h2>
          </div>
          <div className={`p-3  border ${color}`}>
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-300">{description}</p>
          {trend && (
            <span className={`text-xs font-bold ${trendColor}`}>{trend}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SyncBadge({ status }) {
  const configs = {
    synced: { color: "bg-emerald-50 border-emerald-100 text-emerald-600", label: "Live Cloud Synced" },
    syncing: { color: "bg-amber-50 border-amber-100 text-amber-600 animate-pulse", label: "Syncing to Cloud..." },
    error: { color: "bg-red-50 border-red-100 text-red-600 font-bold", label: "Sync Error" },
    offline: { color: "bg-slate-50 border-slate-100 text-slate-500 dark:text-slate-400 dark:text-slate-300", label: "Sync Offline" }
  };
  
  const config = configs[status] || configs.offline;
  
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5  border ${config.color} text-[10px] font-bold uppercase tracking-wider transition-all duration-500`}>
      <Cloud className={`h-3 w-3 ${status === 'syncing' ? 'animate-bounce' : ''}`} />
      {config.label}
    </div>
  );
}
