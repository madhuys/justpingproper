'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useContent } from '@/hooks/useContent';

export function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { content } = useContent('navigation');

  const footerContent = content?.footer || {};

  return (
    <footer className="footer-fixed bg-card text-card-foreground transition-all duration-300 ease-in-out shadow-lg m-0 p-0">
      {/* Collapsed view - single line */}
      <div 
        className="w-full px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <p className="text-sm text-muted-foreground">
          {footerContent.bottom?.copyright || '© 2024 JustPing. All rights reserved.'}
        </p>
        <button className="text-muted-foreground hover:text-foreground">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded view with smooth animation */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
        isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="border-t w-full px-6 py-8">
          <div className="max-w-full mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              {/* Company */}
              <div>
                <h3 className="font-semibold text-sm mb-3">
                  {footerContent.company?.title || 'Company'}
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.company?.about || 'About Us'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.company?.careers || 'Careers'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.company?.blog || 'Blog'}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Product */}
              <div>
                <h3 className="font-semibold text-sm mb-3">
                  {footerContent.product?.title || 'Product'}
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.product?.features || 'Features'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.product?.pricing || 'Pricing'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/enterprise" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.product?.enterprise || 'Enterprise'}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="font-semibold text-sm mb-3">
                  {footerContent.resources?.title || 'Resources'}
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.resources?.documentation || 'Documentation'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/api" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.resources?.apiReference || 'API Reference'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.resources?.guides || 'Guides'}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="font-semibold text-sm mb-3">
                  {footerContent.support?.title || 'Support'}
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.support?.helpCenter || 'Help Center'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.support?.contact || 'Contact Us'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/status" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.support?.status || 'System Status'}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="font-semibold text-sm mb-3">
                  {footerContent.legal?.title || 'Legal'}
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.legal?.privacy || 'Privacy Policy'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.legal?.terms || 'Terms of Service'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/security" className="text-sm text-muted-foreground hover:text-foreground">
                      {footerContent.legal?.security || 'Security'}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t text-center">
              <p className="text-sm text-muted-foreground">
                {footerContent.bottom?.madeWith || 'Made with ❤️ in India'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}