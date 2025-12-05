import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { XMarkIcon } from './icons/XMarkIcon';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState('');
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

    useEffect(() => {
        if (isOpen) {
            setError(''); // Reset error on open
            codeReaderRef.current = new BrowserMultiFormatReader();
            const codeReader = codeReaderRef.current;

            if (videoRef.current) {
                codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                    if (result) {
                        onScan(result.getText());
                        onClose(); // Close modal on successful scan
                    }
                    if (err && !(err instanceof NotFoundException)) {
                        // This handles general scanning errors, not setup errors.
                        // We can ignore NotFoundException as it fires continuously when no code is found.
                        console.error("Scanning error:", err);
                    }
                }).catch(err => {
                    console.error("Camera setup error:", err);
                    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        setError("No camera found. Please connect a camera to use the scanner.");
                    } else if (err.name === 'NotAllowedError') {
                        setError("Camera access was denied. Please grant camera permissions in your browser settings.");
                    } else {
                        setError("Could not initialize camera. Please ensure it's not being used by another application.");
                    }
                });
            }

            return () => {
                if(codeReaderRef.current) {
                    codeReaderRef.current.reset();
                    codeReaderRef.current = null;
                }
            };
        }
    }, [isOpen, onScan, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="modal-container max-w-lg w-full">
                <div className="modal-header">
                    <h2>Scan Barcode</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="relative w-full aspect-video bg-gray-900 rounded-md overflow-hidden">
                        <video ref={videoRef} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-3/4 h-1/2 border-4 border-red-500 border-dashed rounded-lg opacity-75"></div>
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                    <p className="text-sm text-gray-500 mt-4 text-center">POSITION THE BARCODE WITHIN THE FRAME TO SCAN.</p>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;