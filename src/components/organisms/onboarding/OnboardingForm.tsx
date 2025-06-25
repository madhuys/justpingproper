'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronLeft, 
  ChevronRight, 
  ShoppingCart, 
  Headphones, 
  TrendingUp, 
  Users, 
  Users2, 
  BookOpen, 
  BarChart3, 
  GitBranch, 
  GraduationCap, 
  MessageSquare 
} from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/molecules/FormField';
import { StepHeader } from '@/components/molecules/StepHeader';
import { cn } from '@/lib/utils';

// Import data
import rolesData from '@/data/roles.json';
import industriesData from '@/data/industries.json';
import countriesData from '@/data/countries.json';
import companySizesData from '@/data/companySizes.json';
import useCasesData from '@/data/useCases.json';
import onboardingContent from '@/data/strings/onboarding.json';

interface OnboardingFormData {
  // Step 1: Personal Info
  personalInfo: {
    fullName: string;
    email: string;
    country: string;
    role: string;
  };
  
  // Step 2: Use Cases
  useCases: string[];
  
  // Step 3: Company Info
  companyInfo: {
    companyName: string;
    website: string;
    companySize: string;
    industry: string;
    country: string;
  };
}

interface OnboardingFormProps {
  onComplete?: () => void;
}

// Transform data for comboboxes
const ROLES = rolesData.map(role => ({
  value: role.value,
  label: role.name
}));

const INDUSTRIES = industriesData.map(industry => ({
  value: industry.name,
  label: industry.name
}));

const COUNTRIES = countriesData.map(country => ({
  value: country.name,
  label: country.name
}));

const COMPANY_SIZES = companySizesData.map(size => ({
  value: size.value,
  label: size.label
}));

// Icon mapping
const iconMap: Record<string, any> = {
  ShoppingCart,
  Headphones,
  TrendingUp,
  Users,
  Users2,
  BookOpen,
  BarChart3,
  GitBranch,
  GraduationCap,
  MessageSquare
};

