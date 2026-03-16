import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function CustomerForm({ isOpen, onClose, onSave, editingCustomer }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    email: '',
    default_address: '',
    notes: '',
    is_vip: false,
  });

  useEffect(() => {
    if (editingCustomer) {
      setForm({
        name: editingCustomer.name || '',
        phone: editingCustomer.phone || '',
        whatsapp: editingCustomer.whatsapp || '',
        instagram: editingCustomer.instagram || '',
        email: editingCustomer.email || '',
        default_address: editingCustomer.default_address || '',
        notes: editingCustomer.notes || '',
        is_vip: !!editingCustomer.is_vip,
      });
    } else {
      setForm({ name: '', phone: '', whatsapp: '', instagram: '', email: '', default_address: '', notes: '', is_vip: false });
    }
  }, [editingCustomer, isOpen]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      instagram: form.instagram.trim() || null,
      email: form.email.trim() || null,
      default_address: form.default_address.trim() || null,
      notes: form.notes.trim() || null,
      is_vip: form.is_vip,
    };
    onSave(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium block mb-1">Name *</label>
            <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Customer name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Phone</label>
              <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">WhatsApp</label>
              <Input value={form.whatsapp} onChange={(e) => handleChange('whatsapp', e.target.value)} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Instagram</label>
              <Input value={form.instagram} onChange={(e) => handleChange('instagram', e.target.value)} placeholder="@handle" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Default Address</label>
            <Input value={form.default_address} onChange={(e) => handleChange('default_address', e.target.value)} placeholder="Delivery address" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Notes</label>
            <Input value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="E.g. always wants double-boxed" />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="vip-toggle" checked={form.is_vip} onCheckedChange={(checked) => handleChange('is_vip', checked)} />
            <label htmlFor="vip-toggle" className="text-sm font-medium">VIP Customer</label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{editingCustomer ? 'Save Changes' : 'Add Customer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
