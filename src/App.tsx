import React, { useEffect, useMemo, useState } from 'react';
import { TASKS } from './data/tasks';
import {
  Task,
  Message,
  AssessmentResult,
  AssessmentMode,
  SkillCategory,
  LocaleCode,
  ScoringProfileId,
  HistorySession,
  Recommendation,
  LocaleCalibrationResponse,
  AuthUser,
} from './types';
import AuthScreen from './components/AuthScreen';
import ChatInterface from './components/ChatInterface';
import AssessmentReport from './components/AssessmentReport';
import {
  evaluateTranscript,
  fetchLocaleCalibration,
  fetchRecommendations,
  fetchSessionHistory,
} from './services/gemini';
import { fetchCurrentUser, signIn, signOut, signUp } from './services/auth';
import { BrainCircuit, Users, Lightbulb, FileText, Loader2 } from 'lucide-react';

type AppState = 'SELECTION' | 'CHAT' | 'EVALUATING' | 'REPORT';

const USER_ID_STORAGE_KEY = 'vantage-user-id-v2';
const AUTH_MODE_STORAGE_KEY = 'vantage-auth-mode-v2';

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getOrCreateUserId() {
  if (typeof window === 'undefined') return 'anonymous';
  const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing) return existing;
  const generated = makeId();
  window.localStorage.setItem(USER_ID_STORAGE_KEY, generated);
  return generated;
}

function localizeTask(task: Task, locale: LocaleCode): Task {
  const localized = task.localized?.[locale];
  if (!localized) return task;
  return {
    ...task,
    title: localized.title || task.title,
    description: localized.description || task.description,
    systemPrompt: localized.systemPrompt || task.systemPrompt,
  };
}

