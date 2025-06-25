'use client';

import React from 'react';

interface OfficeViewerProps {
  url: string;
  type: string;
}

export function OfficeViewer({ url, type }: OfficeViewerProps) {
  // In a real implementation, we would use Microsoft Office Online Viewer
  // For now, we'll use an iframe with a mock URL
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  
  return (
    <div className="h-full w-full bg-white">
      {/* Mock Office document preview */}
      <div className="h-full flex flex-col">
        <div className="bg-gray-100 border-b px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Preview powered by Microsoft Office Online
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-8 overflow-auto">
          {type.includes('word') && (
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold mb-4">Sample Word Document</h1>
              <p className="mb-4">This is a preview of your Word document.</p>
              <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <h2 className="text-2xl font-bold mb-3 mt-6">Section 1</h2>
              <p className="mb-4">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            </div>
          )}
          
          {type.includes('spreadsheet') && (
            <div className="overflow-auto">
              <table className="border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2">A</th>
                    <th className="border border-gray-300 px-4 py-2">B</th>
                    <th className="border border-gray-300 px-4 py-2">C</th>
                    <th className="border border-gray-300 px-4 py-2">D</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Item</td>
                    <td className="border border-gray-300 px-4 py-2">Quantity</td>
                    <td className="border border-gray-300 px-4 py-2">Price</td>
                    <td className="border border-gray-300 px-4 py-2">Total</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Product A</td>
                    <td className="border border-gray-300 px-4 py-2">10</td>
                    <td className="border border-gray-300 px-4 py-2">$25.00</td>
                    <td className="border border-gray-300 px-4 py-2">$250.00</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Product B</td>
                    <td className="border border-gray-300 px-4 py-2">5</td>
                    <td className="border border-gray-300 px-4 py-2">$50.00</td>
                    <td className="border border-gray-300 px-4 py-2">$250.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          
          {type.includes('presentation') && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-lg p-16 mb-8" style={{ aspectRatio: '16/9' }}>
                <h1 className="text-4xl font-bold mb-4 text-center">Sample Presentation</h1>
                <p className="text-xl text-center text-gray-600">Slide 1 of 5</p>
              </div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i === 1 ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}