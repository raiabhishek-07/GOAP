"use client";
import { use } from "react";
import dynamic from "next/dynamic";

const DirectLauncher = dynamic(
    () => import("../../../components/game/DirectLauncher"),
    { ssr: false }
);

export default function StagePage({ params }) {
    const { level, stage } = use(params);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            background: '#020617'
        }}>
            <DirectLauncher level={level} stage={stage} />
        </div>
    );
}
