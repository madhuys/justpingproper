import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, FileText } from "lucide-react";
import { SearchResult } from '@/hooks/useKnowledgebase';
import knowledgebaseStrings from '@/data/strings/knowledgebase.json';
import { Loader } from "@/components/atoms/Loader";

interface SearchTesterProps {
  indexId: string;
  onSearch: (indexId: string, query: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
}

export function SearchTester({ indexId, onSearch, searchResults, isSearching }: SearchTesterProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(indexId, query);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={knowledgebaseStrings.search.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
          <Search className="h-4 w-4 mr-2" />
          {knowledgebaseStrings.search.button}
        </Button>
      </div>

      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <Loader />
          <span className="ml-2 text-sm text-muted-foreground">
            {knowledgebaseStrings.search.searching}
          </span>
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">{knowledgebaseStrings.search.results}</h4>
          {searchResults.map((result) => (
            <Card key={result.id} className="p-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <h5 className="font-medium text-sm">{result.title}</h5>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {result.content}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>Score: {(result.score * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isSearching && query && searchResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            {knowledgebaseStrings.search.noResults}
          </p>
        </div>
      )}
    </div>
  );
}