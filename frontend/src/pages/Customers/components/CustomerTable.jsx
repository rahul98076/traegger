import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Star } from 'lucide-react';

export default function CustomerTable({ customers, isAdmin, canEdit, onEditClick, onDeactivateClick }) {
  if (!customers || customers.length === 0) return <p className="text-slate-500 py-4">No customers found.</p>;

  return (
    <div className=" border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-center">VIP</TableHead>
            <TableHead className="text-center">Status</TableHead>
            {canEdit && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">
                {c.name}
                {c.notes && <p className="text-xs text-slate-500 mt-1">{c.notes}</p>}
              </TableCell>
              <TableCell>
                {c.phone ? (
                  <a href={`tel:${c.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </a>
                ) : '—'}
              </TableCell>
              <TableCell>{c.whatsapp || '—'}</TableCell>
              <TableCell>{c.email || '—'}</TableCell>
              <TableCell className="text-center">
                {c.is_vip ? (
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500 mx-auto" />
                ) : '—'}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={c.is_active ? "default" : "secondary"} className={c.is_active ? "bg-green-600 hover:bg-green-700" : ""}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              {canEdit && (
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEditClick(c)}>Edit</Button>
                  {isAdmin && c.is_active && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDeactivateClick(c)}>
                      Deactivate
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
