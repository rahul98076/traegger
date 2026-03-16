import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { formatPaiseToRupees } from '@/utils/formatters';

export default function MenuGrid({ items, isAdmin, onToggleAvailability, onEditClick }) {
  if (!items || items.length === 0) return <p className="text-slate-500 py-4 px-2">No items found.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <span className="text-sm text-slate-500 font-medium">{item.size_unit}</span>
              </div>
              <div className="text-right font-bold text-primary">
                {formatPaiseToRupees(item.price_paise)}
              </div>
            </div>
            {item.notes && (
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.notes}</p>
            )}
          </CardHeader>
          <CardContent className="flex-grow">
            {/* Empty content area stretching cards equally */}
          </CardContent>
          <CardFooter className="pt-4 border-t bg-slate-50/50 flex justify-between items-center rounded-b-lg">
            
            <div className="flex items-center space-x-2">
              {isAdmin ? (
                <>
                  <Switch
                    id={`availability-${item.id}`}
                    checked={item.is_available === 1}
                    onCheckedChange={(checked) => onToggleAvailability(item.id, checked)}
                  />
                  <label htmlFor={`availability-${item.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {item.is_available === 1 ? 'Available' : 'Hidden'}
                  </label>
                </>
              ) : (
                <Badge variant={item.is_available === 1 ? "default" : "secondary"} className={item.is_available === 1 ? "bg-green-600 hover:bg-green-700" : ""}>
                    {item.is_available === 1 ? 'Available' : 'Unavailable'}
                </Badge>
              )}
            </div>

            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => onEditClick(item)}>
                Edit
              </Button>
            )}
            
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
