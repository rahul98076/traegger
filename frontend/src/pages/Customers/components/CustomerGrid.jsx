import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Star, MessageCircle } from 'lucide-react';

export default function CustomerGrid({ customers, isAdmin, canEdit, onEditClick, onDeactivateClick }) {
  if (!customers || customers.length === 0) return <p className="text-slate-500 py-4 px-2">No customers found.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.map((c) => (
        <Card key={c.id} className="flex flex-col shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{c.name}</CardTitle>
                {c.is_vip && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
              </div>
              <Badge variant={c.is_active ? "default" : "secondary"} className={c.is_active ? "bg-green-600 hover:bg-green-700" : ""}>
                {c.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-2 text-sm text-slate-600">
            {c.phone && (
              <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                <Phone className="h-3.5 w-3.5" /> {c.phone}
              </a>
            )}
            {c.whatsapp && (
              <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 hover:underline">
                <MessageCircle className="h-3.5 w-3.5" /> {c.whatsapp}
              </a>
            )}
            {c.email && <p className="truncate">{c.email}</p>}
            {c.notes && <p className="text-xs text-slate-500 italic">{c.notes}</p>}
          </CardContent>
          {canEdit && (
            <CardFooter className="pt-4 border-t bg-slate-50/50 flex justify-between items-center ">
              <Button variant="outline" size="sm" onClick={() => onEditClick(c)}>Edit</Button>
              {isAdmin && c.is_active && (
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDeactivateClick(c)}>
                  Deactivate
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
