'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/molecules/FormField';
import { PasswordInput } from '@/components/atoms/PasswordInput';
import { Loader } from '@/components/atoms/Loader';
import { CheckCircle } from 'lucide-react';
import authStrings from '@/data/strings/auth.json';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const strings = authStrings.resetPassword;
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = (password: string) => {
    const requirements = [
      { test: password.length >= 8, message: strings.passwordRequirements.minLength },
      { test: /[A-Z]/.test(password), message: strings.passwordRequirements.uppercase },
      { test: /[a-z]/.test(password), message: strings.passwordRequirements.lowercase },
      { test: /\d/.test(password), message: strings.passwordRequirements.number },
      { test: /[!@#$%^&*]/.test(password), message: strings.passwordRequirements.special },
    ];
    
    return requirements;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors: Record<string, string> = {};
    
    if (!token) {
      newErrors.general = 'Invalid reset token';
    }
    
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } catch (error) {
      setErrors({ general: 'Failed to reset password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="container border-0">
        <CardHeader className="text-center">
          <CardTitle>{strings.invalidLinkTitle}</CardTitle>
          <CardDescription>
            {strings.invalidLinkDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Request a new reset link
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="container border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle>{strings.successTitle}</CardTitle>
          <CardDescription>
            {strings.successDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">{strings.signInLink}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const passwordRequirements = validatePassword(formData.password);

  return (
    <Card className="container border-0">
      <CardHeader className="text-center">
        <CardTitle>{strings.createPasswordTitle}</CardTitle>
        <CardDescription>
          {strings.createPasswordDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
              {errors.general}
            </div>
          )}
          
          <FormField
            label={strings.newPasswordLabel}
            required
            error={errors.password}
          >
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={strings.newPasswordPlaceholder}
              required
              className={errors.password ? 'border-red-500' : ''}
            />
            
            {/* Password requirements */}
            {formData.password && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{strings.passwordRequirements.title}</p>
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${req.test ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={req.test ? 'text-green-600' : 'text-muted-foreground'}>
                      {req.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </FormField>
          
          <FormField
            label={strings.confirmPasswordLabel}
            required
            error={errors.confirmPassword}
          >
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={strings.confirmPasswordPlaceholder}
              required
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
          </FormField>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !formData.password || !formData.confirmPassword}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader size="sm" showText={false} className="mr-2" />
                Updating password...
              </div>
            ) : (
              strings.submitButton
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}