import React, { useState, useEffect, useRef } from 'react';
import { ActionType, GameStatus, PlayerState, RoundResult, LogEntry, ACTION_DETAILS, GameMode } from './types';
import { resolveRound, resolveRoundTriPhase, getAIAction } from './utils/gameLogic';
import { ActionVisual, EnergyOrb, GameHUD } from './components/Visuals';
import { Controls } from './components/Controls';
import { Info, RotateCcw, Trophy, Skull, Volume2, VolumeX, Zap, Music, Sword, BrainCircuit, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const INITIAL_STATE: PlayerState = {
  energy: 1,
  lastAction: null,
  health: 1
};

// Reuse existing assets effectively for new moves
const SOUND_ASSETS = {
  bgm: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/theme_01.mp3',
  charge: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/bonus.wav',
  defend: 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3',
  magicDefend: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.wav',
  attackSmall: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/player_shoot.wav',
  attackBig: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/explosion_02.wav',
  win: 'https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a',
  lose: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/character_died.wav'
};

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode | null>(null); // Null means selecting mode
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_STATE);
  const [aiState, setAiState] = useState<PlayerState>(INITIAL_STATE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [roundCount, setRoundCount] = useState(1);
  
  // Volume State
  const [showVolumePanel, setShowVolumePanel] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.2); 
  const [sfxVolume, setSfxVolume] = useState(0.8); 

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const volumePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bgmRef.current = new Audio(SOUND_ASSETS.bgm);
    bgmRef.current.loop = true;
    bgmRef.current.volume = bgmVolume;
    bgmRef.current.load();
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = bgmVolume;
      if (gameStatus !== GameStatus.IDLE && bgmVolume > 0 && bgmRef.current.paused) {
          bgmRef.current.play().catch(e => console.log("Auto-resume BGM failed:", e));
      }
    }
  }, [bgmVolume, gameStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumePanelRef.current && !volumePanelRef.current.contains(event.target as Node)) {
        setShowVolumePanel(false);
      }
    };

    if (showVolumePanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumePanel]);

  const playSound = (type: keyof typeof SOUND_ASSETS | string) => {
    if (sfxVolume === 0) return;
    
    // Map new actions to existing sounds
    let assetKey = type;
    if (type.includes('CHARGE')) assetKey = 'charge';
    else if (type.includes('DEF')) assetKey = 'defend';
    else if (type.includes('ULT') || type.includes('BIG')) assetKey = 'attackBig';
    else if (type.includes('ATK')) assetKey = 'attackSmall';

    // Fallback if key not found in asset list
    if (!SOUND_ASSETS[assetKey as keyof typeof SOUND_ASSETS]) assetKey = 'attackSmall';

    const audio = new Audio(SOUND_ASSETS[assetKey as keyof typeof SOUND_ASSETS]);
    audio.volume = Math.min(1, sfxVolume);
    
    audio.play().catch(error => {
        console.error(`Error playing sound ${type}:`, error);
    });
  };

  const startNewGame = (mode: GameMode) => {
    // Start BGM
    if (bgmRef.current && bgmRef.current.paused && bgmVolume > 0) {
      bgmRef.current.play().catch(e => console.log("BGM start failed:", e));
    }

    setGameMode(mode);
    setGameStatus(GameStatus.PLAYING);
    setPlayerState(INITIAL_STATE);
    setAiState(INITIAL_STATE);
    setLogs([]);
    setRoundCount(1);
  };

  const returnToMenu = () => {
      setGameMode(null);
      setGameStatus(GameStatus.IDLE);
  };

  const restartGame = () => {
      if (gameMode) startNewGame(gameMode);
  };

  const triggerFireworks = () => {
    playSound('win');
    confetti({
      particleCount: 150,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.8 }, 
      colors: ['#FCD34D', '#F87171', '#60A5FA', '#34D399'],
      disableForReducedMotion: true,
      zIndex: 100,
    });
    confetti({
      particleCount: 150,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.8 }, 
      colors: ['#FCD34D', '#F87171', '#60A5FA', '#34D399'],
      disableForReducedMotion: true,
      zIndex: 100,
    });
  };

  const executeTurn = (playerAction: ActionType) => {
    if (!gameMode) return;

    playSound(playerAction);

    // 1. AI Action
    const aiAction = getAIAction(aiState, gameMode);

    // 2. Resolve
    const resolution = gameMode === GameMode.CLASSIC 
        ? resolveRound(playerAction, aiAction)
        : resolveRoundTriPhase(playerAction, aiAction);
    
    const { result, message } = resolution;

    // 3. Update States
    let newPlayerEnergy = playerState.energy - ACTION_DETAILS[playerAction].cost;
    let newAiEnergy = aiState.energy - ACTION_DETAILS[aiAction].cost;

    if (playerAction === ActionType.CHARGE) newPlayerEnergy++;
    if (aiAction === ActionType.CHARGE) newAiEnergy++;

    newPlayerEnergy = Math.max(0, newPlayerEnergy);
    newAiEnergy = Math.max(0, newAiEnergy);

    // 4. Log
    const newLog: LogEntry = {
      round: roundCount,
      playerAction,
      aiAction,
      resultMessage: message
    };
    setLogs(prev => [newLog, ...prev]);

    // 5. Check End
    if (result === RoundResult.PLAYER_WINS) {
      setGameStatus(GameStatus.VICTORY);
      triggerFireworks();
    } else if (result === RoundResult.AI_WINS) {
      setGameStatus(GameStatus.DEFEAT);
      playSound('lose');
    } else {
      setPlayerState({ ...playerState, energy: newPlayerEnergy, lastAction: playerAction });
      setAiState({ ...aiState, energy: newAiEnergy, lastAction: aiAction });
      setRoundCount(prev => prev + 1);
    }
  };

  const isGlobalMuted = bgmVolume === 0 && sfxVolume === 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 select-none overflow-hidden">
      
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-white shadow-sm z-10 relative">
        <div className="flex items-center gap-2 relative" ref={volumePanelRef}>
           <button 
             onClick={() => setShowVolumePanel(!showVolumePanel)} 
             className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
           >
             {isGlobalMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
           </button>

           {showVolumePanel && (
             <div className="absolute top-12 left-0 bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-4 w-60 border border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Music className="w-4 h-4" />
                    <span className="text-xs font-bold">背景音乐</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={bgmVolume} onChange={(e) => setBgmVolume(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold">音效</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={sfxVolume} onChange={(e) => setSfxVolume(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
             </div>
           )}
        </div>

        <h1 onClick={returnToMenu} className="cursor-pointer text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 arcade-font">
          波波攒
        </h1>
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
          <Info className="w-5 h-5" />
        </button>
      </header>

      {/* MODE SELECTION SCREEN */}
      {!gameMode && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
           <h2 className="text-2xl font-bold mb-8 text-slate-700">选择游戏模式</h2>
           
           <div className="grid gap-6 w-full max-w-md">
             {/* Classic Mode */}
             <button onClick={() => startNewGame(GameMode.CLASSIC)} className="relative overflow-hidden group bg-white p-6 rounded-3xl shadow-xl border-2 border-slate-100 hover:border-blue-300 transition-all text-left">
                <div className="absolute right-0 top-0 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Zap className="w-32 h-32 -mr-8 -mt-8 rotate-12" />
                </div>
                <h3 className="text-xl font-black text-blue-600 mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5" /> 经典模式
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                    童年回忆。蓄力、防御、小波、大波。<br/>简单纯粹的心理博弈。
                </p>
             </button>

             {/* Tri-Phase Mode */}
             <button onClick={() => startNewGame(GameMode.TRI_PHASE)} className="relative overflow-hidden group bg-white p-6 rounded-3xl shadow-xl border-2 border-slate-100 hover:border-purple-300 transition-all text-left">
                <div className="absolute right-0 top-0 opacity-10 group-hover:opacity-20 transition-opacity">
                   <BrainCircuit className="w-32 h-32 -mr-8 -mt-8 rotate-12" />
                </div>
                <div className="flex gap-1 mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                </div>
                <h3 className="text-xl font-black text-purple-600 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> 三相演武
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                    进阶玩法。天马、寒冰、绵柔三系克制。<br/>更复杂的策略，更刺激的对决。
                </p>
             </button>
           </div>
        </div>
      )}

      {/* Main Game Area */}
      {gameMode && (
        <main className="flex-1 flex flex-col max-w-lg mx-auto w-full relative">
          {/* Game Area Content */}
          <div className="flex-1 flex flex-col justify-between py-6 relative z-0">
            
            {/* HUD for Tri-Phase */}
            <GameHUD mode={gameMode} />
            
            {/* Opponent Area */}
            <div className="flex flex-col items-center justify-center transition-all duration-500">
              <ActionVisual action={gameStatus === GameStatus.PLAYING ? (logs[0]?.aiAction || aiState.lastAction) : null} isPlayer={false} />
              <div className="mt-4">
                <span className="text-xs font-bold text-rose-500 tracking-wider mb-1 block text-center uppercase">对手</span>
                <EnergyOrb count={aiState.energy} isPlayer={false} />
              </div>
            </div>

            {/* Center Status / Log */}
            <div className="flex items-center justify-center px-6 py-2 my-4">
               {logs.length > 0 ? (
                 <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-slate-100 text-center max-w-sm transform transition-all animate-in fade-in zoom-in duration-300">
                    <p className="text-xl font-bold text-slate-800 arcade-font leading-relaxed">{logs[0].resultMessage}</p>
                    <p className="text-xs text-slate-400 mt-3 font-mono">第 {logs[0].round} 回合</p>
                 </div>
               ) : (
                 <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-slate-100 text-center">
                   <p className="text-lg font-bold text-slate-600 arcade-font">
                       {gameStatus === GameStatus.IDLE ? "准备就绪" : "互相试探..."}
                   </p>
                 </div>
               )}
            </div>

            {/* Player Area */}
            <div className="flex flex-col items-center justify-center transition-all duration-500 mb-4">
              <div className="mb-4">
                 <span className="text-xs font-bold text-blue-600 tracking-wider mb-1 block text-center uppercase">你</span>
                 <EnergyOrb count={playerState.energy} isPlayer={true} />
              </div>
              <ActionVisual action={playerState.lastAction} isPlayer={true} />
            </div>

          </div>

          {/* Controls */}
          <div className="bg-white/50 backdrop-blur-md pt-2">
              <Controls 
                energy={playerState.energy} 
                onAction={executeTurn} 
                disabled={gameStatus !== GameStatus.PLAYING} 
                gameMode={gameMode}
              />
          </div>

          {/* VICTORY / DEFEAT SCREENS */}
          {(gameStatus === GameStatus.VICTORY || gameStatus === GameStatus.DEFEAT) && (
            <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500">
                <div className={`bg-white rounded-3xl shadow-2xl p-8 max-w-xs w-full text-center border-4 ${gameStatus === GameStatus.VICTORY ? 'border-yellow-200' : 'border-red-100'}`}>
                {gameStatus === GameStatus.VICTORY ? (
                    <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4 animate-bounce" />
                ) : (
                    <Skull className="w-24 h-24 text-red-500 mx-auto mb-4 animate-pulse" />
                )}
                <h2 className={`text-4xl font-black mb-2 arcade-font ${gameStatus === GameStatus.VICTORY ? 'text-yellow-500' : 'text-red-500'}`}>
                    {gameStatus === GameStatus.VICTORY ? '胜利！' : '失败'}
                </h2>
                <p className="text-slate-600 mb-8">
                    {gameStatus === GameStatus.VICTORY ? '你智取了对手。' : '胜败乃兵家常事。'}
                </p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={restartGame}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <RotateCcw className="w-5 h-5" />
                        再来一局
                    </button>
                    <button 
                        onClick={returnToMenu}
                        className="w-full bg-white text-slate-500 border-2 border-slate-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-slate-700 transition-all"
                    >
                        返回主菜单
                    </button>
                </div>
                </div>
            </div>
          )}

        </main>
      )}
    </div>
  );
};

export default App;
