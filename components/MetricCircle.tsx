
import React, { useState, useEffect } from 'react';
import { AuditMetric } from '../types';

interface Props {
  metric: AuditMetric;
}

const MetricCircle: React.FC<Props> = ({ metric }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    setIsVisible(true);
    let start = 0;
    const end = metric.score;
    if (start === end) {
      setDisplayScore(end);
      return;
    }
    const duration = 1500;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [metric.score]);

  const getColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-emerald-500 stroke-emerald-500';
      case 'average': return 'text-amber-500 stroke-amber-500';
      case 'poor': return 'text-rose-500 stroke-rose-500';
      default: return 'text-slate-400 stroke-slate-400';
    }
  };

  const getBgColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-emerald-50/50 dark:bg-emerald-950/20';
      case 'average': return 'bg-amber-50/50 dark:bg-amber-950/20';
      case 'poor': return 'bg-rose-50/50 dark:bg-rose-950/20';
      default: return 'bg-slate-50/50 dark:bg-slate-900/50';
    }
  };

  const getRingColor = (status: string) => {
    switch (status) {
      case 'good': return 'ring-emerald-100 dark:ring-emerald-900/30';
      case 'average': return 'ring-amber-100 dark:ring-amber-900/30';
      case 'poor': return 'ring-rose-100 dark:ring-rose-900/30';
      default: return 'ring-slate-100 dark:ring-slate-800';
    }
  };

  return (
    <div 
      className={`
        flex flex-col items-center p-6 rounded-3xl border border-slate-100 dark:border-slate-800
        transition-all duration-700 ease-out transform
        ${getBgColor(metric.status)}
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}
        hover:shadow-xl hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-900 ring-1 ring-transparent hover:ring-opacity-100 ${getRingColor(metric.status)}
      `}
    >
      <div className="relative w-32 h-32 mb-4 group">
        <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-30 dark:group-hover:opacity-40 transition-opacity duration-500 ${getColor(metric.status)} bg-current`} />
        
        <svg className="w-full h-full transform -rotate-90 relative z-10">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-200/50 dark:text-slate-800"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-150 ease-linear ${getColor(metric.status)}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className={`text-4xl font-black tracking-tighter ${getColor(metric.status)} transition-all duration-300`}>
            {displayScore}
          </span>
        </div>
      </div>
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{metric.label}</h3>
      <div className={`h-1 rounded-full mb-3 transition-all duration-1000 ${isVisible ? 'w-12' : 'w-0'} ${getColor(metric.status).replace('text-', 'bg-').replace('stroke-', 'bg-')}`} />
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center font-medium leading-relaxed">{metric.description}</p>
    </div>
  );
};

export default MetricCircle;