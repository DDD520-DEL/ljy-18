import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { useGiftStore } from '@/store/useGiftStore';

interface OnboardingStep {
  targetSelector: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    targetSelector: '[data-testid="onboarding-home"]',
    title: '首页总览',
    description: '查看近期记录、回礼提醒和统计概览，快速掌握账本动态',
    placement: 'top',
  },
  {
    targetSelector: '[data-testid="onboarding-record"]',
    title: '记录每笔往来',
    description: '点击中间的 + 按钮快速记账，也可以在这里查看所有收支记录',
    placement: 'top',
  },
  {
    targetSelector: '[data-testid="onboarding-contacts"]',
    title: '联系人管理',
    description: '管理往来联系人，查看每个人的收支明细和回礼建议',
    placement: 'top',
  },
];

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function OnboardingGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const preferences = useGiftStore(state => state.preferences);
  const updatePreferences = useGiftStore(state => state.updatePreferences);

  const markCompleted = useCallback(() => {
    setIsVisible(false);
    updatePreferences({ onboardingCompleted: true });
  }, [updatePreferences]);

  const skipGuide = useCallback(() => {
    markCompleted();
  }, [markCompleted]);

  const nextStep = useCallback(() => {
    if (currentStep >= ONBOARDING_STEPS.length - 1) {
      markCompleted();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, markCompleted]);

  const updateHighlightRect = useCallback(() => {
    const step = ONBOARDING_STEPS[currentStep];
    if (!step) return;

    const target = document.querySelector(step.targetSelector) as HTMLElement | null;
    if (target) {
      const rect = target.getBoundingClientRect();
      const padding = 8;
      setHighlightRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    } else {
      setHighlightRect({
        top: window.innerHeight - 100,
        left: window.innerWidth / 2 - 40,
        width: 80,
        height: 60,
      });
    }
  }, [currentStep]);

  useEffect(() => {
    if (preferences.onboardingCompleted) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [preferences.onboardingCompleted]);

  useEffect(() => {
    if (!isVisible) return;

    updateHighlightRect();

    const handleResize = () => updateHighlightRect();
    window.addEventListener('resize', handleResize);

    const interval = setInterval(updateHighlightRect, 200);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, [isVisible, updateHighlightRect]);

  if (!isVisible || preferences.onboardingCompleted) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const tooltipTop = highlightRect
    ? step.placement === 'top'
      ? Math.max(16, highlightRect.top - 140)
      : highlightRect.top + highlightRect.height + 16
    : 100;

  const tooltipLeft = highlightRect
    ? Math.min(
        Math.max(16, highlightRect.left + highlightRect.width / 2 - 160),
        window.innerWidth - 336
      )
    : 16;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] animate-fade-in"
      style={{ pointerEvents: 'none' }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'auto' }}
      >
        <defs>
          <mask id="onboarding-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left}
                y={highlightRect.top}
                width={highlightRect.width}
                height={highlightRect.height}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#onboarding-mask)"
        />
      </svg>

      {highlightRect && (
        <div
          className="absolute rounded-xl border-2 border-primary-400 pointer-events-none animate-pulse"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.25)',
          }}
        />
      )}

      <div
        className="absolute bg-white dark:bg-ink-800 rounded-2xl shadow-2xl p-5 w-80 pointer-events-auto"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
        }}
      >
        <button
          onClick={skipGuide}
          className="absolute top-3 right-3 p-1 text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300 transition-colors rounded-lg hover:bg-cream-100 dark:hover:bg-ink-700"
          aria-label="跳过引导"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-semibold">
            {currentStep + 1}
          </span>
          <h3 className="text-base font-bold text-ink-900 dark:text-ink-50">
            {step.title}
          </h3>
        </div>

        <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed mb-5 pr-6">
          {step.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {ONBOARDING_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-primary-500'
                    : 'w-1.5 bg-cream-300 dark:bg-ink-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={skipGuide}
              className="px-3 py-1.5 text-sm font-medium text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors"
            >
              跳过
            </button>
            <button
              onClick={nextStep}
              className="flex items-center gap-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-primary-500/25"
            >
              {isLastStep ? '完成' : '下一步'}
              {!isLastStep && <ChevronRight size={16} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
