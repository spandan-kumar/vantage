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
      <header className="bg-theme-primary text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrainCircuit size={20} />
            <h1 className="text-xl font-bold tracking-tight">Vantage Skills Assessment</h1>
          </div>
          {authReady && (
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-full bg-white/10 px-3 py-1">
                {isAuthenticated ? authUser?.displayName || authUser?.email : authMode === 'guest' ? 'Guest mode' : 'Not signed in'}
              </span>
              {isAuthenticated && (
                <button onClick={handleLogout} className="rounded-full bg-white/10 px-3 py-1 font-medium hover:bg-white/20">
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!authReady ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <Loader2 size={32} className="text-theme-accent animate-spin" />
          </div>
        ) : !isAuthenticated && authMode === 'signed-out' ? (
          <AuthScreen onSignIn={handleSignIn} onSignUp={handleSignUp} onGuest={handleGuest} />
        ) : appState === 'SELECTION' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-4xl font-extrabold tracking-tight text-theme-text-main">Measure Your Durable Skills</h2>
              <p className="text-lg text-theme-text-muted">
                Engage in simulated group tasks with AI teammates. The Executive LLM adapts probes for missing evidence,
                while the evaluator performs multi-pass scoring with confidence and reliability diagnostics.
              </p>
              <p className="text-sm text-theme-text-muted">
                {isAuthenticated
                  ? `Signed in as ${authUser?.displayName || authUser?.email}. Your session history is stored on the server.`
                  : 'You are in guest mode. Sign in to keep your session history across devices.'}
              </p>
              <div className="grid sm:grid-cols-3 gap-3 text-left">
                <div className="bg-theme-surface border border-theme-border rounded-md p-3">
                  <label className="text-xs uppercase tracking-wide text-theme-text-muted">Mode</label>
                  <div className="inline-flex bg-theme-bg border border-theme-border rounded-md p-1 mt-2 w-full">
                    <button
                      onClick={() => setAssessmentMode('assessment')}
                      className={`px-2 py-1.5 text-sm rounded flex-1 ${assessmentMode === 'assessment' ? 'bg-theme-accent text-white' : 'text-theme-text-muted'}`}
                    >
                      Assessment
                    </button>
                    <button
                      onClick={() => setAssessmentMode('practice')}
                      className={`px-2 py-1.5 text-sm rounded flex-1 ${assessmentMode === 'practice' ? 'bg-theme-accent text-white' : 'text-theme-text-muted'}`}
                    >
                      Practice
                    </button>
                  </div>
                </div>
                <div className="bg-theme-surface border border-theme-border rounded-md p-3">
                  <label className="text-xs uppercase tracking-wide text-theme-text-muted">Locale</label>
                  <select
                    value={locale}
                    onChange={(event) => setLocale(event.target.value as LocaleCode)}
                    className="mt-2 w-full border border-theme-border rounded-md px-2 py-2 bg-theme-bg"
                  >
                    <option value="en-IN">English (India)</option>
                    <option value="en-US">English (US)</option>
                    <option value="hi-IN">Hindi (India)</option>
                  </select>
                </div>
                <div className="bg-theme-surface border border-theme-border rounded-md p-3">
                  <label className="text-xs uppercase tracking-wide text-theme-text-muted">Scoring Profile</label>
                  <select
                    value={scoringProfileId}
                    onChange={(event) => setScoringProfileId(event.target.value as ScoringProfileId)}
                    className="mt-2 w-full border border-theme-border rounded-md px-2 py-2 bg-theme-bg"
                  >
                    <option value="default">Balanced</option>
                    <option value="strict">Strict</option>
                    <option value="formative">Formative</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {localizedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-theme-surface rounded-lg p-5 shadow-sm border border-theme-border hover:border-theme-accent transition-all flex flex-col h-full cursor-pointer group"
                  onClick={() => handleStartTask(task)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-theme-bg rounded-lg group-hover:bg-theme-accent/10 transition-colors">
                      {getSkillIcon(task.skill)}
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-theme-text-muted">{task.theme}</span>
                      <h3 className="font-bold text-theme-text-main leading-tight">{task.skill}</h3>
                    </div>
                  </div>

                  <h4 className="text-lg font-semibold mb-2 text-theme-text-main">{task.title}</h4>
                  <p className="text-sm text-theme-text-muted flex-1 line-clamp-3 mb-6">{task.description}</p>

                  <button className="w-full py-2.5 bg-transparent border border-theme-border text-theme-text-main font-semibold rounded-md group-hover:bg-theme-accent group-hover:text-white group-hover:border-theme-accent transition-colors">
                    Start Scenario
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-theme-surface border border-theme-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-theme-text-main">Recent Sessions</h3>
                  <p className="text-sm text-theme-text-muted">Your latest assessment runs and confidence levels.</p>
                </div>
                <span className="text-xs uppercase tracking-widest text-theme-text-muted">
                  {currentSessions.length} total
                </span>
              </div>
              {currentSessions.length === 0 ? (
                <p className="text-sm text-theme-text-muted">No sessions yet. Start a scenario to create your first record.</p>
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {currentSessions.slice(0, 6).map((session) => (
                    <div key={session.id} className="rounded-xl border border-theme-border bg-theme-bg p-4 text-sm">
                      <div className="font-semibold text-theme-text-main">{session.taskTitle}</div>
                      <div className="text-xs text-theme-text-muted mt-1">
                        {session.createdAt.slice(0, 10)} | {session.assessmentMode} | {session.skill}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-2 py-1 text-xs text-theme-text-main border border-theme-border">
                          {session.overallScore === 'NA' ? 'No evidence' : `Score ${session.overallScore}`}
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 text-xs text-theme-text-main border border-theme-border">
                          {Math.round(session.overallConfidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {appState === 'CHAT' && selectedTask && (
          <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-theme-text-main">{selectedTask.title}</h2>
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
            <div className="w-16 h-16 bg-theme-accent/10 rounded-2xl flex items-center justify-center">
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
