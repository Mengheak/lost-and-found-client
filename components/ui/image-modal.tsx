"use client"

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type ImageModalProps = {
    images: string[]
    initialIndex?: number;
    open: boolean;
    onClose: () => void;
}

export function ImageModal({
    images,
    initialIndex = 0,
    open,
    onClose }: ImageModalProps
) {

    const [currentIndex, setCurrentIndex] = useState(initialIndex);


    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)
    }, [images.length])

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => prev === images.length - 1 ? 0 : prev + 1);
    }, [images.length])


    //keyboard support
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") goToPrevious();
            if (e.key === "ArrowRight") goToNext();
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);

    }, [open, onClose, goToNext, goToPrevious])


    //prevent body scroll when open the modal
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [open])

    if (!open || images.length === 0) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                aria-label="Close"
            >
                <X size={24} />
            </button>

            {/* Previous */}
            {images.length > 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        goToPrevious();
                    }}
                    className="absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                    aria-label="Previous image"
                >
                    <ChevronLeft size={28} />
                </button>
            )}

            {/* Image */}
            <div
                className="relative max-h-[90vh] max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    width={1200}
                    height={800}
                    className="max-h-[90vh] w-auto object-contain"
                    priority
                />
            </div>

            {/* Next */}
            {images.length > 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        goToNext();
                    }}
                    className="absolute right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                    aria-label="Next image"
                >
                    <ChevronRight size={28} />
                </button>
            )}

            {/* Counter */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
}