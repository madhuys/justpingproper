'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/molecules/FormField';
import { Combobox } from '@/components/ui/combobox';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import countries from '@/data/countries.json';
import industries from '@/data/industries.json';
import companySizes from '@/data/companySizes.json';
import businessProfileStrings from '@/data/strings/businessProfile.json';

interface BusinessProfileFieldsProps {
  data: {
    legalBusinessName: string;
    companyEmail: string;
    website: string;
    registeredAddress: string;
    gstNumber: string;
    adminPhoneNumber: string;
    countryOfOperation: string;
    industry: string;
    companySize: string;
    aboutCompany: string;
  };
  isEditing: boolean;
  onUpdate: (field: string, value: any) => void;
}

export function BusinessProfileFields({ 
  data, 
  isEditing, 
  onUpdate 
}: BusinessProfileFieldsProps) {
  const strings = businessProfileStrings;
  
  const countryOptions = countries.map(country => ({
    value: country.code,
    label: country.name
  }));

  const industryOptions = industries.map(industry => ({
    value: industry.id,
    label: industry.name
  }));

  const companySizeOptions = companySizes.map(size => ({
    value: size.value,
    label: size.label
  }));

  const renderField = (
    fieldName: keyof typeof data,
    label: string,
    tooltip: string,
    required = false,
    type: 'text' | 'email' | 'url' | 'textarea' | 'combobox' = 'text',
    options?: { value: string; label: string }[],
    placeholder?: string
  ) => (
    <FormField 
      label={
        <div className="flex items-center gap-2">
          {label}
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      }
      required={required}
    >
      {isEditing ? (
        type === 'textarea' ? (
          <Textarea
            value={data[fieldName]}
            onChange={(e) => onUpdate(fieldName, e.target.value)}
            className="w-full"
            rows={type === 'textarea' ? 3 : 1}
            placeholder={placeholder}
          />
        ) : type === 'combobox' && options ? (
          <Combobox
            options={options}
            value={data[fieldName]}
            onChange={(value) => onUpdate(fieldName, value)}
            placeholder={placeholder || strings.placeholders.selectOption}
            searchPlaceholder={strings.placeholders.searchOptions}
            emptyText={strings.placeholders.noOptionFound}
            className="w-full"
          />
        ) : (
          <Input
            type={type}
            value={data[fieldName]}
            onChange={(e) => onUpdate(fieldName, e.target.value)}
            className="w-full"
            placeholder={placeholder}
          />
        )
      ) : (
        <p className={`py-2 text-foreground ${fieldName === 'registeredAddress' || fieldName === 'aboutCompany' ? 'whitespace-pre-wrap' : ''}`}>
          {type === 'combobox' && fieldName === 'countryOfOperation' 
            ? countries.find(c => c.code === data[fieldName])?.name || '-'
            : type === 'combobox' && fieldName === 'industry'
            ? industries.find(i => i.id === data[fieldName])?.name || '-'
            : type === 'combobox' && fieldName === 'companySize'
            ? companySizes.find(s => s.value === data[fieldName])?.label || '-'
            : data[fieldName] || '-'}
        </p>
      )}
    </FormField>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {renderField('legalBusinessName', strings.fields.legalBusinessName, strings.tooltips.legalBusinessName, true)}
        {renderField('companyEmail', strings.fields.companyEmail, strings.tooltips.companyEmail, true, 'email')}
        {renderField('website', strings.fields.website, strings.tooltips.website, true, 'url')}
        {renderField('registeredAddress', strings.fields.registeredAddress, strings.tooltips.registeredAddress, true, 'textarea')}
        {renderField('gstNumber', strings.fields.gstNumber, strings.tooltips.gstNumber, true)}
        {renderField('adminPhoneNumber', strings.fields.adminPhoneNumber, strings.tooltips.adminPhoneNumber, true, 'text', undefined, strings.placeholders.phoneNumber)}
        {renderField('countryOfOperation', strings.fields.countryOfOperation, strings.tooltips.countryOfOperation, true, 'combobox', countryOptions, strings.placeholders.selectCountry)}
        {renderField('industry', strings.fields.industry, strings.tooltips.industry, true, 'combobox', industryOptions, strings.placeholders.selectIndustry)}
        {renderField('companySize', strings.fields.companySize, strings.tooltips.companySize, true, 'combobox', companySizeOptions, strings.placeholders.selectCompanySize)}
        {renderField('aboutCompany', strings.fields.aboutCompany, strings.tooltips.aboutCompany, false, 'textarea')}
      </div>
    </TooltipProvider>
  );
}