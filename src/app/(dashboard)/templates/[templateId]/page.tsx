'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import TemplateBuilder from '@/components/organisms/TemplateBuilder';

export default function EditTemplatePage() {
  const params = useParams();
  const templateId = params.templateId as string;
  
  return <TemplateBuilder templateId={templateId} />;
}