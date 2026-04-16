import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from './components/ui/card';
import { Select } from './components/ui/select';
import {
  evaluateTranscript,
  fetchLocaleCalibration,
  fetchRecommendations,
  fetchSessionHistory,
} from './services/gemini';
import { fetchCurrentUser, signIn, signOut, signUp } from './services/auth';
import { BrainCircuit, Users, Lightbulb, FileText, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';

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
  const appStateRef = useRef<AppState>('SELECTION');
  const sessionIdRef = useRef<string>(sessionId);
  const chatHistorySessionRef = useRef<string | null>(null);

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

  const handleReset = useCallback(() => {
    setAppState('SELECTION');
    setSelectedTask(null);
    setAssessmentResult(null);
    setSessionId(makeId());
  }, []);

  const confirmCancelActiveChat = useCallback(() => {
    if (typeof window === 'undefined') return true;
    if (appStateRef.current !== 'CHAT') return true;
    return window.confirm('You have an active session. Cancel this chat and return to home?');
  }, []);

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

  const handleShowSignIn = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (appStateRef.current !== 'SELECTION') {
      const ok = window.confirm(
        'You will leave the current screen and go to sign in. Unsaved progress in this flow may be lost. Continue?'
      );
      if (!ok) return;
    }
    setAuthUser(null);
    setAuthMode('signed-out');
    window.localStorage.removeItem(AUTH_MODE_STORAGE_KEY);
    setAppState('SELECTION');
    setSelectedTask(null);
    setAssessmentResult(null);
    setSessionId(makeId());
  }, []);

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

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (appStateRef.current !== 'CHAT') return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (appState !== 'CHAT' || !selectedTask) {
      chatHistorySessionRef.current = null;
      return;
    }
    if (chatHistorySessionRef.current === sessionId) return;
    window.history.pushState({ screen: 'chat', sessionId }, '', window.location.href);
    chatHistorySessionRef.current = sessionId;
  }, [appState, selectedTask, sessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      if (appStateRef.current !== 'CHAT') return;
      const shouldCancel = confirmCancelActiveChat();
      if (shouldCancel) {
        handleReset();
        return;
      }
      window.history.pushState({ screen: 'chat', sessionId: sessionIdRef.current }, '', window.location.href);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [confirmCancelActiveChat, handleReset]);

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
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                {isAuthenticated ? authUser?.displayName || authUser?.email : authMode === 'guest' ? 'Guest mode' : 'Not signed in'}
              </Badge>
              {!isAuthenticated && authMode === 'guest' && (
                <Button
                  onClick={handleShowSignIn}
                  variant="ghost"
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/20"
                >
                  Sign in
                </Button>
              )}
              {isAuthenticated && (
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/20"
                >
                  Sign out
                </Button>
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
              {!isAuthenticated && authMode === 'guest' && (
                <div>
                  <Button variant="outline" className="mt-1" onClick={handleShowSignIn}>
                    Sign in or create an account
                  </Button>
                </div>
              )}
              <div className="grid sm:grid-cols-3 gap-3 text-left">
                <Card className="rounded-md shadow-none">
                  <CardContent className="p-3">
                    <label className="text-xs uppercase tracking-wide text-theme-text-muted">Mode</label>
                    <div className="inline-flex bg-theme-bg border border-theme-border rounded-md p-1 mt-2 w-full">
                      <Button
                      onClick={() => setAssessmentMode('assessment')}
                      variant="ghost"
                      className={cn(
                        'h-auto px-2 py-1.5 text-sm rounded flex-1 hover:bg-transparent',
                        assessmentMode === 'assessment' ? 'bg-theme-accent text-white hover:bg-theme-accent' : 'text-theme-text-muted'
                      )}
                    >
                      Assessment
                      </Button>
                      <Button
                      onClick={() => setAssessmentMode('practice')}
                      variant="ghost"
                      className={cn(
                        'h-auto px-2 py-1.5 text-sm rounded flex-1 hover:bg-transparent',
                        assessmentMode === 'practice' ? 'bg-theme-accent text-white hover:bg-theme-accent' : 'text-theme-text-muted'
                      )}
                    >
                      Practice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-md shadow-none">
                  <CardContent className="p-3">
                    <label className="text-xs uppercase tracking-wide text-theme-text-muted">Locale</label>
                    <Select value={locale} onChange={(event) => setLocale(event.target.value as LocaleCode)} className="mt-2">
                      <option value="en-IN">English (India)</option>
                      <option value="en-US">English (US)</option>
                      <option value="hi-IN">Hindi (India)</option>
                    </Select>
                  </CardContent>
                </Card>
                <Card className="rounded-md shadow-none">
                  <CardContent className="p-3">
                    <label className="text-xs uppercase tracking-wide text-theme-text-muted">Scoring Profile</label>
                    <Select
                      value={scoringProfileId}
                      onChange={(event) => setScoringProfileId(event.target.value as ScoringProfileId)}
                      className="mt-2"
                    >
                      <option value="default">Balanced</option>
                      <option value="strict">Strict</option>
                      <option value="formative">Formative</option>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {localizedTasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-5 hover:border-theme-accent transition-all flex flex-col h-full cursor-pointer group"
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

                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-theme-accent group-hover:text-white group-hover:border-theme-accent"
                  >
                    Start Scenario
                  </Button>
                </Card>
              ))}
            </div>

            <Card className="rounded-xl p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <CardTitle>Recent Sessions</CardTitle>
                  <CardDescription>Your latest assessment runs and confidence levels.</CardDescription>
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
                    <Card key={session.id} className="rounded-xl bg-theme-bg p-4 text-sm shadow-none">
                      <div className="font-semibold text-theme-text-main">{session.taskTitle}</div>
                      <div className="text-xs text-theme-text-muted mt-1">
                        {session.createdAt.slice(0, 10)} | {session.assessmentMode} | {session.skill}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-white">
                          {session.overallScore === 'NA' ? 'No evidence' : `Score ${session.overallScore}`}
                        </Badge>
                        <Badge variant="secondary" className="bg-white">
                          {Math.round(session.overallConfidence * 100)}% confidence
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
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
              <Button
                onClick={() => {
                  if (confirmCancelActiveChat()) {
                    handleReset();
                  }
                }}
                variant="ghost"
                className="text-sm font-medium"
              >
                Cancel
              </Button>
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
