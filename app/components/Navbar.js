"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("hero");

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);

            const sections = [
                "hero",
                "overview",
                "core-pieces",
                "planner",
                "walkthrough",
                "comparison",
                "mental-model",
            ];

            for (const id of sections.reverse()) {
                const el = document.getElementById(id);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 200) {
                        setActiveSection(id);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { id: "overview", label: "Overview" },
        { id: "core-pieces", label: "Core Pieces" },
        { id: "planner", label: "Planner" },
        { id: "walkthrough", label: "Examples" },
        { id: "comparison", label: "FSM vs GOAP" },
        { id: "mental-model", label: "Summary" },
    ];

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        setMenuOpen(false);
    };

    return (
        <nav
            id="main-nav"
            className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}
        >
            <div className={styles.container}>
                <button
                    className={styles.logo}
                    onClick={() => scrollToSection("hero")}
                    aria-label="Go to top"
                >
                    <span className={styles.logoIcon}>◈</span>
                    <span className={styles.logoText}>GOAP</span>
                </button>

                <div className={`${styles.links} ${menuOpen ? styles.open : ""}`}>
                    {navLinks.map((link) => (
                        <button
                            key={link.id}
                            id={`nav-${link.id}`}
                            className={`${styles.navLink} ${activeSection === link.id ? styles.active : ""
                                }`}
                            onClick={() => scrollToSection(link.id)}
                        >
                            {link.label}
                        </button>
                    ))}
                    <Link
                        href="/simulation"
                        className={`${styles.navLink} ${styles.simLink}`}
                    >
                        📈 Sim Demo
                    </Link>
                    <Link
                        href="/game"
                        className={`${styles.navLink} ${styles.gameLink}`}
                        style={{ background: 'linear-gradient(90deg, #f59e0b, #ea580c)', color: '#000', fontWeight: '800', borderRadius: '8px', padding: '8px 16px' }}
                    >
                        🔥 MIND ARENA
                    </Link>
                </div>

                <button
                    id="mobile-menu-toggle"
                    className={`${styles.hamburger} ${menuOpen ? styles.open : ""}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>
        </nav>
    );
}
