"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Play, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AnimationStyle =
  | "from-bottom"
  | "from-center"
  | "from-top"
  | "from-left"
  | "from-right"
  | "fade"
  | "top-in-bottom-out"
  | "left-in-right-out";

interface HeroVideoProps {
  animationStyle?: AnimationStyle;
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailAlt?: string;
  className?: string;
}

const animationVariants = {
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  "from-left": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  "from-right": {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "top-in-bottom-out": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "left-in-right-out": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
};

export function HeroVideoDialog({
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video de Biomedical Business and Service",
  className,
}: HeroVideoProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const selectedAnimation = animationVariants[animationStyle];

  return (
    <div className={cn("relative", className)}>
      <button
        aria-label="Abrir video"
        className="group relative block w-full overflow-hidden rounded-[8px] border border-cyan-100 bg-slate-950 text-left shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
        onClick={() => setIsVideoOpen(true)}
        type="button"
      >
        <Image
          alt={thumbnailAlt}
          className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02] group-hover:brightness-90"
          height={1080}
          src={thumbnailSrc}
          width={1920}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/10">
          <span className="flex size-24 items-center justify-center rounded-full bg-cyan-300/20 backdrop-blur-md">
            <span className="flex size-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,#22d3ee_0%,#0284c7_100%)] text-white shadow-[0_18px_38px_rgba(8,145,178,0.34)] transition duration-300 group-hover:scale-110">
              <Play className="ml-1 size-7 fill-white" />
            </span>
          </span>
        </span>
      </button>
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.div
              {...selectedAnimation}
              className="relative aspect-video w-full max-w-5xl"
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <button
                aria-label="Cerrar video"
                className="absolute -top-14 right-0 rounded-full border border-cyan-300/30 bg-slate-950/70 p-2 text-white backdrop-blur transition hover:bg-cyan-500"
                onClick={() => setIsVideoOpen(false)}
                type="button"
              >
                <XIcon className="size-5" />
              </button>
              <div
                className="size-full overflow-hidden rounded-[8px] border border-cyan-100 bg-slate-950"
                onClick={(event) => event.stopPropagation()}
              >
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="size-full"
                  src={videoSrc}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
