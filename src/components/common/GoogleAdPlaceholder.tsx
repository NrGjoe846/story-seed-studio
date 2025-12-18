import React from 'react';
import { cn } from '@/lib/utils';

interface GoogleAdPlaceholderProps {
    className?: string;
    variant?: 'vertical' | 'horizontal';
}

const GoogleAdPlaceholder: React.FC<GoogleAdPlaceholderProps> = ({ className, variant = 'vertical' }) => {
    return (
        <div
            className={cn(
                "bg-muted/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center mx-auto",
                variant === 'vertical' ? "w-full max-w-[300px] lg:w-48 h-64 lg:h-48" : "w-full h-24",
                className
            )}
        >
            <div className="text-center text-muted-foreground text-xs">
                <p>Google Ad</p>
                <p className="text-[10px] mt-1">Responsive</p>
            </div>
        </div>
    );
};

export default GoogleAdPlaceholder;
