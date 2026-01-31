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
                // Try to infer new type from extension
                const extension = newName.split('.').pop().toLowerCase();
                let newType = file.type;

                const mimeMap = {
                    'png': 'image/png',
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'gif': 'image/gif',
                    'pdf': 'application/pdf',
                    'txt': 'text/plain',
                    'mp4': 'video/mp4',
                    'zip': 'application/zip'
                };

                if (mimeMap[extension]) {
                    newType = mimeMap[extension];
                }

                return new File([file], newName, {
                    type: newType,
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
