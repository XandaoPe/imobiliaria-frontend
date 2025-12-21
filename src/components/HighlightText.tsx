import React from 'react';

const HighlightText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    if (!text) return null;
    if (!highlight.trim()) return <>{text}</>;

    const safeHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeHighlight})`, 'gi');
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} style={{ backgroundColor: '#ffeb3b', color: '#000', padding: '0 2px', borderRadius: '2px' }}>
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    );
};

export default HighlightText;