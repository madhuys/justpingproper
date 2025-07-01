'use client';

import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Info, Shield, Eye, Edit, Trash2, Plus, Upload } from 'lucide-react';
import { PageHeader } from '@/components/atoms/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import rbacStrings from '@/data/strings/rbac.json';
import rbacMatrix from '@/data/rbacMatrix.json';
import systemRoles from '@/data/systemRoles.json';

interface Permission {
  [module: string]: string[];
}

export default function RBACPage() {
  const [permissions, setPermissions] = useState<Record<string, Permission>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial permissions
    setTimeout(() => {
      setPermissions(rbacMatrix.defaultPermissions);
      setLoading(false);
    }, 500);
  }, []);

  const handlePermissionToggle = (role: string, module: string, permission: string) => {
    // Super admin permissions cannot be changed
    if (role === 'superadmin') {
      toast(rbacStrings.rbac.tooltips.superadmin);
      return;
    }

    const newPermissions = { ...permissions };
    if (!newPermissions[role]) {
      newPermissions[role] = {};
    }
    if (!newPermissions[role][module]) {
      newPermissions[role][module] = [];
    }

    const modulePermissions = newPermissions[role][module];
    const permissionIndex = modulePermissions.indexOf(permission);

    if (permissionIndex > -1) {
      modulePermissions.splice(permissionIndex, 1);
    } else {
      modulePermissions.push(permission);
    }

    setPermissions(newPermissions);
    setHasUnsavedChanges(true);
  };

  const handleToggleAll = (role: string, module: string) => {
    if (role === 'superadmin') return;

    const moduleConfig = rbacMatrix.modules.find(m => m.id === module);
    if (!moduleConfig) return;

    const newPermissions = { ...permissions };
    const currentPerms = newPermissions[role]?.[module] || [];
    const allPerms = moduleConfig.permissions;

    if (currentPerms.length === allPerms.length) {
      // Remove all permissions
      newPermissions[role][module] = [];
    } else {
      // Add all permissions
      newPermissions[role][module] = [...allPerms];
    }

    setPermissions(newPermissions);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    // Simulate saving
    setTimeout(() => {
      toast.success(rbacStrings.rbac.messages.saveSuccess);
      setHasUnsavedChanges(false);
    }, 500);
  };

  const handleReset = () => {
    setPermissions(rbacMatrix.defaultPermissions);
    setHasUnsavedChanges(false);
    toast.success(rbacStrings.rbac.messages.resetSuccess);
  };

  const hasPermission = (role: string, module: string, permission: string) => {
    return permissions[role]?.[module]?.includes(permission) || false;
  };

  const getRoleInfo = (roleId: string) => {
    return systemRoles.find(r => r.id === roleId);
  };

  const getPermissionIcon = (permission: string) => {
    const icons: Record<string, React.ReactNode> = {
      create: <Plus className="h-4 w-4" />,
      read: <Eye className="h-4 w-4" />,
      update: <Edit className="h-4 w-4" />,
      delete: <Trash2 className="h-4 w-4" />,
      publish: <Upload className="h-4 w-4" />,
      manage: <Shield className="h-4 w-4" />
    };
    return icons[permission] || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader 
        title={rbacStrings.rbac.title}
        subtitle={rbacStrings.rbac.subtitle}
      />

      <div className="mt-6 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {rbacStrings.rbac.description}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasUnsavedChanges}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {rbacStrings.rbac.actions.reset}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            {rbacStrings.rbac.actions.save}
          </Button>
        </div>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] sticky left-0 bg-background">
                  {rbacStrings.rbac.matrix.modules}
                </TableHead>
                {Object.keys(rbacMatrix.defaultPermissions).map((role) => {
                  const roleInfo = getRoleInfo(role);
                  return (
                    <TableHead key={role} className="text-center min-w-[200px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          {role === 'superadmin' && <Shield className="h-4 w-4" />}
                          <span className="font-semibold">{rbacStrings.rbac.roles[role]?.name || role}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-normal max-w-[180px]">
                          {rbacStrings.rbac.roles[role]?.description}
                        </span>
                        {role === 'superadmin' && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Full Access
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rbacMatrix.modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium sticky left-0 bg-background p-4 align-top">
                    <div className="flex items-center gap-2">
                      {rbacStrings.rbac.modules[module.id] || module.name}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">
                              Permissions: {module.permissions.join(', ')}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  {Object.keys(rbacMatrix.defaultPermissions).map((role) => (
                    <TableCell key={role} className="text-center p-4 align-top">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-center gap-2 pb-2 border-b">
                          <Checkbox
                            checked={
                              role === 'superadmin' ||
                              module.permissions.every(p => hasPermission(role, module.id, p))
                            }
                            onCheckedChange={() => handleToggleAll(role, module.id)}
                            disabled={role === 'superadmin'}
                          />
                          <span className="text-xs text-muted-foreground">Select All</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {module.permissions.map((perm) => (
                            <div
                              key={perm}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                role === 'superadmin' 
                                  ? 'opacity-60 cursor-not-allowed' 
                                  : 'hover:bg-accent'
                              }`}
                              onClick={() => role !== 'superadmin' && handlePermissionToggle(role, module.id, perm)}
                            >
                              <Checkbox
                                checked={hasPermission(role, module.id, perm)}
                                disabled={role === 'superadmin'}
                                onCheckedChange={() => handlePermissionToggle(role, module.id, perm)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex items-center gap-2">
                                {getPermissionIcon(perm)}
                                <span className="text-sm">
                                  {rbacStrings.rbac.permissions[perm] || perm}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 bg-background border rounded-lg shadow-lg p-4">
          <p className="text-sm font-medium mb-2">
            {rbacStrings.rbac.messages.unsavedChanges}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleReset}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}