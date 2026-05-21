import { Target, Search, Database, Network, ShieldAlert, Users, Scale } from 'lucide-react';

export const ACHIEVEMENTS_DEF = [
  { 
    id: 'first_blood', 
    title: 'First Action Taken', 
    description: 'Began operatiional activity within the platform.', 
    icon: Target,
    color: 'text-red-500',
    bg: 'bg-red-500/10'
  },
  { 
    id: 'actions_5', 
    title: '5 Actions Completed', 
    description: 'Completed 5 operational actions.', 
    icon: Search,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  { 
    id: 'exploration_master', 
    title: 'Exploration Master', 
    description: 'Viewed 5 different targets.', 
    icon: Database,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  { 
    id: 'graph_weaver', 
    title: 'Graph Weaver', 
    description: 'Bootstrapped telemetry or correlated an entity graph.', 
    icon: Network,
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  },
  { 
    id: 'threat_hunter', 
    title: 'Threat Hunter', 
    description: 'Generated a Threat Assessment mapping TTPs.', 
    icon: ShieldAlert,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  { 
    id: 'persona_mimic', 
    title: 'Persona Mimic', 
    description: 'Created an AI Persona for operations.', 
    icon: Users,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10'
  },
  { 
    id: 'ethics_champion', 
    title: 'Ethics Champion', 
    description: 'Ran an Ethical Risk Assessment.', 
    icon: Scale,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10'
  }
];
