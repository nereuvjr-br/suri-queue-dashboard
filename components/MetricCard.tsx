import React from 'react';

/**
 * @interface MetricCardProps
 * Propriedades para o componente MetricCard.
 */
interface MetricCardProps {
  /** O título principal do card, exibido no topo. */
  title: string;
  /** O valor da métrica a ser exibido em destaque. */
  value: string | number;
  /** Um subtítulo ou informação adicional, exibido na parte inferior. */
  subtitle?: string;
  /** Um ícone opcional a ser exibido como marca d'água no fundo. */
  icon?: React.ReactNode;
  /** O esquema de cores do card. */
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'indigo';
}

/**
 * @component MetricCard
 * Um componente de card reutilizável para exibir uma única métrica de forma destacada.
 * Ele inclui um título, um valor principal, um subtítulo opcional e um ícone de fundo.
 *
 * @param {MetricCardProps} props - As propriedades para configurar o card.
 * @returns Um card de métrica estilizado.
 */
const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color = 'blue' }) => {

  /**
   * Retorna as classes CSS correspondentes ao esquema de cores selecionado.
   * @returns {string} Uma string de classes de Tailwind CSS.
   */
  const getColorClasses = () => {
    switch (color) {
      case 'red': return 'text-rose-400 from-rose-500/20 to-rose-900/20 border-rose-500/30';
      case 'green': return 'text-emerald-400 from-emerald-500/20 to-emerald-900/20 border-emerald-500/30';
      case 'yellow': return 'text-amber-400 from-amber-500/20 to-amber-900/20 border-amber-500/30';
      default: return 'text-indigo-400 from-indigo-500/20 to-indigo-900/20 border-indigo-500/30';
    }
  };

  return (
    <div className={`glass-card relative overflow-hidden rounded-3xl p-6 border bg-gradient-to-br ${getColorClasses()} flex flex-col justify-between h-40 group`}>

      {/* Ícone de Marca D'água */}
      <div className="absolute -right-6 -bottom-6 opacity-10 scale-150 transition-transform group-hover:scale-125 group-hover:opacity-20 text-current">
        {icon}
      </div>

      <div className="z-10">
        <h3 className="text-gray-300 font-medium text-lg uppercase tracking-wide">{title}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-5xl font-bold text-white tracking-tight shadow-black drop-shadow-lg">
            {value}
          </span>
        </div>
      </div>

      {subtitle && (
        <div className="z-10 mt-auto">
          <span className="text-sm font-medium opacity-80 bg-black/20 px-3 py-1 rounded-full border border-white/5">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
