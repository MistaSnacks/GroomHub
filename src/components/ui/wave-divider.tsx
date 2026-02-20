import { SVGProps } from "react";

interface WaveDividerProps extends SVGProps<SVGSVGElement> {
    position?: "top" | "bottom";
    fill?: string;
}

export function WaveDivider({ position = "top", fill = "currentColor", className = "", ...props }: WaveDividerProps) {
    const isTop = position === "top";

    return (
        <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className={`absolute w-full h-[60px] sm:h-[100px] z-20 pointer-events-none ${isTop ? "top-0 rotate-180" : "bottom-0 translate-y-[1px]"} ${className}`}
            {...props}
        >
            <path
                fill={fill}
                fillOpacity="1"
                d="M0,128L48,144C96,160,192,192,288,197.3C384,203,480,181,576,170.7C672,160,768,160,864,176C960,192,1056,224,1152,218.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
        </svg>
    );
}
