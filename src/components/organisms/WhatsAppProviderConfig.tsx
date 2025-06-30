'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Phone, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { WABAConfig, PhoneNumberConfig } from '@/lib/integrations/types';
import { WHATSAPP_CONSTRAINTS } from '@/lib/integrations/utils';
import { cn } from '@/lib/utils';

interface WhatsAppProviderConfigProps {
  providerId: string;
  wabas: WABAConfig[];
  onChange: (wabas: WABAConfig[]) => void;
  apiKey?: string;
}

export function WhatsAppProviderConfig({
  providerId,
  wabas,
  onChange,
  apiKey
}: WhatsAppProviderConfigProps) {
  const [newWABAName, setNewWABAName] = useState('');
  const [newWABAId, setNewWABAId] = useState('');
  
  const constraints = WHATSAPP_CONSTRAINTS[providerId];
  const canAddMoreWABAs = constraints.wabaPerApp === 'multiple' || wabas.length < constraints.wabaPerApp;
  const maxNumbersPerWABA = constraints.numbersPerWaba === 'multiple' ? 10 : constraints.numbersPerWaba;

  // Generate unique IDs
  const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add new WABA
  const handleAddWABA = () => {
    if (!newWABAName.trim() || !newWABAId.trim()) return;
    
    const newWABA: WABAConfig = {
      id: generateId(),
      name: newWABAName,
      wabaId: newWABAId,
      phoneNumbers: []
    };

    onChange([...wabas, newWABA]);
    setNewWABAName('');
    setNewWABAId('');
  };

  // Remove WABA
  const handleRemoveWABA = (wabaId: string) => {
    onChange(wabas.filter(w => w.id !== wabaId));
  };

  // Add phone number to WABA
  const handleAddPhoneNumber = (wabaId: string, phoneNumber: string) => {
    if (!phoneNumber.trim()) return;

    const updatedWABAs = wabas.map(waba => {
      if (waba.id === wabaId) {
        const canAddMore = constraints.numbersPerWaba === 'multiple' || 
                          waba.phoneNumbers.length < constraints.numbersPerWaba;
        
        if (canAddMore) {
          return {
            ...waba,
            phoneNumbers: [
              ...waba.phoneNumbers,
              {
                id: generateId(),
                number: phoneNumber,
                verified: false
              }
            ]
          };
        }
      }
      return waba;
    });

    onChange(updatedWABAs);
  };

  // Remove phone number from WABA
  const handleRemovePhoneNumber = (wabaId: string, phoneId: string) => {
    const updatedWABAs = wabas.map(waba => {
      if (waba.id === wabaId) {
        return {
          ...waba,
          phoneNumbers: waba.phoneNumbers.filter(p => p.id !== phoneId)
        };
      }
      return waba;
    });

    onChange(updatedWABAs);
  };

  // Update phone number display name
  const handleUpdatePhoneDisplayName = (wabaId: string, phoneId: string, displayName: string) => {
    const updatedWABAs = wabas.map(waba => {
      if (waba.id === wabaId) {
        return {
          ...waba,
          phoneNumbers: waba.phoneNumbers.map(phone => {
            if (phone.id === phoneId) {
              return { ...phone, displayName };
            }
            return phone;
          })
        };
      }
      return waba;
    });

    onChange(updatedWABAs);
  };

  return (
    <div className="space-y-6">
      {/* Provider Constraints Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>{constraints.provider} Configuration:</strong>
          <ul className="mt-1 text-sm list-disc list-inside">
            <li>
              WABAs allowed: {constraints.wabaPerApp === 'multiple' ? 'Multiple' : constraints.wabaPerApp}
            </li>
            <li>
              Phone numbers per WABA: {constraints.numbersPerWaba === 'multiple' ? 'Multiple' : constraints.numbersPerWaba}
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* API Key Requirement */}
      {!apiKey && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please enter your API credentials above before configuring WABAs.
          </AlertDescription>
        </Alert>
      )}

      {/* Existing WABAs */}
      {wabas.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Configured WABAs</h4>
          <Accordion type="single" collapsible className="w-full">
            {wabas.map((waba, index) => (
              <AccordionItem key={waba.id} value={waba.id}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{waba.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {waba.phoneNumbers.length} number{waba.phoneNumbers.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {/* WABA Details */}
                    <div className="grid gap-2">
                      <div className="text-sm">
                        <span className="font-medium">WABA ID:</span> {waba.wabaId}
                      </div>
                    </div>

                    <Separator />

                    {/* Phone Numbers */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Phone Numbers</Label>
                        {(constraints.numbersPerWaba === 'multiple' || 
                          waba.phoneNumbers.length < constraints.numbersPerWaba) && (
                          <AddPhoneNumberForm 
                            onAdd={(number) => handleAddPhoneNumber(waba.id, number)}
                          />
                        )}
                      </div>

                      {waba.phoneNumbers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No phone numbers configured</p>
                      ) : (
                        <div className="space-y-2">
                          {waba.phoneNumbers.map((phone) => (
                            <Card key={phone.id} className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-mono text-sm">{phone.number}</span>
                                  {phone.verified && (
                                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemovePhoneNumber(waba.id, phone.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="mt-2">
                                <Input
                                  placeholder="Display name (optional)"
                                  value={phone.displayName || ''}
                                  onChange={(e) => handleUpdatePhoneDisplayName(waba.id, phone.id, e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Remove WABA */}
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveWABA(waba.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove WABA
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* Add New WABA */}
      {canAddMoreWABAs && apiKey && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New WABA</CardTitle>
            <CardDescription>
              Connect a WhatsApp Business Account to start messaging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="waba-name">WABA Name</Label>
                <Input
                  id="waba-name"
                  placeholder="e.g., Main Business"
                  value={newWABAName}
                  onChange={(e) => setNewWABAName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waba-id">WABA ID</Label>
                <Input
                  id="waba-id"
                  placeholder="e.g., 123456789"
                  value={newWABAId}
                  onChange={(e) => setNewWABAId(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleAddWABA}
              disabled={!newWABAName.trim() || !newWABAId.trim()}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add WABA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Maximum WABAs reached */}
      {!canAddMoreWABAs && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have reached the maximum number of WABAs ({constraints.wabaPerApp}) for {constraints.provider}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Add Phone Number Form Component
function AddPhoneNumberForm({ onAdd }: { onAdd: (number: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleAdd = () => {
    if (phoneNumber.trim()) {
      onAdd(phoneNumber);
      setPhoneNumber('');
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Number
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="+1234567890"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="h-8 w-32"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') {
            setIsAdding(false);
            setPhoneNumber('');
          }
        }}
        autoFocus
      />
      <Button size="sm" variant="ghost" onClick={handleAdd}>
        Add
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={() => {
          setIsAdding(false);
          setPhoneNumber('');
        }}
      >
        Cancel
      </Button>
    </div>
  );
}