import { motion } from 'framer-motion';
import type { Agent } from '../../types';
import agentProfiles from '../../data/agentProfiles.json';

// id → profile image url, sourced from the agent profile manifest.
const PROFILE_IMAGE: Record<string, string> = Object.fromEntries(
  agentProfiles.map(p => [p.id, p.image]),
);

interface AgentAvatarProps {
  agent: Agent;
  isActive?: boolean;
  className?: string; // sizing override; defaults to the in-arena size
}

export function AgentAvatar({ agent, isActive = false, className }: AgentAvatarProps) {
  const src = PROFILE_IMAGE[agent.id];

  return (
    <div className={`relative shrink-0 ${className ?? 'w-7 h-7 lg:w-11 lg:h-11'}`}>
      {isActive && (
        <motion.div
          className="absolute inset-[-15%] rounded-full -z-10"
          style={{ background: `radial-gradient(circle, ${agent.color}66 0%, transparent 70%)` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {src ? (
        <img
          src={src}
          alt={agent.name}
          className="w-full h-full object-contain select-none"
          draggable={false}
          style={{ filter: isActive ? `drop-shadow(0 0 6px ${agent.color}aa)` : undefined }}
        />
      ) : (
        // Slug outside the branded roster — initials on the agent colour.
        <div
          className="w-full h-full rounded-full flex items-center justify-center font-display font-bold text-ivory select-none"
          style={{ background: agent.color, fontSize: '45%' }}
        >
          {agent.name.replace(/^Agent\s+/i, '').slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}
