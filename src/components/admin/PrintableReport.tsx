import { forwardRef } from 'react';
import { format } from 'date-fns';

interface PrintableReportProps {
  title: string;
  subtitle?: string;
  stats?: { label: string; value: string | number }[];
  children: React.ReactNode;
}

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  ({ title, subtitle, stats, children }, ref) => {
    return (
      <div ref={ref} className="print-only p-8 bg-white text-black">
        {/* Header with Logo */}
        <div className="flex items-center justify-between border-b-2 border-orange-500 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">॥</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-orange-600">श्री प्रखर पारोपकार मिशन ट्रस्ट</h1>
              <p className="text-sm text-gray-600">Sri Prakhar Paropkar Mission Trust</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Report Generated:</p>
            <p className="font-medium">{format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>

        {/* Summary Stats */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{stat.value}</p>
                <p className="text-xs text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="print-content">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated document. No signature is required.</p>
          <p className="mt-1">© {new Date().getFullYear()} Sri Prakhar Paropkar Mission Trust. All rights reserved.</p>
        </div>
      </div>
    );
  }
);

PrintableReport.displayName = 'PrintableReport';

// Utility function to print the report
export function printReport(printRef: React.RefObject<HTMLDivElement>) {
  if (!printRef.current) return;

  const printContents = printRef.current.innerHTML;
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups for printing');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
            color: black;
            padding: 20px;
          }
          .print-only { display: block !important; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f3f4f6; font-weight: 600; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .badge { 
            display: inline-block; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 10px; 
            font-weight: 500;
          }
          .badge-pending { background: #fef3c7; color: #92400e; }
          .badge-confirmed { background: #d1fae5; color: #065f46; }
          .badge-completed { background: #dbeafe; color: #1e40af; }
          .badge-cancelled { background: #fee2e2; color: #991b1b; }
          .badge-received { background: #d1fae5; color: #065f46; }
          .badge-pledged { background: #fef3c7; color: #92400e; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .text-right { text-align: right; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${printContents}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
