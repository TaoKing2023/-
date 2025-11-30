
import React, { useState, useEffect } from 'react';
import { ActionType, ACTION_DETAILS, GameMode, Faction } from '../types';
import { Zap, Shield, Hand, Flame, ShieldAlert, Cloud, Sword } from 'lucide-react';

interface ControlsProps {
  energy: number;
  onAction: (action: ActionType) => void;
  disabled: boolean;
  gameMode: GameMode;
  highlightAction?: ActionType | null;
}

// Emoji Icon Wrappers
const IconMeteor = ({ className }: { className?: string }) => <span className={`${className} flex items-center justify-center text-lg leading-none`} role="img" aria-label="meteor">☄️</span>;
const IconIce = ({ className }: { className?: string }) => <span className={`${className} flex items-center justify-center text-lg leading-none`} role="img" aria-label="ice">🧊</span>;
const IconTaiji = ({ className }: { className?: string }) => <span className={`${className} flex items-center justify-center text-lg leading-none`} role="img" aria-label="taiji">☯️</span>;

export const Controls: React.FC<ControlsProps> = ({ energy, onAction, disabled, gameMode, highlightAction }) => {
  const [activeTab, setActiveTab] = useState<Faction>(Faction.PEGASUS);

  // Auto-switch tab if the highlighted action belongs to a specific faction
  useEffect(() => {
    if (highlightAction) {
      const details = ACTION_DETAILS[highlightAction];
      if (details?.faction) {
        setActiveTab(details.faction);
      }
    }
  }, [highlightAction]);

  const getIcon = (action: ActionType) => {
      if (action.includes('PEGASUS')) return action.includes('DEF') ? Shield : IconMeteor;
      if (action.includes('ICE')) return action.includes('DEF') ? Shield : IconIce;
      if (action.includes('COTTON')) return action.includes('DEF') ? Shield : IconTaiji;
      return Zap; // Fallback
  };

  const renderButton = (action: ActionType, IconOverride?: React.ElementType, colorOverride?: string) => {
    const details = ACTION_DETAILS[action];
    const canAfford = energy >= details.minEnergy;
    
    // In Tutorial mode with highlight, strictly enforce availability
    const isHighlighted = highlightAction === action;
    const isLocked = highlightAction ? !isHighlighted : !canAfford;
    const isDimmed = highlightAction && !isHighlighted;

    let colorStyle = 'text-gray-500 border-gray-200';
    
    // Auto color based on faction or specific override
    if (colorOverride) {
        // use override
    } else if (details.faction === Faction.PEGASUS) colorOverride = 'text-amber-500 border-amber-200 hover:bg-amber-50';
    else if (details.faction === Faction.ICE) colorOverride = 'text-cyan-500 border-cyan-200 hover:bg-cyan-50';
    else if (details.faction === Faction.COTTON) colorOverride = 'text-pink-500 border-pink-200 hover:bg-pink-50';
    else if (action === ActionType.CHARGE) colorOverride = 'text-blue-500 border-blue-500 hover:bg-blue-50';
    else if (action === ActionType.DEFEND) colorOverride = 'text-blue-500 border-blue-200 hover:bg-blue-50';
    
    const Icon = IconOverride || getIcon(action);

    return (
      <button
        key={action}
        onClick={() => onAction(action)}
        disabled={disabled || isLocked}
        className={`
          w-full relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-300 shadow-sm min-h-[70px]
          ${isLocked 
            ? 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed text-slate-400' 
            : `${colorOverride || colorStyle} bg-white hover:scale-105 active:scale-95 cursor-pointer shadow-md`
          }
          ${isHighlighted ? 'ring-4 ring-offset-2 ring-yellow-400 scale-105 z-20 animate-pulse border-yellow-400' : ''}
          ${isDimmed ? 'opacity-20 blur-[1px]' : ''}
        `}
      >
        <Icon className={`w-5 h-5 mb-1 ${isLocked ? 'grayscale opacity-50' : ''}`} />
        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider arcade-font ${isLocked ? 'text-slate-400' : 'text-slate-700'}`}>{details.label}</span>
        <span className="text-[9px] text-slate-400">
            {details.cost > 0 ? `-${details.cost}气` : (details.minEnergy > 0 ? `需${details.minEnergy}` : '0气')}
        </span>
        
        {isHighlighted && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce whitespace-nowrap z-30">
            点击这里!
          </span>
        )}
      </button>
    );
  };

  // --- CLASSIC / CLASSIC TUTORIAL LAYOUT ---
  if (gameMode === GameMode.CLASSIC || gameMode === GameMode.TUTORIAL) {
    return (
        <div className="grid grid-cols-5 gap-2 w-full max-w-2xl mx-auto px-4 pb-8">
        {renderButton(ActionType.CHARGE, Hand)}
        {renderButton(ActionType.DEFEND, Shield)}
        {renderButton(ActionType.ATTACK_SMALL, Zap, 'text-cyan-500 border-cyan-200 hover:bg-cyan-50')}
        {renderButton(ActionType.MAGIC_DEFEND, ShieldAlert, 'text-purple-500 border-purple-200 hover:bg-purple-50')}
        {renderButton(ActionType.ATTACK_BIG, Flame, 'text-red-500 border-red-200 hover:bg-red-50')}
        </div>
    );
  }

  // --- TRI-PHASE / TRI-PHASE TUTORIAL LAYOUT ---
  
  // Define Tab Content
  const renderTabContent = () => {
      let actions: ActionType[] = [];
      if (activeTab === Faction.PEGASUS) {
          // Defense moved to top row
          actions = [ActionType.PEGASUS_ATK_T1, ActionType.PEGASUS_ATK_T2, ActionType.PEGASUS_ULT];
      } else if (activeTab === Faction.ICE) {
          actions = [ActionType.ICE_ATK_T1, ActionType.ICE_ATK_T2, ActionType.ICE_ULT];
      } else {
          actions = [ActionType.COTTON_ATK_T1, ActionType.COTTON_ATK_T2, ActionType.COTTON_ULT];
      }

      return (
          <div className="grid grid-cols-3 gap-2 mt-3 animate-in fade-in duration-300">
              {actions.map(a => renderButton(a))}
          </div>
      );
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-6">
        
        {/* Top Row: Charge + Faction Defense (50% each) */}
        <div className="flex gap-3 mb-4 justify-center">
            <div className="flex-1">
                {renderButton(ActionType.CHARGE, Hand)}
            </div>
            <div className="flex-1">
                {activeTab === Faction.PEGASUS && renderButton(ActionType.PEGASUS_DEF_ELE)}
                {activeTab === Faction.ICE && renderButton(ActionType.ICE_DEF_ELE)}
                {activeTab === Faction.COTTON && renderButton(ActionType.COTTON_DEF_ELE)}
            </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex relative">
             <button 
                onClick={() => setActiveTab(Faction.PEGASUS)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${activeTab === Faction.PEGASUS ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                 <IconMeteor className="w-4 h-4" /> 天马
             </button>
             <button 
                onClick={() => setActiveTab(Faction.ICE)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${activeTab === Faction.ICE ? 'bg-white text-cyan-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                 <IconIce className="w-4 h-4" /> 寒冰
             </button>
             <button 
                onClick={() => setActiveTab(Faction.COTTON)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${activeTab === Faction.COTTON ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                 <IconTaiji className="w-4 h-4" /> 绵柔
             </button>
        </div>

        {/* Tab Content Area */}
        <div className="bg-slate-50/50 rounded-xl mt-1 min-h-[90px]">
            {renderTabContent()}
        </div>
        
    </div>
  );
};