'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Phone, 
  Link, 
  Reply, 
  Image as ImageIcon,
  Video,
  FileText,
  MoreVertical,
  Check,
  CheckCheck,
  ArrowLeft,
  Camera,
  Paperclip,
  Expand,
  X,
  Minus,
  Square,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIntegrationIcon } from '@/lib/integrations/utils';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface TemplatePreviewProps {
  provider: string;
  header?: { type: 'text' | 'media'; value: string };
  body: string;
  footer?: string;
  buttons?: any[];
  variables: Record<string, string>;
  device: 'mobile' | 'desktop';
}

export default function TemplatePreview({
  provider,
  header,
  body,
  footer,
  buttons = [],
  variables,
  device
}: TemplatePreviewProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const replaceVariables = (text: string) => {
    let result = text;
    Object.keys(variables).forEach(key => {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), variables[key] || key);
    });
    return result;
  };

  const renderWhatsApp = () => {
    if (device === 'mobile') {
      return (
        <div className="flex items-center justify-center p-4">
          {/* iPhone Frame */}
          <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] p-2 shadow-2xl">
            {/* Notch */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-full z-30"></div>
            
            {/* Screen */}
            <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
              {/* WhatsApp UI */}
              <div className={cn(
                "h-full flex flex-col",
                isDark ? "bg-[#0B141A]" : "bg-[#F7F8FA]"
              )}>
                {/* WhatsApp Header */}
                <div className={cn(
                  "px-4 pt-14 pb-3",
                  isDark ? "bg-[#1F2C33]" : "bg-[#008069]"
                )}>
                  <div className="flex items-center gap-3">
                    <ArrowLeft className="h-6 w-6 text-white" />
                    <div className="w-10 h-10 bg-gray-400 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">Business Name</p>
                      <p className="text-white/70 text-xs">online</p>
                    </div>
                    <Camera className="h-6 w-6 text-white" />
                    <MoreVertical className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Chat Area */}
                <div className={cn(
                  "flex-1 overflow-y-auto",
                  isDark ? "bg-[#0B141A]" : "bg-[#E5DDD5]"
                )} 
                style={{
                  backgroundImage: isDark 
                    ? 'url("data:image/svg+xml,%3Csvg width="80" height="80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23040404" fill-opacity="0.3"%3E%3Cpath d="M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z" /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                    : 'url("data:image/svg+xml,%3Csvg width="80" height="80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23dcded6" fill-opacity="0.3"%3E%3Cpath d="M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z" /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                }}
                >
                  <div className="p-4">
                    {/* Message */}
                    <div className="flex justify-start mb-2">
                      <div className={cn(
                        "rounded-lg rounded-tl-none max-w-[85%] shadow-sm",
                        isDark ? "bg-[#005C4B]" : "bg-[#DCF8C6]"
                      )}>
                        {header && (
                          <div className={cn(
                            "border-b",
                            isDark ? "border-[#128C7E]/30" : "border-gray-300/50"
                          )}>
                            {header.type === 'text' ? (
                              <div className="p-3">
                                <p className={cn(
                                  "font-semibold",
                                  isDark ? "text-white" : "text-gray-900"
                                )}>
                                  {replaceVariables(header.value)}
                                </p>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className={cn(
                                  "h-48 rounded-t-lg flex items-center justify-center",
                                  isDark ? "bg-gray-800" : "bg-gray-200"
                                )}>
                                  {header.value.includes('image') && <ImageIcon className="h-12 w-12 text-gray-400" />}
                                  {header.value.includes('video') && <Video className="h-12 w-12 text-gray-400" />}
                                  {header.value.includes('document') && <FileText className="h-12 w-12 text-gray-400" />}
                                  {!header.value.includes('image') && !header.value.includes('video') && !header.value.includes('document') && 
                                    <MessageSquare className="h-12 w-12 text-gray-400" />
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="p-3">
                          <p className={cn(
                            "whitespace-pre-wrap text-sm",
                            isDark ? "text-gray-100" : "text-gray-900"
                          )}>
                            {replaceVariables(body)}
                          </p>
                          
                          {footer && (
                            <p className={cn(
                              "text-xs mt-2",
                              isDark ? "text-gray-400" : "text-gray-600"
                            )}>
                              {replaceVariables(footer)}
                            </p>
                          )}
                        </div>

                        {buttons.length > 0 && (
                          <div className={cn(
                            "p-2 border-t space-y-1",
                            isDark ? "border-[#128C7E]/30" : "border-gray-300/50"
                          )}>
                            {buttons.map((button, index) => (
                              <button
                                key={index}
                                className={cn(
                                  "w-full py-2 px-3 rounded border transition-colors flex items-center justify-center gap-2 text-sm",
                                  isDark 
                                    ? "border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10" 
                                    : "border-[#128C7E] text-[#128C7E] hover:bg-[#128C7E]/10"
                                )}
                              >
                                {button.type === 'phone' && <Phone className="h-3.5 w-3.5" />}
                                {button.type === 'url' && <Link className="h-3.5 w-3.5" />}
                                {button.type === 'quickReply' && <Reply className="h-3.5 w-3.5" />}
                                {button.text}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Message Time */}
                        <div className="flex items-center justify-end gap-1 px-3 pb-1">
                          <span className={cn(
                            "text-xs",
                            isDark ? "text-gray-500" : "text-gray-600"
                          )}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className={cn(
                  "px-4 py-3 flex items-center gap-2",
                  isDark ? "bg-[#1F2C33]" : "bg-[#F0F0F0]"
                )}>
                  <Paperclip className={cn(
                    "h-6 w-6",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )} />
                  <div className={cn(
                    "flex-1 px-4 py-2 rounded-full text-sm",
                    isDark ? "bg-[#2A3942] text-gray-400" : "bg-white text-gray-500"
                  )}>
                    Type a message
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isDark ? "bg-[#00A884]" : "bg-[#128C7E]"
                  )}>
                    <svg viewBox="0 0 24 24" width="24" height="24" className="text-white">
                      <path fill="currentColor" d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Desktop view
    return (
      <div className="flex items-center justify-center p-4">
        {/* Browser Frame */}
        <div className={cn(
          "w-full max-w-[1200px] rounded-lg shadow-2xl overflow-hidden",
          isDark ? "bg-gray-900" : "bg-gray-100"
        )}>
          {/* Browser Header */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-3",
            isDark ? "bg-gray-800" : "bg-gray-200"
          )}>
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 cursor-pointer"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 cursor-pointer"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 cursor-pointer"></div>
            </div>
            
            {/* URL Bar */}
            <div className={cn(
              "flex-1 mx-4 px-4 py-1.5 rounded text-sm",
              isDark ? "bg-gray-700 text-gray-300" : "bg-white text-gray-600"
            )}>
              <span className="text-green-600 mr-1">🔒</span>
              web.whatsapp.com
            </div>
            
            {/* Browser Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsModalOpen(true)}
              >
                <Expand className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Browser Content */}
          <div className={cn(
            "p-8",
            isDark ? "bg-[#0B141A]" : "bg-[#E5DDD5]"
          )}>
            <div className="max-w-[600px] mx-auto">
              <div className="flex justify-start mb-2">
                <div className={cn(
                  "rounded-lg rounded-tl-none max-w-[85%] shadow-sm",
                  isDark ? "bg-[#005C4B]" : "bg-[#DCF8C6]"
                )}>
              {header && (
                <div className={cn(
                  "border-b",
                  isDark ? "border-[#128C7E]/30" : "border-gray-300/50"
                )}>
                  {header.type === 'text' ? (
                    <div className="p-3">
                      <p className={cn(
                        "font-semibold",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {replaceVariables(header.value)}
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className={cn(
                        "h-48 rounded-t-lg flex items-center justify-center",
                        isDark ? "bg-gray-800" : "bg-gray-200"
                      )}>
                        {header.value.includes('image') && <ImageIcon className="h-12 w-12 text-gray-400" />}
                        {header.value.includes('video') && <Video className="h-12 w-12 text-gray-400" />}
                        {header.value.includes('document') && <FileText className="h-12 w-12 text-gray-400" />}
                        {!header.value.includes('image') && !header.value.includes('video') && !header.value.includes('document') && 
                          <MessageSquare className="h-12 w-12 text-gray-400" />
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-3">
                <p className={cn(
                  "whitespace-pre-wrap text-sm",
                  isDark ? "text-gray-100" : "text-gray-900"
                )}>
                  {replaceVariables(body)}
                </p>
                
                {footer && (
                  <p className={cn(
                    "text-xs mt-2",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )}>
                    {replaceVariables(footer)}
                  </p>
                )}
              </div>

              {buttons.length > 0 && (
                <div className={cn(
                  "p-2 border-t space-y-1",
                  isDark ? "border-[#128C7E]/30" : "border-gray-300/50"
                )}>
                  {buttons.map((button, index) => (
                    <button
                      key={index}
                      className={cn(
                        "w-full py-2 px-3 rounded border transition-colors flex items-center justify-center gap-2 text-sm",
                        isDark 
                          ? "border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10" 
                          : "border-[#128C7E] text-[#128C7E] hover:bg-[#128C7E]/10"
                      )}
                    >
                      {button.type === 'phone' && <Phone className="h-3.5 w-3.5" />}
                      {button.type === 'url' && <Link className="h-3.5 w-3.5" />}
                      {button.type === 'quickReply' && <Reply className="h-3.5 w-3.5" />}
                      {button.text}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-1 px-3 pb-1">
                <span className={cn(
                  "text-xs",
                  isDark ? "text-gray-500" : "text-gray-600"
                )}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInstagram = () => {
    if (device === 'mobile') {
      return (
        <div className="flex items-center justify-center p-4">
          {/* iPhone Frame */}
          <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] p-2 shadow-2xl">
            {/* Notch */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-full z-30"></div>
            
            {/* Screen */}
            <div className="relative w-full h-full bg-white dark:bg-black rounded-[2.5rem] overflow-hidden">
              {/* Instagram UI */}
              <div className={cn(
                "h-full flex flex-col",
                isDark ? "bg-black" : "bg-white"
              )}>
                {/* Header */}
                <div className={cn(
                  "flex items-center justify-between px-4 pt-14 pb-3 border-b",
                  isDark ? "border-gray-800" : "border-gray-200"
                )}>
                  <ArrowLeft className={cn(
                    "h-6 w-6",
                    isDark ? "text-white" : "text-black"
                  )} />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-full"></div>
                    <div>
                      <p className={cn(
                        "font-semibold text-sm",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        Business Name
                      </p>
                      <p className={cn(
                        "text-xs",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        Active now
                      </p>
                    </div>
                  </div>
                  <MoreVertical className={cn(
                    "h-5 w-5",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )} />
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-4">
                  <div className="flex justify-start">
                    <div className={cn(
                      "rounded-2xl rounded-tl-sm max-w-[85%] p-4",
                      isDark ? "bg-gray-800" : "bg-gray-100"
                    )}>
                      <p className={cn(
                        "text-sm whitespace-pre-wrap",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {replaceVariables(body)}
                      </p>
                      
                      {buttons.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {buttons.map((button, index) => (
                            <button
                              key={index}
                              className="w-full py-2.5 px-4 bg-[#0095F6] text-white rounded-lg hover:bg-[#0084DB] transition-colors text-sm font-medium"
                            >
                              {button.text}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <p className={cn(
                        "text-xs mt-2",
                        isDark ? "text-gray-500" : "text-gray-400"
                      )}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className={cn(
                  "flex items-center gap-2 px-4 py-3 border-t",
                  isDark ? "border-gray-800" : "border-gray-200"
                )}>
                  <div className={cn(
                    "flex-1 px-4 py-2 rounded-full text-sm",
                    isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                  )}>
                    Message...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Desktop view with browser frame
    return (
      <div className="flex items-center justify-center p-4">
        {/* Browser Frame */}
        <div className={cn(
          "w-full max-w-[1200px] rounded-lg shadow-2xl overflow-hidden",
          isDark ? "bg-gray-900" : "bg-gray-100"
        )}>
          {/* Browser Header */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-3",
            isDark ? "bg-gray-800" : "bg-gray-200"
          )}>
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 cursor-pointer"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 cursor-pointer"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 cursor-pointer"></div>
            </div>
            
            {/* URL Bar */}
            <div className={cn(
              "flex-1 mx-4 px-4 py-1.5 rounded text-sm",
              isDark ? "bg-gray-700 text-gray-300" : "bg-white text-gray-600"
            )}>
              <span className="text-green-600 mr-1">🔒</span>
              instagram.com/direct/inbox
            </div>
            
            {/* Browser Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsModalOpen(true)}
              >
                <Expand className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Browser Content */}
          <div className={cn(
            "p-8",
            isDark ? "bg-black" : "bg-gray-50"
          )}>
            <div className="max-w-[600px] mx-auto">
              <div className={cn(
                "rounded-2xl shadow-sm p-6",
                isDark ? "bg-gray-800" : "bg-white"
              )}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-full"></div>
                  <div>
                    <p className={cn(
                      "font-semibold",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Business Name
                    </p>
                    <p className={cn(
                      "text-xs",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}>
                      Active now
                    </p>
                  </div>
                </div>
                
                <div className={cn(
                  "rounded-2xl rounded-tl-sm p-4",
                  isDark ? "bg-gray-700" : "bg-gray-100"
                )}>
                  <p className={cn(
                    "text-sm whitespace-pre-wrap",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {replaceVariables(body)}
                  </p>
                  
                  {buttons.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {buttons.map((button, index) => (
                        <button
                          key={index}
                          className="w-full py-2.5 px-4 bg-[#0095F6] text-white rounded-lg hover:bg-[#0084DB] transition-colors text-sm font-medium"
                        >
                          {button.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTelegram = () => {
    if (device === 'mobile') {
      return (
        <div className="flex items-center justify-center p-4">
          {/* iPhone Frame */}
          <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] p-2 shadow-2xl">
            {/* Notch */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-full z-30"></div>
            
            {/* Screen */}
            <div className="relative w-full h-full bg-[#17212B] rounded-[2.5rem] overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-14 pb-3 bg-[#17212B]">
                  <div className="flex items-center gap-3">
                    <ArrowLeft className="h-6 w-6 text-white" />
                    <div className="w-10 h-10 bg-[#54A3DB] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">B</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Business Name</p>
                      <p className="text-[#5E7C8E] text-sm">online</p>
                    </div>
                  </div>
                  <MoreVertical className="text-[#5E7C8E] h-5 w-5" />
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-4 bg-[#0E1621]">
                  <div className="flex justify-start">
                    <div className="bg-[#182533] rounded-lg rounded-tl-sm max-w-[85%] overflow-hidden">
                      {header?.type === 'media' && (
                        <div className="bg-[#0E1621] h-48 flex items-center justify-center">
                          <MessageSquare className="h-12 w-12 text-gray-600" />
                        </div>
                      )}
                      
                      <div className="p-3">
                        <p className="text-white text-sm whitespace-pre-wrap">
                          {replaceVariables(body)}
                        </p>
                        
                        {buttons.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {buttons.map((button, index) => (
                              <button
                                key={index}
                                className="py-2 px-3 bg-[#54A3DB] text-white rounded hover:bg-[#4A96CF] transition-colors text-sm font-medium"
                              >
                                {button.text}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-end gap-1 mt-2">
                          <span className="text-[#5E7C8E] text-xs">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex items-center gap-2 p-4 bg-[#17212B]">
                  <div className="flex-1 px-4 py-2 bg-[#0E1621] rounded-full text-[#5E7C8E] text-sm">
                    Write a message...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Desktop view with browser frame
    return (
      <div className="flex items-center justify-center p-4">
        {/* Browser Frame */}
        <div className={cn(
          "w-full max-w-[1200px] rounded-lg shadow-2xl overflow-hidden",
          isDark ? "bg-gray-900" : "bg-gray-100"
        )}>
          {/* Browser Header */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-3",
            isDark ? "bg-gray-800" : "bg-gray-200"
          )}>
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 cursor-pointer"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 cursor-pointer"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 cursor-pointer"></div>
            </div>
            
            {/* URL Bar */}
            <div className={cn(
              "flex-1 mx-4 px-4 py-1.5 rounded text-sm",
              isDark ? "bg-gray-700 text-gray-300" : "bg-white text-gray-600"
            )}>
              <span className="text-blue-500 mr-1">🔒</span>
              web.telegram.org
            </div>
            
            {/* Browser Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsModalOpen(true)}
              >
                <Expand className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Browser Content */}
          <div className="bg-[#17212B] p-8">
            <div className="rounded-[2rem] shadow-xl overflow-hidden bg-[#0E1621] max-w-[600px] mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-[#17212B]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#54A3DB] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">B</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Business Name</p>
                    <p className="text-[#5E7C8E] text-sm">online</p>
                  </div>
                </div>
                <MoreVertical className="text-[#5E7C8E] h-5 w-5" />
              </div>

              {/* Chat Area */}
              <div className="p-4 min-h-[300px] bg-[#0E1621]">
                <div className="flex justify-start">
                  <div className="bg-[#182533] rounded-lg rounded-tl-sm max-w-[85%] overflow-hidden">
                    {header?.type === 'media' && (
                      <div className="bg-[#0E1621] h-48 flex items-center justify-center">
                        <MessageSquare className="h-12 w-12 text-gray-600" />
                      </div>
                    )}
                    
                    <div className="p-3">
                      <p className="text-white text-sm whitespace-pre-wrap">
                        {replaceVariables(body)}
                      </p>
                      
                      {buttons.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {buttons.map((button, index) => (
                            <button
                              key={index}
                              className="py-2 px-3 bg-[#54A3DB] text-white rounded hover:bg-[#4A96CF] transition-colors text-sm font-medium"
                            >
                              {button.text}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <span className="text-[#5E7C8E] text-xs">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="flex items-center gap-2 p-4 bg-[#17212B]">
                <div className="flex-1 px-4 py-2 bg-[#0E1621] rounded-full text-[#5E7C8E] text-sm">
                  Write a message...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMessenger = () => {
    if (device === 'mobile') {
      return (
        <div className="flex items-center justify-center p-4">
          {/* iPhone Frame */}
          <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] p-2 shadow-2xl">
            {/* Notch */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-full z-30"></div>
            
            {/* Screen */}
            <div className={cn(
              "relative w-full h-full rounded-[2.5rem] overflow-hidden",
              isDark ? "bg-black" : "bg-white"
            )}>
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className={cn(
                  "flex items-center justify-between px-4 pt-14 pb-3 border-b",
                  isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
                )}>
                  <ArrowLeft className={cn(
                    "h-6 w-6",
                    isDark ? "text-white" : "text-black"
                  )} />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0084FF] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">B</span>
                    </div>
                    <div>
                      <p className={cn(
                        "font-semibold",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        Business Name
                      </p>
                      <p className={cn(
                        "text-xs",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        Active now
                      </p>
                    </div>
                  </div>
                  <MoreVertical className={cn(
                    "h-5 w-5",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )} />
                </div>

                {/* Chat Area */}
                <div className={cn(
                  "flex-1 p-4",
                  isDark ? "bg-black" : "bg-white"
                )}>
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      {header?.type === 'media' && (
                        <div className={cn(
                          "h-48 rounded-2xl mb-2 flex items-center justify-center",
                          isDark ? "bg-gray-800" : "bg-gray-200"
                        )}>
                          <MessageSquare className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      <div className={cn(
                        "rounded-2xl rounded-tl-sm p-4",
                        isDark ? "bg-gray-800" : "bg-[#F0F0F0]"
                      )}>
                        <p className={cn(
                          "text-sm whitespace-pre-wrap",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          {replaceVariables(body)}
                        </p>
                        
                        {buttons.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {buttons.map((button, index) => (
                              <button
                                key={index}
                                className="w-full py-2.5 px-4 bg-[#0084FF] text-white rounded-full hover:bg-[#0073E6] transition-colors text-sm font-medium"
                              >
                                {button.text}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <p className={cn(
                        "text-xs mt-1 ml-2",
                        isDark ? "text-gray-500" : "text-gray-400"
                      )}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className={cn(
                  "flex items-center gap-2 p-4 border-t",
                  isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
                )}>
                  <div className={cn(
                    "flex-1 px-4 py-2 rounded-full text-sm",
                    isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                  )}>
                    Type a message...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Desktop view with browser frame
    return (
      <div className="flex items-center justify-center p-4">
        {/* Browser Frame */}
        <div className={cn(
          "w-full max-w-[1200px] rounded-lg shadow-2xl overflow-hidden",
          isDark ? "bg-gray-900" : "bg-gray-100"
        )}>
          {/* Browser Header */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-3",
            isDark ? "bg-gray-800" : "bg-gray-200"
          )}>
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 cursor-pointer"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 cursor-pointer"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 cursor-pointer"></div>
            </div>
            
            {/* URL Bar */}
            <div className={cn(
              "flex-1 mx-4 px-4 py-1.5 rounded text-sm",
              isDark ? "bg-gray-700 text-gray-300" : "bg-white text-gray-600"
            )}>
              <span className="text-blue-500 mr-1">🔒</span>
              www.messenger.com
            </div>
            
            {/* Browser Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsModalOpen(true)}
              >
                <Expand className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Browser Content */}
          <div className={cn(
            "p-8",
            isDark ? "bg-gray-900" : "bg-gray-50"
          )}>
            <div className={cn(
              "rounded-[2rem] shadow-xl overflow-hidden max-w-[600px] mx-auto",
              isDark ? "bg-black" : "bg-white"
            )}>
              {/* Header */}
              <div className={cn(
                "flex items-center justify-between p-4 border-b",
                isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0084FF] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">B</span>
                  </div>
                  <div>
                    <p className={cn(
                      "font-semibold",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Business Name
                    </p>
                    <p className={cn(
                      "text-xs",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}>
                      Active now
                    </p>
                  </div>
                </div>
                <MoreVertical className={cn(
                  "h-5 w-5",
                  isDark ? "text-gray-400" : "text-gray-600"
                )} />
              </div>

              {/* Chat Area */}
              <div className={cn(
                "p-4 min-h-[300px]",
                isDark ? "bg-black" : "bg-white"
              )}>
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    {header?.type === 'media' && (
                      <div className={cn(
                        "h-48 rounded-2xl mb-2 flex items-center justify-center",
                        isDark ? "bg-gray-800" : "bg-gray-200"
                      )}>
                        <MessageSquare className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "rounded-2xl rounded-tl-sm p-4",
                      isDark ? "bg-gray-800" : "bg-[#F0F0F0]"
                    )}>
                      <p className={cn(
                        "text-sm whitespace-pre-wrap",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {replaceVariables(body)}
                      </p>
                      
                      {buttons.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {buttons.map((button, index) => (
                            <button
                              key={index}
                              className="w-full py-2.5 px-4 bg-[#0084FF] text-white rounded-full hover:bg-[#0073E6] transition-colors text-sm font-medium"
                            >
                              {button.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <p className={cn(
                      "text-xs mt-1 ml-2",
                      isDark ? "text-gray-500" : "text-gray-400"
                    )}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className={cn(
                "flex items-center gap-2 p-4 border-t",
                isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
              )}>
                <div className={cn(
                  "flex-1 px-4 py-2 rounded-full text-sm",
                  isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                )}>
                  Type a message...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLinkedIn = () => {
    if (device === 'mobile') {
      return (
        <div className="flex items-center justify-center p-4">
          {/* iPhone Frame */}
          <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] p-2 shadow-2xl">
            {/* Notch */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-full z-30"></div>
            
            {/* Screen */}
            <div className={cn(
              "relative w-full h-full rounded-[2.5rem] overflow-hidden",
              isDark ? "bg-gray-900" : "bg-gray-50"
            )}>
              <div className="h-full flex flex-col">
                {/* LinkedIn Mobile Header */}
                <div className={cn(
                  "px-4 pt-14 pb-3 border-b",
                  isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                )}>
                  <div className="flex items-center justify-between">
                    <ArrowLeft className={cn(
                      "h-6 w-6",
                      isDark ? "text-white" : "text-gray-600"
                    )} />
                    <p className={cn(
                      "font-semibold",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Messages
                    </p>
                    <MoreVertical className={cn(
                      "h-5 w-5",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )} />
                  </div>
                </div>
                
                {/* Chat Content */}
                <div className={cn(
                  "flex-1 p-4",
                  isDark ? "bg-gray-900" : "bg-gray-50"
                )}>
                  <div className={cn(
                    "rounded-lg shadow-sm overflow-hidden",
                    isDark ? "bg-gray-800" : "bg-white"
                  )}>
                    {/* Sender Info */}
                    <div className={cn(
                      "p-4 border-b",
                      isDark ? "border-gray-700" : "border-gray-200"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#0A66C2] rounded flex items-center justify-center">
                          <span className="text-white font-bold text-lg">B</span>
                        </div>
                        <div>
                          <p className={cn(
                            "font-semibold",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
                            Business Name
                          </p>
                          <p className={cn(
                            "text-xs",
                            isDark ? "text-gray-400" : "text-gray-500"
                          )}>
                            Sponsored InMail
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="p-4">
                      <p className={cn(
                        "whitespace-pre-wrap text-sm",
                        isDark ? "text-gray-100" : "text-gray-900"
                      )}>
                        {replaceVariables(body)}
                      </p>
                      
                      <div className="mt-4">
                        <Badge variant="secondary" className="text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Desktop view
    return (
      <div className="flex items-center justify-center p-4">
        {/* Browser Frame */}
        <div className={cn(
          "w-full max-w-[1200px] rounded-lg shadow-2xl overflow-hidden",
          isDark ? "bg-gray-900" : "bg-gray-100"
        )}>
          {/* Browser Header */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-3",
            isDark ? "bg-gray-800" : "bg-gray-200"
          )}>
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 cursor-pointer"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 cursor-pointer"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 cursor-pointer"></div>
            </div>
            
            {/* URL Bar */}
            <div className={cn(
              "flex-1 mx-4 px-4 py-1.5 rounded text-sm",
              isDark ? "bg-gray-700 text-gray-300" : "bg-white text-gray-600"
            )}>
              <span className="text-blue-500 mr-1">🔒</span>
              www.linkedin.com/messaging
            </div>
            
            {/* Browser Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsModalOpen(true)}
              >
                <Expand className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Browser Content */}
          <div className={cn(
            "p-8",
            isDark ? "bg-gray-900" : "bg-gray-50"
          )}>
            <div className={cn(
              "rounded-lg shadow-xl overflow-hidden max-w-[600px] mx-auto",
              isDark ? "bg-gray-800" : "bg-white"
            )}>
              {/* Header */}
              <div className={cn(
                "p-4 border-b",
                isDark ? "border-gray-700" : "border-gray-200"
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0A66C2] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-lg">B</span>
                  </div>
                  <div>
                    <p className={cn(
                      "font-semibold",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Business Name
                    </p>
                    <p className={cn(
                      "text-xs",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}>
                      Sponsored InMail
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className={cn(
                  "whitespace-pre-wrap",
                  isDark ? "text-gray-100" : "text-gray-900"
                )}>
                  {replaceVariables(body)}
                </p>
                
                <div className="mt-4">
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    switch (provider) {
      case 'whatsapp':
        return renderWhatsApp();
      case 'instagram':
        return renderInstagram();
      case 'telegram':
        return renderTelegram();
      case 'messenger':
        return renderMessenger();
      case 'linkedin':
        return renderLinkedIn();
      default:
        return (
          <div className={cn(
            "p-8 rounded-xl text-center",
            isDark ? "bg-gray-900" : "bg-gray-100"
          )}>
            <MessageSquare className={cn(
              "h-12 w-12 mx-auto mb-4",
              isDark ? "text-gray-600" : "text-gray-400"
            )} />
            <p className={cn(
              isDark ? "text-gray-400" : "text-gray-500"
            )}>
              Select a provider to see preview
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <div className={cn(
        "transition-all duration-200",
        device === 'desktop' && 'scale-90'
      )}>
        {renderPreview()}
      </div>
      
      {/* Pop-out Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="!max-w-[1280px] w-full h-[90vh] p-0 overflow-hidden" showCloseButton={false}>
          <VisuallyHidden>
            <DialogTitle>Template Preview</DialogTitle>
          </VisuallyHidden>
          <DialogHeader className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsModalOpen(false)}
              className="bg-white/10 backdrop-blur hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <div className="w-full h-full overflow-auto">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}