const USE_CASES = useCasesData.map(useCase => ({
  value: useCase.value,
  label: useCase.label,
  icon: iconMap[useCase.icon] || MessageSquare
}));

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    personalInfo: {
      fullName: '',
      email: '',
      country: '',
      role: ''
    },
    useCases: [],
    companyInfo: {
      companyName: '',
      website: '',
      companySize: '',
      industry: '',
      country: ''
    }
  });

  const totalSteps = 3;

  useEffect(() => {
    setMounted(true);
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const response = await fetch('/api/states/onboarding');
      if (response.ok) {
        const data = await response.json();
        if (data.personalInfo || data.companyInfo || data.useCases) {
          setFormData(prev => ({
            personalInfo: {
              ...prev.personalInfo,
              ...(data.personalInfo || {})
            },
            useCases: data.useCases || prev.useCases,
            companyInfo: {
              ...prev.companyInfo,
              ...(data.companyInfo || {})
            }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    }
  };

  const saveOnboardingData = async () => {
    try {
      // Save user profile data
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.personalInfo.fullName,
          email: formData.personalInfo.email,
          country: formData.personalInfo.country,
          role: formData.personalInfo.role,
          updatedAt: new Date().toISOString()
        })
      });

      // Save business profile data
      await fetch('/api/business-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            legalBusinessName: formData.companyInfo.companyName,
            companyEmail: formData.personalInfo.email, // Using personal email for now
            website: formData.companyInfo.website,
            countryOfOperation: formData.companyInfo.country,
            industry: formData.companyInfo.industry,
            aboutCompany: `${formData.companyInfo.companyName} - ${formData.companyInfo.companySize} employees`,
            // Preserve other fields
            registeredAddress: '',
            gstNumber: '',
            adminPhoneNumber: '',
            logo: null,
            additionalImages: [],
            documents: []
          },
          isEditing: false,
          lastUpdated: new Date().toISOString()
        })
      });

      // Still save onboarding progress for backward compatibility
      await fetch('/api/states/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          currentStep: currentStep,
          updatedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
    }
  };

  const updateFormData = (section: keyof OnboardingFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
    
    // Clear error for this field
    if (errors[`${section}.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${field}`];
        return newErrors;
      });
    }
  };

  const toggleUseCase = (useCase: string) => {
    setFormData(prev => {
      const current = prev.useCases;
      const isSelected = current.includes(useCase);
      
      if (isSelected) {
        return { ...prev, useCases: current.filter(uc => uc !== useCase) };
      } else {
        return { ...prev, useCases: [...current, useCase] };
      }
    });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Personal Info
        if (!formData.personalInfo.fullName.trim()) newErrors['personalInfo.fullName'] = 'Full name is required';
        if (!formData.personalInfo.email.trim()) newErrors['personalInfo.email'] = 'Email is required';
        if (!formData.personalInfo.country) newErrors['personalInfo.country'] = 'Country is required';
        if (!formData.personalInfo.role) newErrors['personalInfo.role'] = 'Role is required';
        break;
        
      case 2: // Use Cases
        if (formData.useCases.length === 0) newErrors['useCases'] = 'Please select at least one use case';
        break;
        
      case 3: // Company Info
        if (!formData.companyInfo.companyName.trim()) newErrors['companyInfo.companyName'] = 'Company name is required';
        if (!formData.companyInfo.companySize) newErrors['companyInfo.companySize'] = 'Company size is required';
        if (!formData.companyInfo.country) newErrors['companyInfo.country'] = 'Country is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      await saveOnboardingData();
      
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Complete onboarding
        setIsLoading(true);
        await saveOnboardingData();
        
        // Update onboarding status
        await fetch('/api/states/onboarding', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            settings: {
              showWelcomeScreen: true,
              defaultScreen: 'home',
              onboardingComplete: true
            }
          })
        });
        
        setIsLoading(false);
        
        if (onComplete) {
          onComplete();
        } else {
          // Force navigation to home page
          window.location.href = '/home';
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const logoSrc = mounted 
    ? (theme === 'dark' ? '/logos/logo-dark.png' : '/logos/logo-light.png')
    : '/logos/logo-light.png';

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: // Personal Info
        return (
          <div className="space-y-6">
            <FormField 
              label={onboardingContent.personalInfoStep.fullNameLabel}
              error={errors['personalInfo.fullName']}
              required
            >
              <Input
                value={formData.personalInfo.fullName}
                onChange={(e) => updateFormData('personalInfo', 'fullName', e.target.value)}
                placeholder={onboardingContent.personalInfoStep.fullNamePlaceholder}
              />
            </FormField>

            <FormField 
              label={onboardingContent.personalInfoStep.emailLabel}
              error={errors['personalInfo.email']}
              required
            >
              <Input
                type="email"
                value={formData.personalInfo.email}
                onChange={(e) => updateFormData('personalInfo', 'email', e.target.value)}
                placeholder={onboardingContent.personalInfoStep.emailPlaceholder}
              />
            </FormField>

            <FormField 
              label={onboardingContent.personalInfoStep.countryLabel}
              error={errors['personalInfo.country']}
              required
            >
              <Combobox
                options={COUNTRIES}
                value={formData.personalInfo.country}
                onChange={(value) => updateFormData('personalInfo', 'country', value)}
                placeholder={onboardingContent.personalInfoStep.countryPlaceholder}
                searchPlaceholder="Search countries..."
                emptyText="No country found."
                className="w-full"
              />
            </FormField>

            <FormField 
              label={onboardingContent.personalInfoStep.roleLabel}
              error={errors['personalInfo.role']}
              required
            >
              <Select
                value={formData.personalInfo.role}
                onValueChange={(value) => updateFormData('personalInfo', 'role', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={onboardingContent.personalInfoStep.rolePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        );
        
      case 2: // Use Cases
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">{onboardingContent.useCaseStep.useCaseLabel}</p>
              </div>
              {errors['useCases'] && (
                <p className="text-sm text-destructive">{errors['useCases']}</p>
              )}
              <div className="grid gap-3">
                {USE_CASES.map(useCase => {
                  const Icon = useCase.icon;
                  return (
                    <div 
                      key={useCase.value} 
                      className={cn(
                        "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                        formData.useCases.includes(useCase.value) 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-border hover:bg-muted/50 hover:shadow-sm"
                      )}
                      onClick={() => toggleUseCase(useCase.value)}
                    >
                      <Checkbox 
                        checked={formData.useCases.includes(useCase.value)}
                        onCheckedChange={() => toggleUseCase(useCase.value)}
                      />
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <label className="text-sm font-medium cursor-pointer flex-1">
                        {useCase.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
        
      case 3: // Company Info
        return (
          <div className="space-y-6">
            <FormField 
              label={onboardingContent.companyInfoStep.companyNameLabel}
              error={errors['companyInfo.companyName']}
              required
            >
              <Input
                value={formData.companyInfo.companyName}
                onChange={(e) => updateFormData('companyInfo', 'companyName', e.target.value)}
                placeholder={onboardingContent.companyInfoStep.companyNamePlaceholder}
              />
            </FormField>

            <FormField 
              label={onboardingContent.companyInfoStep.websiteLabel}
              description={onboardingContent.companyInfoStep.websiteOptional}
            >
              <Input
                type="url"
                value={formData.companyInfo.website || ''}
                onChange={(e) => updateFormData('companyInfo', 'website', e.target.value)}
                placeholder={onboardingContent.companyInfoStep.websitePlaceholder}
              />
            </FormField>

            <FormField 
              label={onboardingContent.companyInfoStep.companySizeLabel}
              error={errors['companyInfo.companySize']}
              required
            >
              <Select
                value={formData.companyInfo.companySize}
                onValueChange={(value) => updateFormData('companyInfo', 'companySize', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={onboardingContent.companyInfoStep.companySizePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map(size => (
                    <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField 
              label={onboardingContent.companyInfoStep.industryLabel}
              description={onboardingContent.companyInfoStep.industryOptional}
            >
              <Combobox
                options={INDUSTRIES}
                value={formData.companyInfo.industry || ''}
                onChange={(value) => updateFormData('companyInfo', 'industry', value)}
                placeholder={onboardingContent.companyInfoStep.industryPlaceholder}
                searchPlaceholder="Search industries..."
                emptyText="No industry found."
                className="w-full"
              />
            </FormField>

            <FormField 
              label={onboardingContent.companyInfoStep.companyCountryLabel}
              error={errors['companyInfo.country']}
              required
            >
              <Combobox
                options={COUNTRIES}
                value={formData.companyInfo.country}
                onChange={(value) => updateFormData('companyInfo', 'country', value)}
                placeholder={onboardingContent.companyInfoStep.companyCountryPlaceholder}
                searchPlaceholder="Search countries..."
                emptyText="No country found."
                className="w-full"
              />
            </FormField>
          </div>
        );
        
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return onboardingContent.personalInfoStep.title;
      case 2: return onboardingContent.useCaseStep.title;
      case 3: return onboardingContent.companyInfoStep.title;
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return onboardingContent.personalInfoStep.description;
      case 2: return onboardingContent.useCaseStep.description;
      case 3: return onboardingContent.companyInfoStep.description;
      default: return '';
    }
  };

  const getButtonText = () => {
    if (currentStep === totalSteps) {
      return isLoading ? 'Setting up...' : onboardingContent.companyInfoStep.completeButton;
    }
    return currentStep === 1 
      ? onboardingContent.personalInfoStep.nextButton 
      : onboardingContent.useCaseStep.nextButton;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="w-full">
        <CardHeader className="text-center space-y-6 p-8 pb-6">
          {/* Logo */}
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
            <CardTitle className="text-2xl font-bold">{getStepTitle()}</CardTitle>
            <CardDescription className="mt-2">{getStepSubtitle()}</CardDescription>
          </div>
          <StepHeader 
            currentStep={currentStep} 
            totalSteps={totalSteps}
          />
        </CardHeader>

        <CardContent className="p-8 pt-6">
          {renderCurrentStep()}

          <div className="flex justify-between pt-8 gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="w-32"
            >
              <ChevronLeft className="h-4 w-4 -ml-1" />
              {currentStep > 1 ? onboardingContent.useCaseStep.backButton : 'Back'}
            </Button>

            <Button 
              onClick={handleNext} 
              className="w-32"
              disabled={isLoading}
            >
              {getButtonText()}
              {currentStep < totalSteps && <ChevronRight className="h-4 w-4 -mr-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}