'use client';

import React from 'react';
import { PageHeader } from '@/components/atoms/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/atoms/EmptyState';
import { BookOpen, Plus } from 'lucide-react';

export default function KnowledgebasePage() {
  return (
    <div className="h-full bg-background p-8">
      <div className="container mx-auto max-w-full h-full flex flex-col">
        <PageHeader
          title="Knowledgebase"
          description="Manage your knowledge articles and documentation"
          className="mb-6"
        />
        
        <div className="flex justify-end mb-6">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Article
          </Button>
        </div>
        
        <Card className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={BookOpen}
            title="No articles yet"
            description="Create your first knowledge article to get started"
          />
        </Card>
      </div>
    </div>
  );
}