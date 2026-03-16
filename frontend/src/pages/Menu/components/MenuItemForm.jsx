import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const CATEGORIES = [
  { value: 'fruit_cakes_premium', label: 'Premium Fruit Cakes' },
  { value: 'cakes_standard', label: 'Standard Cakes' },
  { value: 'marzipan_treats', label: 'Marzipan Treats' },
  { value: 'gift_boxes_bakery', label: 'Bakery Gift Boxes' },
  { value: 'homemade', label: 'Homemade Items' },
  { value: 'other', label: 'Other/Misc' },
];

export default function MenuItemForm({ isOpen, onClose, onSave, editingItem }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    size_unit: '',
    price_paise: '',
    is_available: true,
    notes: '',
  });
  
  const [displayPrice, setDisplayPrice] = useState('');

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        is_available: editingItem.is_available === 1,
        notes: editingItem.notes || ''
      });
      setDisplayPrice((editingItem.price_paise / 100).toString());
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
    }
  }, [editingItem, isOpen]);

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
