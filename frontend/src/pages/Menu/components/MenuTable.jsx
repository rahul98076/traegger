import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { formatPaiseToRupees } from '@/utils/formatters';

export default function MenuTable({ items, isAdmin, onToggleAvailability, onEditClick }) {
  if (!items || items.length === 0) return <p className="text-slate-500 py-4">No items found.</p>;

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Name</TableHead>
            <TableHead>Size / Unit</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-center">Status</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.name}
                {item.notes && <p className="text-xs text-slate-500 mt-1">{item.notes}</p>}
              </TableCell>
              <TableCell>{item.size_unit}</TableCell>
              <TableCell className="text-right">{formatPaiseToRupees(item.price_paise)}</TableCell>
              <TableCell className="text-center">
                {isAdmin ? (
                  <Switch
                    checked={item.is_available === 1}
                    onCheckedChange={(checked) => onToggleAvailability(item.id, checked)}
                    className="mx-auto"
                  />
                ) : (
                  <Badge variant={item.is_available === 1 ? "default" : "secondary"} className={item.is_available === 1 ? "bg-green-600 hover:bg-green-700" : ""}>
                    {item.is_available === 1 ? 'Available' : 'Unavailable'}
                  </Badge>
                )}
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onEditClick(item)}>
                    Edit
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
