import React, { useState, useEffect, useMemo } from 'react';
import useAuthStore from '@/store/authStore';
import { fetchMenu, createMenuItem, updateMenuItem, toggleItemAvailability } from '@/api/menu';
import MenuTable from './components/MenuTable';
import MenuGrid from './components/MenuGrid';
import MenuItemForm from './components/MenuItemForm';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const CATEGORY_LABELS = {
  fruit_cakes_premium: 'Premium Fruit Cakes',
  cakes_standard: 'Standard Cakes',
  marzipan_treats: 'Marzipan Treats',
  gift_boxes_bakery: 'Bakery Gift Boxes',
  homemade: 'Homemade Items',
  other: 'Other/Misc',
};

export default function Menu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  
  // Admin form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await fetchMenu();
      setItems(data);
    } catch (err) {
      toast.error("Error fetching menu", {
        description: err.response?.data?.detail || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  // Group items securely caching memoization
  const groupedItems = useMemo(() => {
    const groups = {};
    Object.keys(CATEGORY_LABELS).forEach(k => groups[k] = []);
    
    items.forEach(item => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      } else {
        if (!groups.other) groups.other = [];
        groups.other.push(item);
      }
    });
    return groups;
  }, [items]);

  const handleToggleAvailability = async (id, isAvailable) => {
    try {
      await toggleItemAvailability(id, isAvailable);
      setItems(prev => prev.map(item => item.id === id ? { ...item, is_available: isAvailable ? 1 : 0 } : item));
      toast.success("Availability updated");
    } catch (err) {
      toast.error("Action failed", { description: "Failed to update item availability." });
    }
  };

  const handleSaveItem = async (payload) => {
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, payload);
        toast.success("Item updated successfully");
      } else {
        await createMenuItem(payload);
        toast.success("Item created successfully");
      }
      setIsFormOpen(false);
      loadMenu(); // Refresh complete list safely
    } catch (err) {
      toast.error("Save failed", {
        description: err.response?.data?.detail || "An unexpected error occurred.",
      });
    }
  };

  const openNewItemModal = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  if (loading) return <div className="p-8 pb-0 text-center text-slate-500">Loading Menu Catalog...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Menu Catalog</h1>
          <p className="text-slate-500">Manage interactive categories and product definitions.</p>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="flex items-center bg-slate-100 p-1  border text-slate-500">
            <Button 
                variant={viewMode === 'grid' ? "default" : "ghost"} 
                size="sm" 
                className="h-8 px-2"
                onClick={() => setViewMode('grid')}
                title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
                variant={viewMode === 'table' ? "default" : "ghost"} 
                size="sm" 
                className="h-8 px-2"
                onClick={() => setViewMode('table')}
                title="Table View"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {isAdmin && (
            <Button onClick={openNewItemModal} className="ml-auto sm:ml-2 shadow-sm font-semibold">
              Add New Item
            </Button>
          )}
        </div>
      </div>

      {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
        const catItems = groupedItems[key];
        if (catItems.length === 0) return null;

        return (
          <div key={key} className="mb-10 space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 flex items-center text-slate-800">
              {label}
              <Badge variant="secondary" className="ml-3 font-normal text-xs">{catItems.length}</Badge>
            </h2>
            
            {viewMode === 'grid' ? (
              <MenuGrid 
                items={catItems} 
                isAdmin={isAdmin} 
                onToggleAvailability={handleToggleAvailability}
                onEditClick={openEditModal}
              />
            ) : (
              <MenuTable 
                items={catItems} 
                isAdmin={isAdmin} 
                onToggleAvailability={handleToggleAvailability}
                onEditClick={openEditModal}
              />
            )}
          </div>
        );
      })}

      {isAdmin && (
        <MenuItemForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSave={handleSaveItem} 
          editingItem={editingItem} 
        />
      )}
    </div>
  );
}
