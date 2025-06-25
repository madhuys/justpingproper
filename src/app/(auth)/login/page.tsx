"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/molecules/FormField";
import { PasswordInput } from "@/components/atoms/PasswordInput";
import { OAuthButton } from "@/components/molecules/OAuthButton";
import { AuthDivider } from "@/components/atoms/AuthDivider";
import { AuthForm } from "@/components/organisms/AuthForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuthForm } from "@/hooks/useAuthForm";
import authStrings from "@/data/strings/auth.json";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { isLoading, error, handleEmailAuth, handleGoogleAuth } = useAuthForm({ mode: 'signin' });
  const strings = authStrings.signIn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleEmailAuth(email, password);
  };

  return (
    <AuthForm
      title={strings.title}
      subtitle={strings.subtitle}
      error={error}
    >
      <form onSubmit={handleSubmit} className="space-y-6">

                <FormField
                  label={strings.emailLabel}
                  required
                >
                  <Input
                    id="email"
                    type="email"
                    placeholder={strings.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    placeholder={strings.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                    required
                    disabled={isLoading}
                  />
                </FormField>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      {strings.rememberMe}
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                  >
                    {strings.forgotPassword}
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  {isLoading ? strings.signingIn : strings.signInButton}
                </Button>

                <AuthDivider text={strings.orContinueWith} />

                <OAuthButton
                  provider="google"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  loading={isLoading}
                >
                  {strings.googleSignIn}
                </OAuthButton>

                <div className="text-center text-sm text-muted-foreground">
                  {strings.noAccount}{" "}
                  <Link href="/register" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                    {strings.signUp}
                  </Link>
                </div>
      </form>
    </AuthForm>
  );
}