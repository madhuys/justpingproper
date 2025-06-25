'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Bot, Users, BookOpen, Megaphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useContent } from '@/hooks/useContent';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'agent' | 'contact' | 'knowledgebase' | 'campaign';
  title: string;
  subtitle?: string;
  href: string;
}

interface GlobalSearchProps {
  className?: string;
  onSearch?: (query: string) => void;
}

const iconMap = {
  agent: Bot,
  contact: Users,
  knowledgebase: BookOpen,
  campaign: Megaphone
};

export function GlobalSearch({ className, onSearch }: GlobalSearchProps) {
  const { content } = useContent('home');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      setLoading(true);
      setSelectedIndex(-1); // Reset selection when results change
      // Simulate search - replace with actual API call
      setTimeout(() => {
        setResults([
          {
            id: '1',
            type: 'agent',
            title: 'Customer Support Agent',
            subtitle: 'Handles customer queries',
            href: '/agents/1'
          },
          {
            id: '2',
            type: 'knowledgebase',
            title: 'Product Documentation',
            subtitle: '150 articles',
            href: '/knowledgebase/2'
          }
        ]);
        setLoading(false);
      }, 300);
    } else {
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={content?.widgets?.globalSearch?.placeholder || 'Search...'}
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (query.length > 2 || results.length > 0) && (
        <div className={cn(
          "absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-md",
          "bg-popover/95 backdrop-blur-md text-popover-foreground",
          "border border-white/20 dark:border-white/10",
          "shadow-xl shadow-black/10 dark:shadow-black/30",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none before:rounded-md",
          "p-2"
        )}>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, index) => {
                const Icon = iconMap[result.type];
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md p-2 text-left",
                      "transition-all duration-200",
                      isSelected ? 
                        "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground" : 
                        "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.length > 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}