function App() {
  const [appState, setAppState] = useState<AppState>('SELECTION');
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('assessment');
  const [locale, setLocale] = useState<LocaleCode>('en-IN');
  const [scoringProfileId, setScoringProfileId] = useState<ScoringProfileId>('default');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<'guest' | 'signed-out'>('signed-out');
  const [guestUserId] = useState<string>(() => getOrCreateUserId());
  const [sessionId, setSessionId] = useState<string>(() => makeId());
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [calibration, setCalibration] = useState<LocaleCalibrationResponse | null>(null);

  const effectiveUserId = authUser?.id || guestUserId;
  const isAuthenticated = Boolean(authUser);

  const hydrateInsights = async (skill?: SkillCategory) => {
    const [nextHistory, nextRecommendations] = await Promise.all([
      fetchSessionHistory(effectiveUserId, skill),
      fetchRecommendations(effectiveUserId, locale),
    ]);
    setHistory(nextHistory);
    setRecommendations(nextRecommendations);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const mode = window.localStorage.getItem(AUTH_MODE_STORAGE_KEY);
        if (mode === 'guest') {
          setAuthMode('guest');
        }
        const currentUser = await fetchCurrentUser();
        if (currentUser.authenticated && currentUser.user) {
          setAuthUser(currentUser.user);
          setAuthMode('signed-out');
        } else if (mode === 'guest') {
          setAuthUser(null);
        }
        const localeCalibration = await fetchLocaleCalibration(locale);
        setCalibration(localeCalibration);
      } catch (error) {
        console.error('Failed to load user analytics:', error);
      } finally {
        setAuthReady(true);
      }
    };
    load();
  }, [guestUserId, locale]);

  useEffect(() => {
    if (!authReady) return;
    const loadInsights = async () => {
      try {
        await hydrateInsights(assessmentResult?.skill);
      } catch (error) {
        console.error('Failed to refresh insights:', error);
      }
    };
    loadInsights();
  }, [authReady, assessmentResult?.skill, effectiveUserId, locale]);

  const handleStartTask = (task: Task) => {
    setSelectedTask(task);
    setSessionId(makeId());
    setAppState('CHAT');
  };

  const handleChatComplete = async (messages: Message[]) => {
    if (!selectedTask) return;

    setAppState('EVALUATING');
    try {
      const result = await evaluateTranscript(messages, selectedTask, assessmentMode, {
        locale,
        userId: effectiveUserId,
        sessionId,
        scoringProfileId,
      });
      setAssessmentResult(result);
      await hydrateInsights(result.skill);
      setAppState('REPORT');
    } catch (error) {
      console.error('Failed to evaluate transcript:', error);
      alert('Failed to generate assessment. Please try again.');
      setAppState('CHAT');
    }
  };

  const handleReset = () => {
    setAppState('SELECTION');
    setSelectedTask(null);
    setAssessmentResult(null);
    setSessionId(makeId());
  };

  const handleSignIn = async (email: string, password: string) => {
    const response = await signIn(email, password);
    if (!response.user) {
      throw new Error('Could not load your account.');
    }
    setAuthUser(response.user);
    setAuthMode('signed-out');
    window.localStorage.removeItem(AUTH_MODE_STORAGE_KEY);
    setAppState('SELECTION');
    setAssessmentResult(null);
    setSelectedTask(null);
  };

  const handleSignUp = async (displayName: string, email: string, password: string) => {
    const response = await signUp(email, password, displayName);
    if (!response.user) {
      throw new Error('Could not create your account.');
    }
    setAuthUser(response.user);
    setAuthMode('signed-out');
    window.localStorage.removeItem(AUTH_MODE_STORAGE_KEY);
    setAppState('SELECTION');
    setAssessmentResult(null);
    setSelectedTask(null);
  };

  const handleGuest = () => {
    setAuthUser(null);
    setAuthMode('guest');
    window.localStorage.setItem(AUTH_MODE_STORAGE_KEY, 'guest');
    setAppState('SELECTION');
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out cleanly:', error);
    } finally {
      setAuthUser(null);
      setAuthMode('signed-out');
      window.localStorage.removeItem(AUTH_MODE_STORAGE_KEY);
      setAssessmentResult(null);
      setSelectedTask(null);
      setAppState('SELECTION');
      setHistory([]);
      setRecommendations([]);
    }
  };

  const skillHistory = useMemo(() => {
    if (!assessmentResult) return [];
    return history.filter((entry) => entry.skill === assessmentResult.skill).slice(0, 15);
  }, [assessmentResult, history]);

  const dimensionTrends = useMemo(() => {
    if (!assessmentResult) return [];
    const byDimension = new Map<string, Array<{ timestamp: string; score: number | 'NA'; confidence: number }>>();

    for (const session of [...skillHistory].reverse()) {
      for (const [dimension, score] of Object.entries(session.dimensionScores || {})) {
        if (!byDimension.has(dimension)) {
          byDimension.set(dimension, []);
        }
        byDimension.get(dimension)?.push({
          timestamp: session.createdAt,
          score,
          confidence: session.dimensionConfidences?.[dimension] ?? 0,
        });
      }
    }

    return [...byDimension.entries()].map(([dimension, points]) => ({
      dimension,
      points,
    }));
  }, [assessmentResult, skillHistory]);

  const scopedRecommendations = useMemo(() => {
    if (!assessmentResult) return [];
    const taskIdsForSkill = new Set(TASKS.filter((task) => task.skill === assessmentResult.skill).map((task) => task.id));
    return recommendations.filter(
      (recommendation) =>
        !recommendation.recommendedScenarioId || taskIdsForSkill.has(recommendation.recommendedScenarioId)
    );
  }, [assessmentResult, recommendations]);

  const localizedTasks = useMemo(() => TASKS.map((task) => localizeTask(task, locale)), [locale]);
  const currentSessions = useMemo(() => [...history].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), [history]);

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'Collaboration':
        return <Users className="text-theme-accent" />;
      case 'Creativity':
        return <Lightbulb className="text-theme-accent" />;
      case 'Critical Thinking':
        return <FileText className="text-theme-accent" />;
      default:
        return <BrainCircuit className="text-theme-accent" />;
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text-main font-sans selection:bg-theme-accent/20">
      <header className="sticky top-0 z-50 glass-surface border-b border-theme-border/50">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl brand-gradient text-white flex items-center justify-center shadow-[0_12px_24px_rgba(83,66,214,0.3)] transform transition-transform hover:scale-105">
              <BrainCircuit size={20} />
            </div>
            <h1 className="text-xl md:text-2xl font-display font-extrabold tracking-tight text-theme-text-main">
              Vantage<span className="text-theme-primary">.</span>
            </h1>
          </div>
          {authReady && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">Current User</span>
                <span className="text-sm font-semibold text-theme-text-main">
                  {isAuthenticated ? authUser?.displayName || authUser?.email : authMode === 'guest' ? 'Guest Access' : 'Not signed in'}
                </span>
              </div>
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-theme-surface-container-high px-5 py-2 text-sm font-bold text-theme-text-main hover:bg-theme-surface-container-highest transition-colors"
                >
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-20">
        {!authReady ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={40} className="text-theme-accent animate-spin" />
              <p className="label-sm">Initializing System</p>
            </div>
          </div>
        ) : !isAuthenticated && authMode === 'signed-out' ? (
          <AuthScreen onSignIn={handleSignIn} onSignUp={handleSignUp} onGuest={handleGuest} />
        ) : appState === 'SELECTION' && (
          <div className="space-y-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
              <div className="relative">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-theme-primary/5 rounded-full blur-[100px]" />
                <h2 className="display-md relative z-10">
                  Measure Durable Skills with <span className="text-transparent bg-clip-text brand-gradient">Adaptive Evidence.</span>
                </h2>
                <p className="mt-8 text-lg md:text-xl text-theme-text-muted max-w-2xl leading-relaxed">
                  Engage in simulated group tasks with AI teammates. The Executive LLM adapts probes for missing evidence,
                  while the evaluator performs multi-pass scoring with confidence diagnostics.
                </p>
                <div className="mt-10 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-theme-success animate-pulse" />
                  <p className="text-sm font-medium text-theme-text-muted">
                    {isAuthenticated
                      ? `Syncing history for ${authUser?.displayName || authUser?.email}`
                      : 'Guest mode active • Progress stored locally'}
                  </p>
                </div>
              </div>
              
              <div className="bg-theme-surface-container-low rounded-[2rem] p-8 md:p-10 ambient-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 brand-gradient opacity-[0.03] rounded-bl-[100px] transition-opacity group-hover:opacity-[0.07]" />
                <div className="space-y-8 relative z-10 text-left">
                  <div>
                    <label className="label-sm mb-4 block">Simulation Mode</label>
                    <div className="grid grid-cols-2 bg-theme-surface-container-high rounded-2xl p-1.5">
                      <button
                        onClick={() => setAssessmentMode('assessment')}
                        className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
                          assessmentMode === 'assessment'
                            ? 'bg-theme-surface-container-lowest text-theme-text-main shadow-sm'
                            : 'text-theme-text-muted hover:text-theme-text-main'
                        }`}
                      >
                        Assessment
                      </button>
                      <button
                        onClick={() => setAssessmentMode('practice')}
                        className={`px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
                          assessmentMode === 'practice'
                            ? 'bg-theme-surface-container-lowest text-theme-text-main shadow-sm'
                            : 'text-theme-text-muted hover:text-theme-text-main'
                        }`}
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="label-sm mb-3 block">Language</label>
                      <div className="relative">
                        <select
                          value={locale}
                          onChange={(event) => setLocale(event.target.value as LocaleCode)}
                          className="w-full appearance-none rounded-xl px-4 py-3 bg-theme-surface-container-lowest font-semibold text-theme-text-main outline-none ring-1 ring-theme-border/50 focus:ring-2 focus:ring-theme-accent/30 transition-all cursor-pointer"
                        >
                          <option value="en-IN">English (IN)</option>
                          <option value="en-US">English (US)</option>
                          <option value="hi-IN">Hindi (IN)</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-text-muted pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="label-sm mb-3 block">Evaluation</label>
                      <div className="relative">
                        <select
                          value={scoringProfileId}
                          onChange={(event) => setScoringProfileId(event.target.value as ScoringProfileId)}
                          className="w-full appearance-none rounded-xl px-4 py-3 bg-theme-surface-container-lowest font-semibold text-theme-text-main outline-none ring-1 ring-theme-border/50 focus:ring-2 focus:ring-theme-accent/30 transition-all cursor-pointer"
                        >
                          <option value="default">Balanced</option>
                          <option value="strict">Strict</option>
                          <option value="formative">Formative</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-text-muted pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex items-end justify-between px-2">
                <div>
                  <h3 className="headline-lg">Available Scenarios</h3>
                  <p className="text-theme-text-muted mt-2">Select a task to begin your skills assessment.</p>
                </div>
                <div className="hidden md:block">
                  <div className="flex gap-2 p-1 bg-theme-surface-container-low rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-theme-primary" />
                    <div className="w-2 h-2 rounded-full bg-theme-primary/20" />
                    <div className="w-2 h-2 rounded-full bg-theme-primary/20" />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {localizedTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className={`bg-theme-surface-container-lowest rounded-[2rem] p-8 float-shadow hover:translate-y-[-8px] transition-all duration-300 cursor-pointer group border border-theme-border/5 overflow-hidden relative ${
                      idx === 1 ? 'lg:translate-y-6' : ''
                    }`}
                    onClick={() => handleStartTask(task)}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 brand-gradient opacity-0 group-hover:opacity-[0.04] transition-opacity rounded-bl-full" />
                    
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-theme-surface-container-low rounded-2xl flex items-center justify-center group-hover:bg-theme-primary/10 transition-colors">
                        {getSkillIcon(task.skill)}
                      </div>
                      <div>
                        <span className="label-sm opacity-70 block mb-0.5">{task.theme}</span>
                        <h3 className="text-lg font-bold text-theme-text-main">{task.skill}</h3>
                      </div>
                    </div>

                    <h4 className="text-xl font-display font-bold mb-4 text-theme-text-main group-hover:text-theme-primary transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-theme-text-muted leading-relaxed line-clamp-3 mb-10 text-sm">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-theme-surface-container-lowest bg-theme-surface-container-high flex items-center justify-center text-[10px] font-bold text-theme-text-muted">
                            AI
                          </div>
                        ))}
                      </div>
                      <button className="px-6 py-2.5 bg-theme-text-main text-white font-bold rounded-xl group-hover:brand-gradient transition-all text-sm">
                        Launch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-theme-surface-container-low rounded-[2.5rem] p-10 md:p-12 ambient-shadow overflow-hidden relative">
              <div className="absolute bottom-0 right-0 w-64 h-64 brand-gradient opacity-[0.02] blur-[80px]" />
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div>
                    <h3 className="headline-lg">Performance Insights</h3>
                    <p className="text-theme-text-muted mt-2">Historical trends and assessment telemetry.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="label-sm px-4 py-2 bg-theme-surface-container-high rounded-full">
                      {currentSessions.length} Total Sessions
                    </span>
                  </div>
                </div>
                
                {currentSessions.length === 0 ? (
                  <div className="bg-theme-surface-container-lowest rounded-2xl p-10 text-center border border-dashed border-theme-border">
                    <div className="w-16 h-16 bg-theme-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="text-theme-text-muted" />
                    </div>
                    <p className="text-theme-text-muted font-medium">No assessment history found. Begin your first scenario to see insights.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentSessions.slice(0, 6).map((session) => (
                      <div key={session.id} className="bg-theme-surface-container-lowest rounded-2xl p-6 border border-theme-border/30 hover:border-theme-primary/20 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="font-bold text-theme-text-main group-hover:text-theme-primary transition-colors">{session.taskTitle}</div>
                          <div className="text-[10px] font-bold text-theme-text-muted bg-theme-surface-container-low px-2 py-1 rounded-md uppercase">
                            {session.skill}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-theme-text-muted mb-6 font-medium">
                          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                          <span className="w-1 h-1 rounded-full bg-theme-border" />
                          <span className="capitalize">{session.assessmentMode}</span>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-theme-border/20">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-theme-text-muted tracking-wider">Score</span>
                            <span className="text-lg font-display font-extrabold text-theme-text-main">
                              {session.overallScore === 'NA' ? '—' : `L${session.overallScore}`}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold uppercase text-theme-text-muted tracking-wider">Reliability</span>
                            <span className="text-lg font-display font-extrabold text-theme-primary">
                              {Math.round(session.overallConfidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {appState === 'CHAT' && selectedTask && (
          <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-theme-text-main">{selectedTask.title}</h2>
                <p className="text-theme-text-muted">
                  Mode: <span className="font-semibold text-theme-text-main">{assessmentMode}</span> | Locale:{' '}
                  <span className="font-semibold text-theme-text-main">{locale}</span>
                </p>
              </div>
              <button onClick={handleReset} className="text-sm font-medium text-theme-text-muted hover:text-theme-text-main">
                Cancel
              </button>
            </div>
            <ChatInterface
              task={selectedTask}
              assessmentMode={assessmentMode}
              locale={locale}
              userId={effectiveUserId}
              sessionId={sessionId}
              scoringProfileId={scoringProfileId}
              onComplete={handleChatComplete}
            />
          </div>
        )}

        {appState === 'EVALUATING' && (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 animate-in fade-in">
            <div className="w-16 h-16 bg-theme-accent/10 rounded-2xl flex items-center justify-center shadow-[0_16px_40px_rgba(83,66,214,0.24)]">
              <Loader2 size={32} className="text-theme-accent animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-theme-text-main">Analyzing Conversation</h2>
              <p className="text-theme-text-muted max-w-md mx-auto">
                Running turn-level evidence labeling and multi-pass rubric scoring with reliability checks...
              </p>
            </div>
          </div>
        )}

        {appState === 'REPORT' && assessmentResult && (
          <AssessmentReport
            result={assessmentResult}
            skillHistory={skillHistory}
            sessionHistory={currentSessions}
            dimensionTrends={dimensionTrends}
            recommendations={scopedRecommendations}
            localeCalibration={calibration?.selected ?? null}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
