'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { Loader } from '@/components/atoms/Loader';
import { cn } from '@/lib/utils';
// If you use react-hot-toast, use the following import:
import { toast } from 'react-hot-toast';
// If you use sonner, use the following import instead:
// import { toast } from 'sonner';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  countryCode?: string;
  role: string;
  status: 'active' | 'invited' | 'removed';
}

interface AddTeamMemberModalProps {
  onAddAction: (member: { fullName: string; email: string; role: string }) => Promise<void>;
  children?: React.ReactNode;
  roleOptions?: Array<{ value: string; label: string; description?: string }>;
}

const COUNTRIES = [
  { code: '+91', name: 'India' },
  { code: '+1', name: 'United States' },
  { code: '+44', name: 'United Kingdom' },
  { code: '+65', name: 'Singapore' },
  { code: '+971', name: 'UAE' },
];

export function AddTeamMemberModal({ onAddAction, children, roleOptions }: AddTeamMemberModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
    isBillingAdmin: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const ROLES = roleOptions || [
    { value: 'admin', label: 'Admin', description: 'Full control over all functions except adding or removing Super Admins.' },
    { value: 'limited-admin', label: 'Limited Admin', description: 'Can manage most features but must obtain Admin approval for actions that exceed their assigned budget or cost limits.' },
    { value: 'billing-admin', label: 'Billing Admin', description: 'Manages all financial settings—license types, credit purchases, invoices—and can be assigned alongside any other role.' },
  ];

  const handleChange = (field: string, value: string | boolean) => {
    if (field === 'isBillingAdmin') {
      setFormData(prev => ({ ...prev, [field]: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number is now optional

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onAddAction({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.isBillingAdmin && formData.role !== 'billing-admin' 
          ? `${formData.role}+billing-admin` 
          : formData.role,
      });
      
      // Reset form and close modal
      setFormData({
        fullName: '',
        email: '',
        role: '',
        isBillingAdmin: false,
      });
      setErrors({});
      setOpen(false);
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to invite team member. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      role: '',
      isBillingAdmin: false,
    });
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Enter full name"
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
              <p className="text-xs text-muted-foreground">
                An invitation will be sent to this email address
              </p>
            </div>


            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Role *</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="text-xs"
                  onClick={() => toast.success('Role Matrix feature coming soon!')}
                >
                  View Role Matrix
                </Button>
              </div>
              <div className="space-y-4">
                {ROLES.map((role) => (
                  <div key={role.value} className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id={role.value}
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={(e) => handleChange('role', e.target.value)}
                      />
                      <Label htmlFor={role.value} className="cursor-pointer font-medium">
                        {role.label}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role}</p>
              )}
              
              {/* Billing Admin Checkbox - only show if not billing-admin role */}
              {formData.role && formData.role !== 'billing-admin' && (
                <div className="mt-4 flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="isBillingAdmin"
                    checked={formData.isBillingAdmin}
                    onChange={(e) => handleChange('isBillingAdmin', e.target.checked.toString())}
                    className="rounded"
                  />
                  <Label htmlFor="isBillingAdmin" className="cursor-pointer text-sm">
                    Also grant billing administration access
                  </Label>
                </div>
              )}
            </div>
          </div>


          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader size="sm" showText={false} className="mr-2" />
                  Sending Invitation...
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}