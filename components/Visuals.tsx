import React from 'react';
import { Hand, Shield, ShieldAlert, Zap, Flame, Sword, Cloud, Snowflake, Wind, Sun, Feather, Star } from 'lucide-react';
import { ActionType, Faction, GameMode } from '../types';

interface ActionIconProps {
  action: ActionType | null;
  isPlayer: boolean;
}

export const GameHUD: React.FC<{ mode: GameMode }> = ({ mode }) => {
  if (mode !== GameMode.TRI_PHASE) return null;

  return (
    <div className="absolute top-2 right-2 bg-white/80 backdrop-blur rounded-lg p-2 text-[10px] shadow-sm border border-slate-200 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex items-center text-amber-500 font-bold"><Sun className="w-3 h-3 mr-1"/>天马</div>
      <span className="text-slate-400">&gt;</span>
      <div className="flex items-center text-cyan-500 font-bold"><Snowflake className="w-3 h-3 mr-1"/>寒冰</div>
      <span className="text-slate-400">&gt;</span>
      <div className="flex items-center text-pink-500 font-bold"><Cloud className="w-3 h-3 mr-1"/>绵柔</div>
      <span className="text-slate-400">&gt;</span>
      <div className="flex items-center text-amber-500 font-bold"><Sun className="w-3 h-3 mr-1"/></div>
    </div>
  );
};

