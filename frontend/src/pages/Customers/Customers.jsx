import React, { useState, useEffect, useMemo } from 'react';
import useAuthStore from '@/store/authStore';
import { fetchCustomers, createCustomer, updateCustomer, deactivateCustomer } from '@/api/customers';
import CustomerTable from './components/CustomerTable';
import CustomerGrid from './components/CustomerGrid';
import CustomerForm from './components/CustomerForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { LayoutGrid, List, Search, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [vipOnly, setVipOnly] = useState(false);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (vipOnly) params.vip_only = true;
      const data = await fetchCustomers(params);
      setCustomers(data);
    } catch (err) {
      toast.error("Error fetching customers", {
        description: err.response?.data?.detail || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => loadCustomers(), 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, vipOnly]);

  const handleSave = async (payload) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload);
        toast.success("Customer updated");
      } else {
        await createCustomer(payload);
        toast.success("Customer created");
      }
      setIsFormOpen(false);
      loadCustomers();
    } catch (err) {
      toast.error("Save failed", {
        description: err.response?.data?.detail || "An unexpected error occurred.",
      });
    }
  };

  const handleDeactivate = async (customer) => {
    if (!confirm(`Deactivate "${customer.name}"? They will no longer appear in active lists.`)) return;
    try {
      await deactivateCustomer(customer.id);
      toast.success(`${customer.name} deactivated`);
      loadCustomers();
    } catch (err) {
      toast.error("Deactivation failed", {
        description: err.response?.data?.detail || "An unexpected error occurred.",
      });
    }
  };

  const openNewForm = () => { setEditingCustomer(null); setIsFormOpen(true); };
  const openEditForm = (c) => { setEditingCustomer(c); setIsFormOpen(true); };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500">Manage your customer directory.</p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-md border text-slate-500">
            <Button variant={viewMode === 'grid' ? "default" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setViewMode('grid')} title="Grid View">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'table' ? "default" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setViewMode('table')} title="Table View">
              <List className="h-4 w-4" />
            </Button>
          </div>
          {canEdit && (
            <Button onClick={openNewForm} className="ml-auto sm:ml-2 shadow-sm font-semibold">Add Customer</Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="vip-filter" checked={vipOnly} onCheckedChange={setVipOnly} />
          <label htmlFor="vip-filter" className="text-sm font-medium flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-500" /> VIP Only
          </label>
        </div>
        {!loading && (
          <Badge variant="secondary" className="text-xs">{customers.length} customer{customers.length !== 1 ? 's' : ''}</Badge>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading customers...</div>
      ) : viewMode === 'grid' ? (
        <CustomerGrid
          customers={customers}
          isAdmin={isAdmin}
          canEdit={canEdit}
          onEditClick={openEditForm}
          onDeactivateClick={handleDeactivate}
        />
      ) : (
        <CustomerTable
          customers={customers}
          isAdmin={isAdmin}
          canEdit={canEdit}
          onEditClick={openEditForm}
          onDeactivateClick={handleDeactivate}
        />
      )}

      {/* Form Dialog */}
      {canEdit && (
        <CustomerForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSave}
          editingCustomer={editingCustomer}
        />
      )}
    </div>
  );
}
