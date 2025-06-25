'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/FormField';
import { Loader } from '@/components/atoms/Loader';
import { ArrowLeft, Mail } from 'lucide-react';
import authStrings from '@/data/strings/auth.json';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const strings = authStrings.forgotPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <Card className="container border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle>{strings.emailSentTitle}</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {strings.emailSentSubText}
            </p>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsSubmitted(false)}
            >
              {strings.tryDifferentEmail}
            </Button>
            
            <div className="text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">
                {strings.backToSignIn}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="container border-0">
      <CardHeader className="text-center">
        <CardTitle>{strings.title}</CardTitle>
        <CardDescription>
          {strings.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField 
            label={strings.emailLabel}
            required
          >
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={strings.emailPlaceholder}
              required
              disabled={isLoading}
            />
          </FormField>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader size="sm" />
                {strings.sending}
              </div>
            ) : (
              strings.sendResetLink
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {strings.backToSignIn}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}