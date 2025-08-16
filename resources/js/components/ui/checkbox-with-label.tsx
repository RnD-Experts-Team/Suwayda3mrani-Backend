import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CheckboxWithLabelProps {
    id: string;
    label: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    labelClassName?: string;
    checkboxClassName?: string;
    description?: string;
    padding?: 'sm' | 'md' | 'lg';
}

const CheckboxWithLabel = React.forwardRef<
    React.ElementRef<typeof Checkbox>,
    CheckboxWithLabelProps
>(({
       id,
       label,
       checked,
       onCheckedChange,
       disabled = false,
       className,
       labelClassName,
       checkboxClassName,
       description,
       padding = 'md',
       ...props
   }, ref) => {
    const paddingClasses = {
        sm: 'p-2',
        md: 'p-3',
        lg: 'p-4'
    };

    return (
        <div className={cn(
            'flex items-start gap-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors',
            paddingClasses[padding],
            disabled && 'opacity-50 cursor-not-allowed',
            checked && 'border-blue-200 bg-blue-50',
            className
        )}>
            <Checkbox
                ref={ref}
                id={id}
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                className={cn('mt-0.5 flex-shrink-0', checkboxClassName)}
                {...props}
            />

            <div className="flex-1 space-y-1">
                <Label
                    htmlFor={id}
                    className={cn(
                        'text-sm font-medium cursor-pointer select-none',
                        disabled && 'cursor-not-allowed',
                        labelClassName
                    )}
                >
                    {label}
                </Label>

                {description && (
                    <p className="text-xs text-gray-500 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
});

CheckboxWithLabel.displayName = 'CheckboxWithLabel';

export { CheckboxWithLabel };
export type { CheckboxWithLabelProps };
