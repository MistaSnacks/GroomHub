import { SVGProps } from "react";

interface TornEdgeProps extends SVGProps<SVGSVGElement> {
    position?: "top" | "bottom";
    fill?: string;
}

export function TornEdge({ position = "top", fill = "currentColor", className = "", ...props }: TornEdgeProps) {
    // A ragged path to simulate ripped paper.
    const isTop = position === "top";

    return (
        <svg
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
            className={`absolute w-full h-[30px] sm:h-[40px] z-20 pointer-events-none ${isTop ? "top-0 rotate-180 transform-gpu translate-y-[1px]" : "bottom-0 transform-gpu translate-y-[1px]"} ${className}`}
            {...props}
        >
            <path
                d="M0,40 V15 Q15,0 30,12 T60,8 T90,20 T120,5 T150,18 T180,8 T210,22 T240,5 T270,16 T300,5 T330,15 T360,6 T390,20 T420,10 T450,18 T480,5 T510,16 T540,8 T570,22 T600,10 T630,22 T660,8 T690,20 T720,5 T750,18 T780,10 T810,24 T840,8 T870,22 T900,10 T930,18 T960,8 T990,20 T1020,5 T1050,16 T1080,8 T1110,22 T1140,10 T1170,16 T1200,8 V40 Z"
                fill={fill}
            />
        </svg>
    );
}
