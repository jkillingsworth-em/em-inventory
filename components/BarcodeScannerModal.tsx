import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

// Let TypeScript know that ZXing is available on the window object
declare const ZXing: any;

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Reset state every time the modal opens
        if (isOpen) {
            setError(null);
            setIsLoading(true);
        } else {
            return;
        }

        // Check if the ZXing library is loaded on the window object
        if (typeof ZXing === 'undefined') {
            setError("Scanner library failed to load. Please check your connection and try again.");
            setIsLoading(false);
            return;
        }

        const codeReader = new ZXing.BrowserMultiFormatReader();
        let selectedDeviceId: string | undefined;

        const startScanner = async () => {
            try {
                const videoInputDevices = await codeReader.listVideoInputDevices();
                if (videoInputDevices.length === 0) {
                    setError("No camera found.");
                    setIsLoading(false);
                    return;
                }

                // Prefer the back camera if available
                const rearCamera = videoInputDevices.find(device => device.label.toLowerCase().includes('back')) || videoInputDevices[0];
                selectedDeviceId = rearCamera.deviceId;

                setIsLoading(false);
                
                if (videoRef.current) {
                    // This method is non-blocking and uses a callback
                    codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
                        if (result) {
                            onScan(result.getText());
                        }
                        // Ignore the common NotFoundException, as it fires between frames
                        if (err && !(err instanceof ZXing.NotFoundException)) {
                            console.error('Scan Error:', err);
                            setError('An error occurred during scanning.');
                        }
                    });
                }
            } catch (err: any) {
                console.error("Camera access error:", err);
                if (err.name === 'NotAllowedError') {
                    setError("Camera permission denied. Please allow access in your browser settings.");
                } else {
                    setError("Could not access camera. Please check permissions.");
                }
                setIsLoading(false);
            }
        };
        
        startScanner();

        // Cleanup function to release the camera when the component unmounts or modal closes
        return () => {
            codeReader.reset();
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

                    {(isLoading || error) && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-lg font-bold text-center p-4">
                            {isLoading && 'STARTING CAMERA...'}
                            {error && `ERROR: ${error}`}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;