'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';
import fileManagementStrings from '@/data/strings/fileManagement.json';

interface DriveConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
    oauthUrl: string;
    scopes: string[];
  };
  isConnected: boolean;
  onConnect: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  onDisconnect: () => Promise<void>;
}

type ModalState = 'idle' | 'authorizing' | 'connected' | 'error';

export function DriveConfigModal({
  isOpen,
  onClose,
  provider,
  isConnected,
  onConnect,
  onDisconnect,
}: DriveConfigModalProps) {
  const [state, setState] = useState<ModalState>(isConnected ? 'connected' : 'idle');
  const [isLoading, setIsLoading] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = async () => {
    setState('authorizing');
    setError(null);
    setIsLoading(true);

    try {
      // Mock OAuth flow
      const authWindow = window.open(
        'about:blank',
        `${provider.id}-oauth`,
        'width=500,height=600,left=200,top=100'
      );

      if (!authWindow) {
        throw new Error('Failed to open authorization window. Please check your popup blocker.');
      }

      // Simulate OAuth page
      authWindow.document.write(`
        <html>
          <head>
            <title>Authorize ${provider.name}</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid ${provider.color};
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="spinner"></div>
              <h2>Authorizing ${provider.name}...</h2>
              <p>Please wait while we connect your account.</p>
            </div>
          </body>
        </html>
      `);

      // Simulate OAuth callback
      await new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            reject(new Error('Authorization window was closed'));
          }
        }, 500);

        const timeout = setTimeout(() => {
          clearInterval(checkInterval);
          authWindow.close();
          
          // 90% success rate
          if (Math.random() > 0.1) {
            resolve({
              accessToken: `mock_access_${provider.id}_${Date.now()}`,
              refreshToken: `mock_refresh_${provider.id}_${Date.now()}`
            });
          } else {
            reject(new Error('Authorization failed. Please try again.'));
          }
        }, 3000);
      }).then(async (tokens: any) => {
        await onConnect(tokens);
        setState('connected');
        toast.success(
          fileManagementStrings.modal.config.messages.success.replace('{{name}}', provider.name)
        );
      }).catch((err) => {
        throw err;
      });
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Authorization failed');
      toast.error(
        fileManagementStrings.modal.config.messages.error.replace('{{name}}', provider.name)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await onDisconnect();
      setState('idle');
      setShowDisconnectDialog(false);
      toast.success(
        fileManagementStrings.modal.config.messages.disconnected.replace('{{name}}', provider.name)
      );
      onClose();
    } catch (err) {
      toast.error('Failed to disconnect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const modalTitle = fileManagementStrings.modal.config.title[isConnected ? 'manage' : 'connect']
    .replace('{{name}}', provider.name);

  const modalDescription = fileManagementStrings.modal.config.description[isConnected ? 'connected' : 'connect']
    .replace('{{name}}', provider.name);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>{modalDescription}</DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {state === 'idle' && !isConnected && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${provider.color}20` }}
                      >
                        <div 
                          className="w-10 h-10 rounded"
                          style={{ backgroundColor: provider.color }}
                        />
                      </div>
                      <h3 className="text-lg font-semibold">{provider.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {provider.description}
                      </p>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">This will allow JustPing to:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>View and download your files</li>
                        <li>Browse your folder structure</li>
                        <li>Generate previews of supported files</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {state === 'authorizing' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <div>
                      <p className="font-medium">
                        {fileManagementStrings.modal.config.messages.authorizing}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Complete the authorization in the popup window
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {state === 'connected' && isConnected && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Connected to {provider.name}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Your account is connected and ready to use
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {state === 'error' && error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            {!isConnected && state !== 'connected' ? (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {fileManagementStrings.modal.config.actions.cancel}
                </Button>
                <Button
                  onClick={handleAuthorize}
                  disabled={isLoading}
                  style={{ backgroundColor: provider.color }}
                  className="text-white hover:opacity-90"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {fileManagementStrings.modal.config.actions.authorize}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {fileManagementStrings.modal.config.actions.close}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDisconnectDialog(true)}
                  disabled={isLoading}
                >
                  {fileManagementStrings.modal.config.actions.disconnect}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {provider.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove access to your {provider.name} files. You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}