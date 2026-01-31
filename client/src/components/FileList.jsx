import React, { useState, useEffect } from 'react';
import { X, File as FileIcon, Edit2, Check } from 'lucide-react';
import { formatBytes } from '../utils/helpers';

const FileItem = ({ file, index, onRemove, onRename }) => {
    const [isEditing, setIsEditing] = useState(false);

    // Split name and extension
    const lastDotIndex = file.name.lastIndexOf('.');
    const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
    const extension = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '';

    const [newName, setNewName] = useState(baseName);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreview(null);
        }
    }, [file]);

    const handleRename = () => {
        const fullNewName = newName.trim() + extension;
        if (newName.trim() && fullNewName !== file.name) {
            onRename(index, fullNewName);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleRename();
        if (e.key === 'Escape') {
            setNewName(baseName);
            setIsEditing(false);
        }
    };

    return (
        <div className="file-item">
            <div className="file-preview">
                {preview ? (
                    <img src={preview} alt={file.name} className="file-thumb" />
                ) : (
                    <FileIcon size={24} className="text-muted" />
                )}
            </div>
            <div className="file-info">
                {isEditing ? (
                    <div className="file-rename-input">
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="input-cleanup"
                        />
                    </div>
                ) : (
                    <div className="file-name" title={file.name} onDoubleClick={() => setIsEditing(true)}>
                        {file.name}
                    </div>
                )}
                <div className="file-meta">
                    {formatBytes(file.size)}
                </div>
            </div>
            <div className="file-actions">
                <button className="icon-btn-small" onClick={() => setIsEditing(!isEditing)} title={isEditing ? "Save" : "Rename"}>
                    {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                </button>
                <button className="icon-btn-small danger" onClick={() => onRemove(index)} title="Remove">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

const FileList = ({ files, onRemove, onRename }) => {
    if (!files || files.length === 0) return null;

    return (
        <div className="file-list">
            {files.map((file, index) => (
                <FileItem
                    key={`${file.name}-${index}`}
                    file={file}
                    index={index}
                    onRemove={onRemove}
                    onRename={onRename}
                />
            ))}
        </div>
    );
};

export default FileList;
