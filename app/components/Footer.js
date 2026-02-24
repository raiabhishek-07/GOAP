"use client";
import styles from "./Footer.module.css";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.brand}>
                        <span className={styles.logoIcon}>◈</span>
                        <span className={styles.logoText}>GOAP</span>
                    </div>
                    <p className={styles.tagline}>
                        Goal-Oriented Action Planning — The future of game AI.
                    </p>
                </div>

                <div className={styles.divider} />

                <div className={styles.bottom}>
                    <p className={styles.copy}>
                        Built as an interactive educational resource.
                    </p>
                    <p className={styles.tech}>
                        Made with Next.js
                    </p>
                </div>
            </div>
        </footer>
    );
}
