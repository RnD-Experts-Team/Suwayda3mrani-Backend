import { ImgHTMLAttributes } from 'react';

interface AppLogoIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  alt?: string;
}

export default function AppLogoIcon({ alt = "Suwayda3mrani Logo", ...props }: AppLogoIconProps) {
    return (
        <img 
            src="/storage/general/suwayda3mrani.png" 
            alt={alt}
            {...props}
        />
    );
}
