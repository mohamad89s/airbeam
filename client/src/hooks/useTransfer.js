import { useState } from 'react';

export const useTransfer = () => {
    const [files, setFiles] = useState([]);
    const [sharedText, setSharedText] = useState('');
    const [transferType, setTransferType] = useState('file'); // file, text
    const [copied, setCopied] = useState(false);

    const resetTransfer = () => {
        setFiles([]);
        setSharedText('');
        setCopied(false);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const renameFile = (index, newName) => {
        setFiles(prev => prev.map((file, i) => {
            if (i === index) {
                return new File([file.slice(0, file.size, file.type)], newName, {
                    type: file.type,
                    lastModified: file.lastModified
                });
            }
            return file;
        }));
    };

    return {
        files,
        setFiles,
        removeFile,
        renameFile,
        sharedText,
        setSharedText,
        transferType,
        setTransferType,
        copied,
        setCopied,
        resetTransfer
    };
};
