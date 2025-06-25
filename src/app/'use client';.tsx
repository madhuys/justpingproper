'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { useContent } from '@/hooks/useContent';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Loader } from '@/components/atoms/Loader';
import { Combobox } from '@/components/ui/combobox';
import departmentsData from '@/data/departments.json';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
export default function AdminDetailsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { content, loading: contentLoading } = useContent('onboarding');
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    jobTitle: '',
    department: ''
  });

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const response = await fetch('/api/onboarding/state');
        const data = await response.json();
        if (data.adminDetails) {
          setFormData(data.adminDetails);
        }
      } catch (error) {
        console.error('Failed to fetch onboarding state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const adminDetails = content?.adminDetails || {};

  const DEPARTMENTS = departmentsData.map(dep => ({
    value: dep.name,
    label: dep.name
  }));

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'back'>('forward');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/onboarding/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminDetails: formData, currentStep: '/welcome' }),
      });
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
    
    // Add morphing transition with overlay to prevent flash
    setTransitionDirection('forward');
    setIsTransitioning(true);
    
    // Add transition overlay
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay active';
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      router.push('/welcome');
    }, 250); // Slightly shorter to account for overlay
  };

  const handleBack = async () => {
    // Save current form data before navigating back
    try {
      await fetch('/api/onboarding/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminDetails: formData, currentStep: '/onboarding/company-details' }),
      });
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
    
    setTransitionDirection('back');
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/onboarding/company-details');
    }, 300); // Sync with morph-out animation duration
  };

  if (isLoading || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center melt-in">
        <Loader />
      </div>
    );
  }

  // Use a fallback logo until mounted to prevent hydration mismatch
  const logoSrc = mounted 
    ? (theme === 'dark' ? '/logos/logo-dark.png' : '/logos/logo-light.png')
    : '/logos/logo-light.png';

  return (
    <Card className={cn(
      "w-full max-w-2xl mx-auto",
      contentLoading ? "opacity-0" : isTransitioning ? "melt-out" : "melt-in"
    )}>
      <CardHeader className="text-center space-y-6">
        {/* Logo inside the card */}
        <div className="flex justify-center">
          <div className="relative w-20 h-16">
            <Image
              src={logoSrc}
              alt="JustPing"
              fill
              className="object-contain"
            />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">
            {adminDetails.title || 'Admin Details'}
          </CardTitle>
          <CardDescription className="mt-2">
            {adminDetails.subtitle || 'Tell us about yourself'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">
              {adminDetails.firstName?.label || 'First Name *'}
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder={adminDetails.firstName?.placeholder || 'Enter your first name'}
              required
              className="w-full"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">
              {adminDetails.lastName?.label || 'Last Name *'}
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder={adminDetails.lastName?.placeholder || 'Enter your last name'}
              required
              className="w-full"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              {adminDetails.email?.label || 'Email Address *'}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={adminDetails.email?.placeholder || 'Enter your email address'}
              required
              className="w-full"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              {adminDetails.phoneNumber?.label || 'Phone Number *'}
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder={adminDetails.phoneNumber?.placeholder || '+1 (555) 123-4567'}
              required
              className="w-full"
            />
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle">
              {adminDetails.jobTitle?.label || 'Job Title *'}
            </Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder={adminDetails.jobTitle?.placeholder || 'Enter your job title'}
              required
              className="w-full"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">
              {adminDetails.department?.label || 'Department'}
            </Label>
            <Combobox
              options={DEPARTMENTS}
              value={formData.department}
              onChange={(value) => setFormData({ ...formData, department: value })}
              placeholder={adminDetails.department?.placeholder || 'Select department'}
              searchPlaceholder="Search departments..."
              emptyText="No department found."
              className="w-full"
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
              className="w-32"
            >
              <ChevronLeft className="h-4 w-4 -ml-1" />
              {adminDetails.buttons?.back || 'Back'}
            </Button>
            <Button 
              type="submit" 
              className="w-32"
            >
              {adminDetails.buttons?.continue || 'Continue'}
              <ChevronRight className="h-4 w-4 -mr-1" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}