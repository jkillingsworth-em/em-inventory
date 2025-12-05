import React, { useEffect, useRef, useState } from 'react';

// 1. Inlined Icon: Ensures you don't get "File not found" errors for icons
const XMarkIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className={className}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState('');
    // We use 'any' here because we are loading the library dynamically to avoid build errors
    const codeReaderRef = useRef<any>(null);

    useEffect(() => {
        // If modal is not open, do nothing
        if (!isOpen) return;

        let isMounted = true;
        setError('');

        const initializeScanner = async () => {
            try {
                // 2. Universal Loader: Check if ZXing is already loaded. 
                // If not, inject it from a CDN. This bypasses local build issues.
                if (!(window as any).ZXing) {
                    await new Promise<void>((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js';
                        script.async = true;
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error('Failed to load scanning library'));
                        document.body.appendChild(script);
                    });
                }

                if (!isMounted) return;

                const ZXing = (window as any).ZXing;
                if (!ZXing) {
                    setError("Scanner library failed to initialize.");
                    return;
                }

                // 3. Initialize the reader using the global ZXing object
                const codeReader = new ZXing.BrowserMultiFormatReader();
                codeReaderRef.current = codeReader;

                // 4. Start decoding from camera
                if (videoRef.current) {
                    codeReader.decodeFromVideoDevice(
                        undefined, // undefined = use default user-facing camera
                        videoRef.current,
                        (result: any, err: any) => {
                            if (!isMounted) return;
                            
                            // Success: We found a barcode
                            if (result) {
                                onScan(result.getText());
                                onClose();
                            }
                            
                            // Error Handling:
                            // We ignore "NotFoundException" because it fires on every frame where
                            // a barcode isn't seen (which is most of them).
                            if (err && !(err instanceof ZXing.NotFoundException)) {
                                console.error("Scanning error:", err);
                            }
                        }
                    ).catch((err: any) => {
                        if (!isMounted) return;
                        console.error("Camera setup error:", err);
                        
                        // User-friendly error messages
                        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                            setError("No camera found on this device.");
                        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                            setError("Camera permission denied. Please check settings.");
                        } else {
                            setError("Could not start camera.");
                        }
                    });
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError("Failed to load scanner resources. Check internet connection.");
            }
        };

        initializeScanner();

        // 5. Cleanup: Stop the camera when modal closes or component unmounts
        return () => {
            isMounted = false;
            if (codeReaderRef.current) {
                // This is critical: it turns off the camera light!
                codeReaderRef.current.reset();
                codeReaderRef.current = null;
            }
        };
    }, [isOpen, onScan, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 id="modal-title" className="text-lg font-semibold text-gray-900">Scan Barcode</h2>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close scanner"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 bg-gray-50">
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
                        {/* CRITICAL FIX FOR IOS: 
                            playsInline and muted prevent the video from going full-screen 
                        */}
                        <video 
                            ref={videoRef} 
                            className="w-full h-full object-cover" 
                            playsInline 
                            muted 
                        />
                        
                        {/* Overlay: Visual guide for the user */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-3/4 h-1/2 border-4 border-red-500 border-dashed rounded-lg opacity-75 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 text-sm rounded-md text-center border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Instruction Text */}
                    <p className="text-xs text-gray-500 mt-4 text-center uppercase tracking-wide font-medium">
                        Position the barcode inside the red box
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;