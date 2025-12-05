import React from 'react';
import Barcode from 'react-barcode';
import { PrintableLabel } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { PrinterIcon } from './icons/PrinterIcon';

interface BarcodeSheetModalProps {
  labels: PrintableLabel[];
  onClose: () => void;
}

const BarcodeSheetModal: React.FC<BarcodeSheetModalProps> = ({ labels, onClose }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('barcode-sheet-to-print');
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Barcodes</title>');
      printWindow.document.write(`
        <style>
          @page { size: auto; margin: 0.5in; }
          body { font-family: sans-serif; text-transform: uppercase; }
          .sheet-multi { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
          .sheet-single { display: flex; justify-content: center; align-items: flex-start; padding-top: 1rem; }
          .label { 
            border: 1px solid #ccc; 
            padding: 0.5rem; 
            text-align: center; 
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .label-single { width: 80%; max-width: 400px; }
          .desc { font-size: 0.8rem; font-weight: bold; margin: 0 0 0.25rem 0; }
          .barcode-container { width: 100%; margin-bottom: 0.25rem; }
          .barcode-svg { width: 100%; height: auto; }
          .location { font-size: 0.75rem; color: #555; margin-top: 0.25rem; }
          @media print {
            body { margin: 0; }
            .sheet-multi { gap: 0.25rem; }
            .label { border: 1px dashed #999; }
          }
        </style>
      `);
      printWindow.document.write('</head><body onload="window.print();window.close()">');
      const containerClass = labels.length === 1 ? 'sheet-single' : 'sheet-multi';
      printWindow.document.write(`<div class="${containerClass}">`);
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</div>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
    } else {
        alert('Could not open print window. Please check your browser settings.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-container max-w-2xl">
          <div className="modal-header">
              <h2>Barcode Print Preview</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
              </button>
          </div>
          <div className="modal-body max-h-[70vh] overflow-y-auto">
              <div 
                id="barcode-sheet-to-print" 
                className={labels.length === 1 ? "flex justify-center p-4" : "grid grid-cols-2 gap-2"}
              >
                 {labels.map((label, index) => (
                    <div 
                        key={index} 
                        className={`label border p-2 text-center break-inside-avoid flex flex-col items-center ${labels.length === 1 ? 'w-full max-w-sm label-single' : ''}`}
                    >
                        <h3 className="desc text-xs font-bold text-gray-800 mb-1 truncate">{label.description}</h3>
                        <div className="barcode-container w-full">
                           <Barcode value={label.itemId} height={50} width={1.5} fontSize={12} margin={2} renderer="svg" className="barcode-svg" />
                        </div>
                        {label.locationName && (
                            <p className={`location text-xs truncate mt-1 ${label.locationName === 'NO STOCK' ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                                {label.locationName}{label.subLocationDetail && ` - ${label.subLocationDetail}`}
                            </p>
                        )}
                    </div>
                ))}
              </div>
          </div>
          <div className="modal-footer">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handlePrint} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-em-red border border-transparent rounded-md shadow-sm hover:bg-red-700">
                <PrinterIcon className="w-5 h-5 mr-2" />
                Print
              </button>
          </div>
      </div>
    </div>
  );
};

export default BarcodeSheetModal;