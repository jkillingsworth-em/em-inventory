import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

// Let TypeScript know that ZXing is available on the window object
declare const ZXing: any;

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
}

const ZXING_URL = 'https://unpkg.com/@zxing/library@latest/umd/zxing.min.js';
let zxingPromise: Promise<void> | null = null;

const loadScannerScript = (): Promise<void> => {
    if (zxingPromise) {
        return zxingPromise;
    }

    zxingPromise = new Promise((resolve, reject) => {
        if (typeof ZXing !== 'undefined') {
            return resolve();
        }

        const script = document.createElement('script');
        script.src = ZXING_URL;
        script.async = true;
        
        script.onload = () => {
            if (typeof ZXing !== 'undefined') {
                resolve();
            } else {
                document.body.removeChild(script);
                zxingPromise = null;
                reject(new Error("ZXing library loaded but is not available on window."));
            }
        };
        
        script.onerror = (error) => {
            document.body.removeChild(script);
            zxingPromise = null;
            reject(error);
        };

        document.body.appendChild(script);
    });

    return zxingPromise;
};


const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<any>(null);
    const [statusMessage, setStatusMessage] = useState('INITIALIZING SCANNER...');

    useEffect(() => {
        const cleanup = () => {
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
                codeReaderRef.current = null;
            }
        };

        if (!isOpen) {
            cleanup();
            return;
        }

        let isCancelled = false;
        
        const startScanner = async () => {
            try {
                setStatusMessage('LOADING SCANNER LIBRARY...');
                await loadScannerScript();
                
                if (isCancelled) return;
                
                setStatusMessage('INITIALIZING SCANNER...');
                const codeReader = new ZXing.BrowserMultiFormatReader();
                codeReaderRef.current = codeReader;

                const videoInputDevices = await codeReader.listVideoInputDevices();
                if (isCancelled) return;

                if (videoInputDevices.length === 0) {
                    throw new Error("No camera found on this device.");
                }

                const rearCamera = videoInputDevices.find((device: any) => device.label.toLowerCase().includes('back')) || videoInputDevices[0];
                const selectedDeviceId = rearCamera.deviceId;
                
                if (videoRef.current && !isCancelled) {
                    setStatusMessage('');
                    codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result: any, err: any) => {
                        if (result) {
                            onScan(result.getText());
                        }
                        if (err && !(err instanceof ZXing.NotFoundException)) {
                            // This error is frequent and normal, just means no barcode was found in the frame.
                            // We don't want to log it unless for deep debugging.
                        }
                    });
                }
            } catch (err) {
                if (isCancelled) return;
                
                console.error("Scanner setup error:", err);
                
                // --- Robust Error Handling ---
                let friendlyMessage = "AN UNKNOWN SCANNER ERROR OCCURRED.";
                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        friendlyMessage = "ERROR: CAMERA PERMISSION DENIED. PLEASE ALLOW ACCESS IN YOUR BROWSER SETTINGS.";
                    } else if (err.message.includes("No camera found")) {
                         friendlyMessage = "ERROR: NO CAMERA FOUND ON THIS DEVICE.";
                    } else if (err.message.includes("ZXing")) {
                        friendlyMessage = "ERROR: SCANNER LIBRARY FAILED TO LOAD. PLEASE CHECK YOUR CONNECTION AND TRY AGAIN.";
                    } else {
                        friendlyMessage = `ERROR: ${err.message}`;
                    }
                } else if (typeof err === 'string') {
                    friendlyMessage = err;
                }
                
                setStatusMessage(friendlyMessage);
            }
        };
        
        startScanner();

        return () => {
            isCancelled = true;
            cleanup();
        };
    }, [isOpen, onScan]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="relative bg-em-dark-blue rounded-lg shadow-xl w-full max-w-lg p-2" onClick={e => e.stopPropagation()}>
                <button type="button" onClick={onClose} className="absolute top-2 right-2 text-gray-300 hover:text-white z-10 p-2 bg-black bg-opacity-25 rounded-full">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <div className="relative w-full overflow-hidden rounded-md" style={{ paddingTop: '75%' /* 4:3 Aspect Ratio */ }}>
                    <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover" />
                    
                    {/* Scanner Overlay */}
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                        <div className="w-3/4 h-1/2 border-4 border-red-500 border-dashed rounded-lg opacity-75"></div>
                    </div>

                    {statusMessage && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-lg font-bold text-center p-4">
                           <div className="border-2 border-dashed border-red-500 p-6 rounded-lg">
                                {statusMessage}
                           </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;