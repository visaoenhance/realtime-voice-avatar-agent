/**
 * Environment Badge - shows whether app is using local or remote Supabase
 */

'use client';

interface EnvironmentBadgeProps {
  env: 'local' | 'remote';
}

export default function EnvironmentBadge({ env }: EnvironmentBadgeProps) {
  const isLocal = env === 'local';
  
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest
        ${isLocal 
          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
          : 'bg-purple-50 text-purple-700 border border-purple-200'
        }
      `}
      title={isLocal ? 'Using local Docker Supabase' : 'Using remote Supabase Cloud'}
    >
      <span className="text-xs">
        {isLocal ? '🏠' : '☁️'}
      </span>
      <span>{isLocal ? 'Local' : 'Remote'}</span>
    </div>
  );
}