export const ActionVisual: React.FC<ActionIconProps> = ({ action, isPlayer }) => {
  // Common rotation for opponent
  const iconRotateClass = isPlayer ? "" : "rotate-180";

  if (!action) return <div className="h-24 w-24 opacity-10 bg-slate-400/20 rounded-full animate-pulse my-6" />;

  const renderContent = () => {
    switch (action) {
      // --- CLASSIC MODE GESTURES (Icon Style) ---
      case ActionType.CHARGE:
        return (
          <>
            <div className={`relative ${iconRotateClass}`}>
              <Hand className={`w-24 h-24 ${isPlayer ? 'text-blue-500' : 'text-rose-500'}`} />
            </div>
            <span className={`font-bold ${isPlayer ? 'text-blue-600' : 'text-rose-600'} mt-2 text-lg arcade-font leading-relaxed py-1`}>蓄力</span>
          </>
        );

      case ActionType.DEFEND:
        return (
          <>
            <div className={`relative ${iconRotateClass}`}>
              <Shield className="w-24 h-24 text-slate-500" />
              <div className="absolute inset-0 bg-slate-400/10 blur-xl rounded-full" />
            </div>
            <span className="font-bold text-slate-600 mt-2 text-lg arcade-font leading-relaxed py-1">防御</span>
          </>
        );

      case ActionType.MAGIC_DEFEND:
        return (
          <>
             <div className={`relative ${iconRotateClass}`}>
              <ShieldAlert className="w-24 h-24 text-purple-500" />
              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
              <div className="absolute -inset-2 border-2 border-purple-300 rounded-full animate-spin-slow opacity-50 border-dashed" />
            </div>
            <span className="font-bold text-purple-600 mt-2 text-lg arcade-font leading-relaxed py-1">魔法防御</span>
          </>
        );

      case ActionType.ATTACK_SMALL:
        return (
          <>
            <div className={`relative ${iconRotateClass}`}>
              <Zap className={`w-24 h-24 ${isPlayer ? 'text-cyan-500' : 'text-rose-500'}`} />
              <div className={`absolute inset-0 ${isPlayer ? 'bg-cyan-400/30' : 'bg-rose-400/30'} blur-xl rounded-full`} />
            </div>
            <span className={`font-bold ${isPlayer ? 'text-cyan-600' : 'text-rose-600'} mt-2 text-lg arcade-font leading-relaxed py-1`}>小波</span>
          </>
        );

      case ActionType.ATTACK_BIG:
        return (
          <>
             <div className={`relative ${iconRotateClass}`}>
              <Flame className={`w-28 h-28 ${isPlayer ? 'text-orange-500' : 'text-red-600'} animate-pulse`} />
              <div className={`absolute inset-0 ${isPlayer ? 'bg-orange-500/30' : 'bg-red-600/30'} blur-2xl rounded-full`} />
            </div>
            <span className="font-bold text-red-600 mt-2 text-xl arcade-font leading-relaxed py-1 uppercase tracking-widest">大波</span>
          </>
        );

      // --- TRI-PHASE / OTHER MODES ---
      // PEGASUS (Gold/Orange)
      case ActionType.PEGASUS_ATK_T1:
      case ActionType.PEGASUS_ATK_T2:
      case ActionType.PEGASUS_ULT:
        return (
          <>
            <div className={`relative ${iconRotateClass}`}>
              {action === ActionType.PEGASUS_ATK_T1 && <Wind className="w-24 h-24 text-amber-400" />}
              {action === ActionType.PEGASUS_ATK_T2 && <Sun className="w-28 h-28 text-amber-500 animate-pulse" />}
              {action === ActionType.PEGASUS_ULT && <Star className="w-32 h-32 text-amber-600 animate-spin-slow" />}
              <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full" />
            </div>
            <span className="font-bold text-amber-600 mt-2 text-lg arcade-font leading-relaxed py-1">
                {action === ActionType.PEGASUS_ULT ? '天马流星拳' : (action === ActionType.PEGASUS_ATK_T2 ? '天马拳' : '天马攻')}
            </span>
          </>
        );
      case ActionType.PEGASUS_DEF_ELE:
        return (
          <>
            <div className={`relative ${iconRotateClass}`}>
              <Shield className="w-24 h-24 text-amber-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <Wind className="w-12 h-12 text-white opacity-80" />
              </div>
            </div>
            <span className="font-bold text-amber-600 mt-2 text-lg arcade-font leading-relaxed py-1">天马防</span>
          </>
        );

      // ICE (Cyan/Blue)
      case ActionType.ICE_ATK_T1:
      case ActionType.ICE_ATK_T2:
      case ActionType.ICE_ULT:
        return (
          <>
            <div className={`relative ${iconRotateClass}`}>
              <Snowflake className={`w-24 h-24 text-cyan-400 ${action === ActionType.ICE_ULT ? 'animate-spin' : ''}`} />
              <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full" />
            </div>
            <span className="font-bold text-cyan-600 mt-2 text-lg arcade-font leading-relaxed py-1">
                {action === ActionType.ICE_ULT ? '超冰' : (action === ActionType.ICE_ATK_T2 ? '冰箭' : '冰攻')}
            </span>
          </>
        );
      case ActionType.ICE_DEF_ELE:
        return (
          <>
             <div className={`relative ${iconRotateClass}`}>
              <Shield className="w-24 h-24 text-cyan-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <Snowflake className="w-12 h-12 text-white opacity-80" />
              </div>
            </div>
            <span className="font-bold text-cyan-600 mt-2 text-lg arcade-font leading-relaxed py-1">冰防</span>
          </>
        );

      // COTTON (Pink)
      case ActionType.COTTON_ATK_T1:
      case ActionType.COTTON_ATK_T2:
      case ActionType.COTTON_ULT:
        return (
          <>
            <div className={`relative ${iconRotateClass}`}>
              <Cloud className={`w-24 h-24 text-pink-400 ${action === ActionType.COTTON_ULT ? 'scale-110' : ''}`} />
              {action === ActionType.COTTON_ULT && <div className="absolute inset-0 bg-pink-400/30 blur-xl rounded-full" />}
            </div>
            <span className="font-bold text-pink-600 mt-2 text-lg arcade-font leading-relaxed py-1">
                 {action === ActionType.COTTON_ULT ? '通心拳' : (action === ActionType.COTTON_ATK_T2 ? '绵掌' : '绵攻')}
            </span>
          </>
        );
      case ActionType.COTTON_DEF_ELE:
        return (
          <>
             <div className={`relative ${iconRotateClass}`}>
              <Shield className="w-24 h-24 text-pink-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <Feather className="w-12 h-12 text-white opacity-80" />
              </div>
            </div>
            <span className="font-bold text-pink-600 mt-2 text-lg arcade-font leading-relaxed py-1">绵防</span>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[160px]">
      {renderContent()}
    </div>
  );
};

export const EnergyOrb: React.FC<{ count: number; isPlayer: boolean }> = ({ count, isPlayer }) => {
  return (
    <div className="flex gap-1 justify-center mt-2 flex-wrap max-w-[200px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border border-slate-300 transition-all duration-300 ${
            i < count
              ? isPlayer 
                ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] border-blue-600" 
                : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] border-rose-600"
              : "bg-slate-100"
          }`}
        />
      ))}
    </div>
  );
};