import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Play, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import personas from '@/data/personas.json';

interface PersonaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona: (persona: any) => void;
  currentPersonaId?: string;
}

export function PersonaSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectPersona,
  currentPersonaId 
}: PersonaSelectionModalProps) {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(currentPersonaId || null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [showIntroduction, setShowIntroduction] = useState(false);

  const handlePersonaSelect = (persona: any) => {
    setSelectedPersona(persona.id);
    setPlayingVideo(persona.id);
    setShowIntroduction(true);
  };

  const handleConfirm = () => {
    const persona = personas.personas.find(p => p.id === selectedPersona);
    if (persona) {
      onSelectPersona(persona);
      onClose();
    }
  };

  const selectedPersonaData = personas.personas.find(p => p.id === selectedPersona);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose Agent Persona</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {!showIntroduction ? (
            <div className="space-y-4 p-1">
              {personas.personas.map(persona => (
                <Card
                  key={persona.id}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md overflow-hidden",
                    selectedPersona === persona.id && "ring-2 ring-primary"
                  )}
                  onClick={() => handlePersonaSelect(persona)}
                >
                  <div className="flex gap-2 p-2">
                    {/* Square video container with 1:1 aspect ratio */}
                    <div className="relative w-48 h-48 flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg overflow-hidden">
                      {persona.video ? (
                        <video
                          src={persona.video}
                          className="w-full h-full object-cover py-0"
                          muted
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-16 w-16 text-primary/50" />
                        </div>
                      )}
                      {selectedPersona === persona.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-12 w-12 text-primary" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info section with no text cropping */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-lg">{persona.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{persona.role}</p>
                      <p className="text-sm">{persona.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary">{persona.tone}</Badge>
                        {persona.traits?.map(trait => (
                          <Badge key={trait} variant="outline" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {selectedPersonaData && (
                <>
                  {/* Large video preview with 1:1 square aspect ratio */}
                  <div className="relative w-full aspect-square max-w-md mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg overflow-hidden">
                    {selectedPersonaData.video ? (
                      <video
                        src={selectedPersonaData.video}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        onEnded={() => setPlayingVideo(null)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-24 w-24 text-primary/50" />
                      </div>
                    )}
                    {playingVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Play className="h-16 w-16 text-white/80 animate-pulse" />
                      </div>
                    )}
                  </div>
                  
                  {/* Persona details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">{selectedPersonaData.name}</h3>
                      <p className="text-muted-foreground">{selectedPersonaData.role}</p>
                    </div>
                    
                    {selectedPersonaData.selfIntroduction && (
                      <Card className="p-4 bg-muted/50">
                        <p className="text-sm italic">"{selectedPersonaData.selfIntroduction}"</p>
                      </Card>
                    )}
                    
                    <div className="flex gap-2 flex-wrap">
                      <Badge>{selectedPersonaData.tone} tone</Badge>
                      {selectedPersonaData.traits?.map(trait => (
                        <Badge key={trait} variant="outline">{trait}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-between pt-4 border-t">
          {showIntroduction ? (
            <>
              <Button variant="outline" onClick={() => setShowIntroduction(false)}>
                Back to Selection
              </Button>
              <Button onClick={handleConfirm}>
                Confirm Selection
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => setShowIntroduction(true)}
                disabled={!selectedPersona}
              >
                View Introduction
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}