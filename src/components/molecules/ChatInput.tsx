'use client';

import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Mic, X, Image as ImageIcon, FileText, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useContent } from '@/hooks/useContent';
import { cn } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from 'next-themes';

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  onSendAudio?: (audioBlob: Blob) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  onSendAudio,
  placeholder,
  disabled = false 
}: ChatInputProps) {
  const { content } = useContent('home');
  const { resolvedTheme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && attachments.length === 0) return;
    
    onSendMessage(inputValue, attachments);
    setInputValue('');
    setAttachments([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: any) => {
    setInputValue(prev => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      setIsRecording(false);
      setAudioTime(0);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          onSendAudio?.(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setAudioTime(0);
        
        // Start timer
        timerRef.current = setInterval(() => {
          setAudioTime(prev => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-3 w-3" />;
    }
    return <FileText className="h-3 w-3" />;
  };

  return (
    <div className="border-t bg-transparent">
      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 py-2 bg-destructive/10 border-b">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm text-destructive">Recording... {formatTime(audioTime)}</span>
          </div>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-b">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <Badge key={index} variant="secondary" className="pr-1 flex items-center gap-1">
                {getFileIcon(file)}
                <span className="text-xs max-w-[150px] truncate">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="ml-1 p-0.5 hover:bg-destructive/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex items-end gap-2">
            {!isRecording && (
              <div className="flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={placeholder || content?.help?.startChat || 'Type a message...'}
                  disabled={disabled || isRecording}
                  className="pr-10"
                />
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {!isRecording && (
                <>
                  {/* Attachment */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="h-8 w-8"
                    title="Attach files"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  {/* Emoji */}
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        className="h-8 w-8"
                        title="Add emoji"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end" side="top">
                      <EmojiPicker
                        onEmojiClick={handleEmojiSelect}
                        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                        height={350}
                        width={300}
                      />
                    </PopoverContent>
                  </Popover>
                </>
              )}
              
              {/* Audio */}
              {onSendAudio && (
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "ghost"}
                  size="icon"
                  onClick={toggleRecording}
                  disabled={disabled}
                  className="h-8 w-8"
                  title={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isRecording ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Send button */}
          {!isRecording && (
            <Button 
              type="submit" 
              size="icon"
              disabled={disabled || (!inputValue.trim() && attachments.length === 0)}
              className="h-8 w-8"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
}