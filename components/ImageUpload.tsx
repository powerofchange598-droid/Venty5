import React, { useState, useEffect } from 'react';
import { PhotoIcon, PencilSquareIcon } from '@heroicons/react/24/solid';

interface ImageUploadProps {
    onFileSelect: (file: File | null) => void;
    currentImageUrl?: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect, currentImageUrl }) => {
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);

    useEffect(() => {
        setPreview(currentImageUrl);
    }, [currentImageUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setPreview(typeof reader.result === 'string' ? reader.result : null);
            reader.readAsDataURL(file);
            onFileSelect(file);
        }
    };
    
    return (
        <div className="relative group w-32 h-32 mx-auto">
            <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                <div className="w-full h-full rounded-full ring-4 ring-ui-card dark:ring-ui-card ring-offset-4 ring-offset-ui-background dark:ring-offset-ui-background ring-ui-border/50">
                    {preview ? (
                        <img src={preview} alt="Profile Preview" className="w-full h-full object-cover rounded-full" loading="lazy" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-ui-border flex items-center justify-center">
                            <PhotoIcon className="h-16 w-16 text-ui-tertiary" />
                        </div>
                    )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <PencilSquareIcon className="h-10 w-10 text-white" />
                </div>
            </label>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleFileChange} />
        </div>
    );
};

export default ImageUpload;
