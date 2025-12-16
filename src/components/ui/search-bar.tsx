"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { Search, CircleDot, Calendar } from "lucide-react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { cn } from "@/lib/utils"

const GooeyFilter = () => (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <defs>
            <filter id="gooey-effect">
                <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
        </defs>
    </svg>
)

export interface SearchResult {
    id: string;
    name: string;
    registration_open: boolean | null;
}

interface SearchBarProps {
    placeholder?: string
    value: string
    onChange: (value: string) => void
    results: SearchResult[]
    onResultClick: (result: SearchResult) => void
    className?: string
}

const SearchBar = ({
    placeholder = "Search events...",
    value,
    onChange,
    results,
    onResultClick,
    className
}: SearchBarProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isClicked, setIsClicked] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    const isUnsupportedBrowser = useMemo(() => {
        if (typeof window === "undefined") return false
        const ua = navigator.userAgent.toLowerCase()
        const isSafari = ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium")
        const isChromeOniOS = ua.includes("crios")
        return isSafari || isChromeOniOS
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (value.trim()) {
            setIsAnimating(true)
            setTimeout(() => setIsAnimating(false), 1000)
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isFocused) {
            const rect = e.currentTarget.getBoundingClientRect()
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            })
        }
    }

    const handleClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
        setIsClicked(true)
        setTimeout(() => setIsClicked(false), 800)
    }

    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isFocused])

    // Typed as Variants to avoid TS errors when passing to motion components
    const searchIconVariants: Variants = {
        initial: { scale: 1 },
        animate: {
            // note: keeping animation logic (uses outer scope isAnimating)
            rotate: isAnimating ? [0, -15, 15, -10, 10, 0] : 0,
            scale: isAnimating ? [1, 1.3, 1] : 1,
            transition: { duration: 0.6, ease: "easeInOut" },
        },
    }

    const suggestionVariants: Variants = {
        // variants can be functions that receive `custom`
        hidden: (i = 0) => ({
            opacity: 0,
            y: -10,
            scale: 0.95,
            transition: { duration: 0.15, delay: i * 0.05 },
        }),
        visible: (i = 0) => ({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 15, delay: i * 0.07 },
        }),
        exit: (i = 0) => ({
            opacity: 0,
            y: -5,
            scale: 0.9,
            transition: { duration: 0.1, delay: i * 0.03 },
        }),
    }

    const particles = Array.from({ length: isFocused ? 18 : 0 }, (_, i) => (
        <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{
                x: [0, (Math.random() - 0.5) * 40],
                y: [0, (Math.random() - 0.5) * 40],
                scale: [0, Math.random() * 0.8 + 0.4],
                opacity: [0, 0.8, 0],
            }}
            transition={{
                duration: Math.random() * 1.5 + 1.5,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
            }}
            className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-[#9B1B1B] to-red-400"
            style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                filter: "blur(2px)",
            }}
        />
    ))

    const clickParticles = isClicked
        ? Array.from({ length: 14 }, (_, i) => (
            <motion.div
                key={`click-${i}`}
                initial={{ x: mousePosition.x, y: mousePosition.y, scale: 0, opacity: 1 }}
                animate={{
                    x: mousePosition.x + (Math.random() - 0.5) * 160,
                    y: mousePosition.y + (Math.random() - 0.5) * 160,
                    scale: Math.random() * 0.8 + 0.2,
                    opacity: [1, 0],
                }}
                transition={{ duration: Math.random() * 0.8 + 0.5, ease: "easeOut" }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                    background: `rgba(${255}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, 0.8)`, // Red-ish
                    boxShadow: "0 0 8px rgba(255, 255, 255, 0.8)",
                }}
            />
        ))
        : null

    return (
        <div className={cn("relative w-full z-50", className)}>
            <GooeyFilter />
            <motion.form
                onSubmit={handleSubmit}
                className="relative flex items-center justify-center w-full mx-auto"
                initial={{ width: "240px" }}
                animate={{ width: isFocused ? "280px" : "240px" }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onMouseMove={handleMouseMove}
            >
                <motion.div
                    className={cn(
                        "flex items-center w-full rounded-full border relative overflow-hidden backdrop-blur-md",
                        isFocused ? "border-transparent shadow-xl" : "border-gray-200 bg-white/30"
                    )}
                    animate={{
                        boxShadow: isClicked
                            ? "0 0 40px rgba(155, 27, 27, 0.5), 0 0 15px rgba(220, 38, 38, 0.7) inset"
                            : isFocused
                                ? "0 15px 35px rgba(0, 0, 0, 0.2)"
                                : "0 0 0 rgba(0, 0, 0, 0)",
                    }}
                    onClick={handleClick}
                >
                    {isFocused && (
                        <motion.div
                            className="absolute inset-0 -z-10"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 0.15,
                                background: [
                                    "linear-gradient(90deg, #9B1B1B 0%, #ef4444 100%)",
                                    "linear-gradient(90deg, #ef4444 0%, #fca5a5 100%)",
                                    "linear-gradient(90deg, #fca5a5 0%, #9B1B1B 100%)",
                                    "linear-gradient(90deg, #9B1B1B 0%, #ef4444 100%)",
                                ],
                            }}
                            transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        />
                    )}

                    <div
                        className="absolute inset-0 overflow-hidden rounded-full -z-5"
                        style={{ filter: isUnsupportedBrowser ? "none" : "url(#gooey-effect)" }}
                    >
                        {particles}
                    </div>

                    {isClicked && (
                        <>
                            <motion.div
                                className="absolute inset-0 -z-5 rounded-full bg-red-400/10"
                                initial={{ scale: 0, opacity: 0.7 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                            <motion.div
                                className="absolute inset-0 -z-5 rounded-full bg-white"
                                initial={{ opacity: 0.5 }}
                                animate={{ opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                        </>
                    )}

                    {clickParticles}

                    <motion.div className="pl-4 py-3" variants={searchIconVariants} initial="initial" animate="animate">
                        <Search
                            size={20}
                            strokeWidth={isFocused ? 2.5 : 2}
                            className={cn(
                                "transition-all duration-300",
                                isAnimating ? "text-red-500" : isFocused ? "text-[#9B1B1B]" : "text-gray-500",
                            )}
                        />
                    </motion.div>

                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        className={cn(
                            "w-full py-3 bg-transparent outline-none placeholder:text-gray-400 font-medium text-base relative z-10",
                            isFocused ? "text-gray-800 tracking-wide" : "text-gray-600"
                        )}
                    />

                    <AnimatePresence>
                        {value && (
                            <motion.button
                                type="submit"
                                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                                whileHover={{
                                    scale: 1.05,
                                    background: "linear-gradient(45deg, #9B1B1B 0%, #ef4444 100%)",
                                    boxShadow: "0 10px 25px -5px rgba(155, 27, 27, 0.5)",
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="px-5 py-2 mr-2 text-sm font-medium rounded-full bg-gradient-to-r from-[#9B1B1B] to-red-500 text-white backdrop-blur-sm transition-all shadow-lg"
                            >
                                Search
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {isFocused && (
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [0, 0.1, 0.2, 0.1, 0],
                                background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.8) 0%, transparent 70%)",
                            }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                        />
                    )}
                </motion.div>
            </motion.form>

            <AnimatePresence>
                {isFocused && value && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 z-10 w-full mt-2 overflow-hidden bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-100"
                        style={{
                            maxHeight: "300px",
                            overflowY: "auto",
                            filter: isUnsupportedBrowser ? "none" : "drop-shadow(0 15px 15px rgba(0,0,0,0.1))",
                        }}
                    >
                        <div className="p-2">
                            {results.map((result, index) => (
                                <motion.div
                                    key={result.id}
                                    custom={index}
                                    variants={suggestionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    onClick={() => {
                                        onResultClick(result)
                                        setIsFocused(false)
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2 cursor-pointer rounded-md hover:bg-red-50 group",
                                        !result.registration_open && "opacity-60 cursor-not-allowed bg-gray-50"
                                    )}
                                >
                                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: index * 0.06 }}>
                                        <Calendar size={16} className={cn(
                                            "group-hover:text-[#9B1B1B]",
                                            result.registration_open ? "text-red-400" : "text-gray-400"
                                        )} />
                                    </motion.div>
                                    <motion.div
                                        className="flex-1 min-w-0"
                                        initial={{ x: -5, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.08 }}
                                    >
                                        <p className="text-sm font-medium text-gray-700 group-hover:text-[#9B1B1B] truncate">{result.name}</p>
                                        <p className={cn(
                                            "text-xs",
                                            result.registration_open ? "text-green-600" : "text-red-400"
                                        )}>
                                            {result.registration_open ? 'Register Now' : 'Closed'}
                                        </p>
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export { SearchBar }
