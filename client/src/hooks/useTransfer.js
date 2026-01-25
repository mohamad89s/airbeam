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

    return {
        files,
        setFiles,
        sharedText,
        setSharedText,
        transferType,
        setTransferType,
        copied,
        setCopied,
        resetTransfer
    };
};
