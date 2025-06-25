'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField } from '@/components/molecules/FormField';
import { PasswordInput } from '@/components/atoms/PasswordInput';
import { OAuthButton } from '@/components/molecules/OAuthButton';
import { AuthDivider } from '@/components/atoms/AuthDivider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import authStrings from '@/data/strings/auth.json';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const strings = authStrings.signUp;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate terms acceptance
    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(formData.email, formData.password);
    
    if (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setIsLoading(true);
    
    const { error } = await signInWithGoogle();
    
    if (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  return (
    <Card className="container border-0">
      <CardHeader className="space-y-1 p-0 pb-8">
        <CardTitle className="text-3xl font-bold text-center">{strings.title}</CardTitle>
        <CardDescription className="text-center">
          {strings.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}

            <FormField
              label={strings.nameLabel}
              required
            >
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder={strings.namePlaceholder}
                className="h-12"
                required
                disabled={isLoading}
              />
            </FormField>
            
            <FormField
              label={strings.emailLabel}
              required
            >
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={strings.emailPlaceholder}
                className="h-12"
                required
                disabled={isLoading}
              />
            </FormField>
            
            <FormField
              label={strings.passwordLabel}
              required
            >
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={strings.passwordPlaceholder}
                className="h-12"
                required
                disabled={isLoading}
              />
            </FormField>
            
            <FormField
              label={strings.confirmPasswordLabel}
              required
            >
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={strings.confirmPasswordPlaceholder}
                className="h-12"
                required
                disabled={isLoading}
              />
            </FormField>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                disabled={isLoading}
                className="mt-1"
              />
              <Label
                htmlFor="terms"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {strings.termsText}{" "}
                <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                  {strings.termsLink}
                </Link>{" "}
                {strings.andText}{" "}
                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                  {strings.privacyLink}
                </Link>
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading ? strings.signingUp : strings.signUpButton}
            </Button>

            <AuthDivider text={strings.orContinueWith} />

            <OAuthButton
              provider="google"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              loading={isLoading}
            >
              {strings.googleSignUp}
            </OAuthButton>
            
            <div className="text-center text-sm text-muted-foreground">
              {strings.haveAccount}{" "}
              <Link href="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                {strings.signIn}
              </Link>
            </div>
          </form>
      </CardContent>
    </Card>
  );
}