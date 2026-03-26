import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Layers } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchConstituents, addConstituent, removeConstituent } from '@/api/menu';

const CATEGORIES = [
  { value: 'fruit_cakes_premium', label: 'Premium Fruit Cakes' },
  { value: 'cakes_standard', label: 'Standard Cakes' },
  { value: 'marzipan_treats', label: 'Marzipan Treats' },
  { value: 'gift_boxes_bakery', label: 'Bakery Gift Boxes' },
  { value: 'homemade', label: 'Homemade Items' },
  { value: 'other', label: 'Other/Misc' },
];

export default function MenuItemForm({ isOpen, onClose, onSave, editingItem, allItems=[] }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    size_unit: '',
    price_paise: '',
    is_available: true,
    notes: '',
  });
  
  const [displayPrice, setDisplayPrice] = useState('');
  
  // Combo recipe state
  const [constituents, setConstituents] = useState([]);
  const [loadingConst, setLoadingConst] = useState(false);
  const [newChildId, setNewChildId] = useState('');
  const [newChildQty, setNewChildQty] = useState('1');

  useEffect(() => {
    if (editingItem && isOpen) {
      setFormData({
        ...editingItem,
        is_available: editingItem.is_available === 1,
        notes: editingItem.notes || ''
      });
      setDisplayPrice((editingItem.price_paise / 100).toString());
      loadConstituents(editingItem.id);
    } else {
      setFormData({
        name: '',
        category: '',
        size_unit: '',
        price_paise: '',
        is_available: true,
        notes: '',
      });
      setDisplayPrice('');
      setConstituents([]);
      setNewChildId('');
    }
  }, [editingItem, isOpen]);

  const loadConstituents = async (id) => {
    try {
      setLoadingConst(true);
      const data = await fetchConstituents(id);
      setConstituents(data);
    } catch (err) {
      toast.error("Failed to load recipe components");
    } finally {
      setLoadingConst(false);
    }
  };

  const handleAddConstituent = async () => {
    if (!newChildId || !newChildQty) return;
    try {
      await addConstituent(editingItem.id, newChildId, parseInt(newChildQty, 10));
      toast.success("Component added to recipe");
      setNewChildId('');
      setNewChildQty('1');
      loadConstituents(editingItem.id);
    } catch (err) {
      toast.error("Failed to add component");
    }
  };

  const handleRemoveConstituent = async (childId) => {
    try {
      await removeConstituent(editingItem.id, childId);
      toast.success("Component removed from recipe");
      loadConstituents(editingItem.id);
    } catch (err) {
      toast.error("Failed to remove component");
    }
  };


  const handlePriceChange = (e) => {
    const val = e.target.value;
    setDisplayPrice(val);
    
    // Convert Rupee string back to paise int safely
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setFormData(prev => ({ ...prev, price_paise: Math.round(parsed * 100) }));
    }
  };

  const handleSave = () => {
    // Re-format boolean to int mapping for backend safety
    const payload = {
        ...formData,
        is_available: formData.is_available ? 1 : 0
    };
    onSave(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Item' : 'New Menu Item'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="name">Item Name</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={val => setFormData({...formData, category: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="size">Size / Unit</Label>
              <Input 
                id="size" 
                placeholder="e.g. 1/2 kg, 6 pcs"
                value={formData.size_unit} 
                onChange={e => setFormData({...formData, size_unit: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input 
                id="price" 
                type="number"
                step="0.01"
                min="0"
                value={displayPrice} 
                onChange={handlePriceChange} 
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes / Allergens</Label>
            <Input 
              id="notes" 
              placeholder="Optional"
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
            />
          </div>

          {/* Combo Recipe Section */}
          {editingItem && (
             <div className="border-t pt-4 mt-2 border-slate-200">
               <Label className="flex items-center gap-2 mb-3 text-slate-800 font-semibold border-b pb-2">
                 <Layers className="h-4 w-4" /> Combo Recipe Components
               </Label>
               
               {loadingConst ? (
                 <div className="text-xs text-slate-500 italic">Loading components...</div>
               ) : (
                 <div className="space-y-3">
                   {constituents.length > 0 ? (
                     <div className="divide-y border rounded bg-slate-50">
                       {constituents.map(c => (
                         <div key={c.child_item_id} className="flex items-center justify-between p-2 text-sm">
                           <span className="font-medium text-slate-700">{c.quantity}x {c.child_item_name}</span>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                             onClick={() => handleRemoveConstituent(c.child_item_id)}
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-xs text-slate-500 italic">No sub-items defined.</div>
                   )}
                   
                   <div className="flex gap-2 items-center bg-slate-100 p-2 rounded border">
                     <Select value={newChildId} onValueChange={setNewChildId}>
                       <SelectTrigger className="flex-1 h-8 text-xs bg-white">
                         <SelectValue placeholder="Select item to add..." />
                       </SelectTrigger>
                       <SelectContent>
                         {allItems.filter(i => i.id !== editingItem.id).map(i => (
                           <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     <Input 
                       type="number" 
                       min="1" 
                       value={newChildQty} 
                       onChange={e => setNewChildQty(e.target.value)} 
                       className="w-16 h-8 text-xs" 
                     />
                     <Button 
                       type="button" 
                       size="sm" 
                       variant="secondary"
                       className="h-8"
                       onClick={handleAddConstituent}
                       disabled={!newChildId || !newChildQty}
                     >
                       <Plus className="h-3 w-3" />
                     </Button>
                   </div>
                 </div>
               )}
             </div>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!formData.name || !formData.category || !formData.price_paise}>
            {editingItem ? 'Save Changes' : 'Create Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
