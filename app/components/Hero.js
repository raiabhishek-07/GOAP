"use client";
import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";

export default function Hero() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let animationId;
        const particles = [];
        const connections = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Create particles representing nodes in a planning graph
        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                color:
                    i % 3 === 0
                        ? "rgba(0, 212, 255, 0.6)"
                        : i % 3 === 1
                            ? "rgba(124, 58, 237, 0.5)"
                            : "rgba(16, 185, 129, 0.4)",
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update & draw particles
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();

                // Connect nearby particles
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[j].x - p.x;
                    const dy = particles[j].y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(0, 212, 255, ${0.08 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <section id="hero" className={styles.hero}>
            <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

            {/* Gradient orbs */}
            <div className={styles.orb1} aria-hidden="true" />
            <div className={styles.orb2} aria-hidden="true" />
            <div className={styles.orb3} aria-hidden="true" />

            <div className={styles.content}>
                <div className={styles.badge}>
                    <span className={styles.badgeDot} />
                    Game AI Architecture
                </div>

                <h1 className={styles.title}>
                    <span className={styles.titleLine}>Goal-Oriented</span>
                    <span className={`${styles.titleLine} ${styles.titleAccent}`}>
                        Action Planning
                    </span>
                </h1>

                <p className={styles.subtitle}>
                    The AI system that lets agents <em>reason</em> about their world —
                    dynamically building multi-step plans instead of following rigid
                    scripts. Famously used in{" "}
                    <strong>F.E.A.R.</strong> and developed by{" "}
                    <strong>Jeff Orkin</strong> at MIT.
                </p>

                <div className={styles.cta}>
                    <button
                        id="hero-cta-explore"
                        className={styles.btnPrimary}
                        onClick={() =>
                            document
                                .getElementById("overview")
                                ?.scrollIntoView({ behavior: "smooth" })
                        }
                    >
                        Explore GOAP
                        <span className={styles.btnArrow}>↓</span>
                    </button>
                    <button
                        id="hero-cta-planner"
                        className={styles.btnSecondary}
                        onClick={() =>
                            document
                                .getElementById("planner")
                                ?.scrollIntoView({ behavior: "smooth" })
                        }
                    >
                        See the Planner
                    </button>
                </div>

            </div>
        </section>
    );
}
