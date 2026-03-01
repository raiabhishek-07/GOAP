'use client';
import { useState, useEffect, useRef } from 'react';
import { getNetwork } from '../../lib/game/world/NetworkManager';
import styles from './MultiplayerLobby.module.css';

export default function MultiplayerLobby({ onStartGame, onBack }) {
    const [mode, setMode] = useState('menu'); // menu, create, join, lobby
    const [playerName, setPlayerName] = useState('');
    const [serverUrl, setServerUrl] = useState('ws://localhost:8080');
    const [roomCode, setRoomCode] = useState('');
    const [connected, setConnected] = useState(false);
    const [players, setPlayers] = useState([]);
    const [error, setError] = useState('');
    const [latency, setLatency] = useState(0);
    const network = useRef(null);

    useEffect(() => {
        network.current = getNetwork();

        // Ping interval for latency
        const pingInterval = setInterval(() => {
            if (network.current?.isConnected()) {
                network.current.ping();
                setLatency(network.current.getLatency());
            }
        }, 3000);

        return () => {
            clearInterval(pingInterval);
        };
    }, []);

    const handleConnect = () => {
        if (!playerName.trim()) {
            setError('Enter a callsign');
            return;
        }

        setError('');
        const net = network.current;

        net.onConnected = () => {
            setConnected(true);
            setError('');
        };

        net.onDisconnected = () => {
            setConnected(false);
            setError('Disconnected from server');
        };

        net.onError = (error) => {
            setConnected(false);
            // More user-friendly error messages
            if (error?.message?.includes('WebSocket not supported')) {
                setError('WebSocket not supported in this browser');
            } else if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('Connection refused')) {
                setError('Server is not running or connection refused');
            } else if (error?.message?.includes('timeout')) {
                setError('Connection timeout - server may be busy');
            } else {
                setError('Unable to connect to server. Check if server is running.');
            }
        };

        net.onRoomJoined = (msg) => {
            setMode('lobby');
            setRoomCode(msg.roomId || 'ROOM-001');
        };

        net.onPlayerJoined = (msg) => {
            setPlayers(prev => [...prev, {
                id: msg.playerId,
                name: msg.playerName || 'Unknown',
            }]);
        };

        net.onPlayerLeft = (msg) => {
            setPlayers(prev => prev.filter(p => p.id !== msg.playerId));
        };

        try {
            net.connect(serverUrl, playerName);
        } catch (error) {
            console.error('Connection error:', error);
            setError('Failed to initialize connection');
        }
    };

    const handleCreateRoom = () => {
        if (!connected) {
            // For demo/offline mode, don't try to connect
            setError('');
        }
        // In offline/demo mode, simulate room creation
        const fakeRoomId = 'ROOM-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        setRoomCode(fakeRoomId);
        setPlayers([{ id: 'local', name: playerName || 'PLAYER_01' }]);
        setMode('lobby');
    };

    const handleJoinRoom = () => {
        if (!roomCode.trim()) {
            setError('Enter a room code');
            return;
        }
        setPlayers([
            { id: 'local', name: playerName || 'PLAYER_01' },
            { id: 'host', name: 'HOST_PLAYER' },
        ]);
        setMode('lobby');
    };

    const handleStartGame = () => {
        onStartGame?.({
            multiplayer: true,
            roomCode,
            playerName: playerName || 'OPERATIVE_07',
            serverUrl,
            players,
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.panel}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>MULTIPLAYER</h1>
                    <p className={styles.subtitle}>
                        {connected
                            ? <><span className={styles.dot + ' ' + styles.online}></span> CONNECTED — {latency}ms</>
                            : <><span className={styles.dot + ' ' + styles.offline}></span> OFFLINE MODE</>
                        }
                    </p>
                </div>

                {/* Menu Mode */}
                {mode === 'menu' && (
                    <div className={styles.menuSection}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>CALLSIGN</label>
                            <input
                                className={styles.input}
                                type="text"
                                maxLength={16}
                                placeholder="Enter your name..."
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value.toUpperCase())}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>SERVER</label>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="ws://localhost:8080"
                                value={serverUrl}
                                onChange={e => setServerUrl(e.target.value)}
                            />
                        </div>

                        <div className={styles.buttonRow}>
                            <button className={styles.btnPrimary} onClick={() => { setMode('create'); handleCreateRoom(); }}>
                                <span className={styles.btnIcon}>🎮</span> CREATE ROOM
                            </button>
                            <button className={styles.btnSecondary} onClick={() => setMode('join')}>
                                <span className={styles.btnIcon}>🔗</span> JOIN ROOM
                            </button>
                        </div>

                        <button className={styles.btnBack} onClick={onBack}>
                            ← BACK TO MENU
                        </button>
                    </div>
                )}

                {/* Join Mode */}
                {mode === 'join' && (
                    <div className={styles.menuSection}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>ROOM CODE</label>
                            <input
                                className={styles.input + ' ' + styles.roomInput}
                                type="text"
                                maxLength={10}
                                placeholder="ROOM-XXXXX"
                                value={roomCode}
                                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                            />
                        </div>

                        <div className={styles.buttonRow}>
                            <button className={styles.btnPrimary} onClick={handleJoinRoom}>
                                JOIN
                            </button>
                            <button className={styles.btnSecondary} onClick={() => setMode('menu')}>
                                BACK
                            </button>
                        </div>
                    </div>
                )}

                {/* Lobby Mode */}
                {mode === 'lobby' && (
                    <div className={styles.lobbySection}>
                        <div className={styles.roomInfo}>
                            <span className={styles.roomLabel}>ROOM</span>
                            <span className={styles.roomCodeDisplay}>{roomCode}</span>
                        </div>

                        <div className={styles.playerList}>
                            <div className={styles.playerListHeader}>
                                PLAYERS ({players.length}/10)
                            </div>
                            {players.map((p, i) => (
                                <div key={p.id} className={styles.playerRow}>
                                    <span className={styles.playerIndex}>{String(i + 1).padStart(2, '0')}</span>
                                    <span className={styles.playerDot}></span>
                                    <span className={styles.playerName}>{p.name}</span>
                                    {p.id === 'local' && <span className={styles.youTag}>YOU</span>}
                                    {i === 0 && <span className={styles.hostTag}>HOST</span>}
                                </div>
                            ))}
                            {players.length < 10 && (
                                <div className={styles.playerRow + ' ' + styles.emptySlot}>
                                    <span className={styles.playerIndex}>--</span>
                                    <span className={styles.waitingText}>Waiting for players...</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.buttonRow}>
                            <button className={styles.btnStart} onClick={handleStartGame}>
                                ⚔️ START MATCH
                            </button>
                            <button className={styles.btnSecondary} onClick={() => setMode('menu')}>
                                LEAVE
                            </button>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className={styles.error}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Info footer */}
                <div className={styles.footer}>
                    <p>🔧 Multiplayer requires a WebSocket server to be running.</p>
                    <p>For demo purposes, you can create rooms in offline mode.</p>
                </div>
            </div>
        </div>
    );
}
