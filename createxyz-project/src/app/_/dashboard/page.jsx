"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [dashboardData, setDashboardData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // AI Career Guidance Chat State
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI Career Advisor. How can I help you with your career goals and scholarship search today?",
    },
  ]);
  const [currentMessage, setCurrentMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamingMessage, setStreamingMessage] = React.useState("");

  // Career Goal Form State
  const [showGoalForm, setShowGoalForm] = React.useState(false);
  const [goalForm, setGoalForm] = React.useState({
    goal_title: "",
    goal_description: "",
    target_field: "",
    target_country: "",
    target_degree_level: "",
    target_completion_date: "",
  });

  const handleFinish = React.useCallback((message) => {
    setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    setStreamingMessage("");
    setIsLoading(false);
  }, []);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  // Fetch dashboard data for authenticated users
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/dashboard/get-user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setDashboardData(data);
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchDashboardData();
    }
  }, [user, userLoading]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = { role: "user", content: currentMessage };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an AI Career Advisor for FuturePathAI. Help users with career guidance, scholarship recommendations, and educational planning. Be encouraging and provide specific, actionable advice.`,
            },
            ...updatedMessages,
          ],
          stream: true,
        }),
      });

      handleStreamResponse(response);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (scholarshipId) => {
    try {
      const response = await fetch("/api/dashboard/remove-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarship_id: scholarshipId }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Refresh dashboard data
      setDashboardData((prev) => ({
        ...prev,
        favorites: prev.favorites.filter(
          (fav) => fav.scholarship_id !== scholarshipId
        ),
      }));
    } catch (err) {
      console.error("Remove favorite error:", err);
      setError("Failed to remove favorite");
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/dashboard/create-career-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalForm),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Refresh dashboard data
      setDashboardData((prev) => ({
        ...prev,
        careerGoals: [data.goal, ...prev.careerGoals],
      }));

      setShowGoalForm(false);
      setGoalForm({
        goal_title: "",
        goal_description: "",
        target_field: "",
        target_country: "",
        target_degree_level: "",
        target_completion_date: "",
      });
    } catch (err) {
      console.error("Create goal error:", err);
      setError("Failed to create career goal");
    }
  };

  const handleUpdateGoalProgress = async (goalId, progress, status) => {
    try {
      const response = await fetch("/api/dashboard/update-career-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_id: goalId,
          progress_percentage: progress,
          current_status: status,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update local state
      setDashboardData((prev) => ({
        ...prev,
        careerGoals: prev.careerGoals.map((goal) =>
          goal.id === goalId ? { ...goal, ...data.goal } : goal
        ),
      }));
    } catch (err) {
      console.error("Update goal error:", err);
      setError("Failed to update goal progress");
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="fas fa-graduation-cap text-white text-2xl animate-pulse"></i>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Non-authenticated user view
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-inter">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-graduation-cap text-white text-lg"></i>
                </div>
                <div>
                  <a
                    href="/"
                    className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                  >
                    FuturePathAI
                  </a>
                  <p className="text-xs text-gray-500 font-medium -mt-1">
                    AI-Powered Education
                  </p>
                </div>
              </div>
              <div className="flex space-x-4">
                <a
                  href="/account/signin"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </a>
                <a
                  href="/account/signup"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Sign Up
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section for Non-Authenticated Users */}
        <div className="relative py-20 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <div className="flex items-center space-x-4 bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border border-white/20">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-graduation-cap text-white text-2xl"></i>
                  </div>
                  <div className="text-left">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      FuturePathAI
                    </h1>
                    <p className="text-gray-600 font-medium">
                      AI-Powered Education Platform
                    </p>
                  </div>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Your Personal Dashboard Awaits
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto font-light">
                Sign in to access your personalized scholarship recommendations,
                track your career goals, and get AI-powered guidance for your
                educational journey.
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <i className="fas fa-heart text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Save Favorite Scholarships
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Keep track of scholarships you're interested in and never
                    miss an application deadline.
                  </p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <i className="fas fa-target text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Track Career Goals
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Set and monitor your educational and career objectives with
                    progress tracking.
                  </p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <i className="fas fa-robot text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    AI Career Guidance
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Get personalized advice and recommendations from our AI
                    career advisor.
                  </p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <i className="fas fa-chart-line text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Progress Analytics
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Visualize your journey with detailed progress reports and
                    insights.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <a
                  href="/account/signup"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Create Your Account
                </a>
                <a
                  href="/account/signin"
                  className="border-2 border-blue-600 text-blue-600 px-10 py-4 rounded-full text-lg font-semibold hover:bg-blue-50 transition-all duration-200 backdrop-blur-sm bg-white/50"
                >
                  Sign In
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-inter">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img
                  src="/BlackModernEducationLogo.png"
                  alt="FuturePathAI Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <a
                  href="/"
                  className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                >
                  FuturePathAI
                </a>
                <p className="text-xs text-gray-500 font-medium -mt-1">
                  AI-Powered Education
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">
                Welcome, {user.name || user.email}
              </span>
              <a
                href="/account/logout"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </nav>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4 shadow-lg">
            <div className="flex">
              <i className="fas fa-exclamation-circle text-red-400 mr-2 mt-0.5"></i>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Dashboard
          </h1>
          <p className="text-gray-600 font-light">
            Track your progress, manage favorites, and get AI-powered career
            guidance.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-heart text-white text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.favorites?.length || 0}
                </p>
                <p className="text-gray-600 text-sm font-medium">
                  Saved Scholarships
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-target text-white text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.careerGoals?.length || 0}
                </p>
                <p className="text-gray-600 text-sm font-medium">
                  Career Goals
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-chart-line text-white text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.careerGoals?.length > 0
                    ? Math.round(
                        dashboardData.careerGoals.reduce(
                          (sum, goal) => sum + (goal.progress_percentage || 0),
                          0
                        ) / dashboardData.careerGoals.length
                      )
                    : 0}
                  %
                </p>
                <p className="text-gray-600 text-sm font-medium">
                  Avg Progress
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-calendar text-white text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.favorites?.filter((fav) => {
                    if (!fav.scholarship_deadline) return false;
                    const deadline = new Date(fav.scholarship_deadline);
                    const now = new Date();
                    const diffTime = deadline - now;
                    const diffDays = Math.ceil(
                      diffTime / (1000 * 60 * 60 * 24)
                    );
                    return diffDays <= 30 && diffDays > 0;
                  }).length || 0}
                </p>
                <p className="text-gray-600 text-sm font-medium">Due Soon</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Career Goals Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Career Goals
                  </h2>
                  <button
                    onClick={() => setShowGoalForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Goal
                  </button>
                </div>
              </div>

              <div className="p-6">
                {dashboardData?.careerGoals?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.careerGoals.map((goal) => (
                      <div
                        key={goal.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {goal.goal_title}
                            </h3>
                            {goal.goal_description && (
                              <p className="text-gray-600 text-sm mb-2">
                                {goal.goal_description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {goal.target_field && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {goal.target_field}
                                </span>
                              )}
                              {goal.target_country && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {goal.target_country}
                                </span>
                              )}
                              {goal.target_degree_level && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  {goal.target_degree_level}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {goal.progress_percentage || 0}%
                            </div>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${goal.progress_percentage || 0}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <select
                              value={goal.current_status || "planning"}
                              onChange={(e) =>
                                handleUpdateGoalProgress(
                                  goal.id,
                                  goal.progress_percentage,
                                  e.target.value
                                )
                              }
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="planning">Planning</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="on_hold">On Hold</option>
                            </select>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={goal.progress_percentage || 0}
                              onChange={(e) =>
                                handleUpdateGoalProgress(
                                  goal.id,
                                  parseInt(e.target.value),
                                  goal.current_status
                                )
                              }
                              className="w-24"
                            />
                          </div>
                          {goal.target_completion_date && (
                            <div className="text-xs text-gray-500">
                              Target:{" "}
                              {new Date(
                                goal.target_completion_date
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-target text-gray-300 text-4xl mb-4"></i>
                    <p className="text-gray-500 mb-4">No career goals yet</p>
                    <button
                      onClick={() => setShowGoalForm(true)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Create your first goal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Favorite Scholarships Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  Saved Scholarships
                </h2>
              </div>

              <div className="p-6">
                {dashboardData?.favorites?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.favorites.map((favorite) => (
                      <div
                        key={favorite.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {favorite.scholarship_title}
                            </h3>
                            {favorite.scholarship_provider && (
                              <p className="text-gray-600 text-sm mb-2">
                                {favorite.scholarship_provider}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs mb-2">
                              {favorite.scholarship_country && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  <i className="fas fa-globe mr-1"></i>
                                  {favorite.scholarship_country}
                                </span>
                              )}
                              {favorite.scholarship_level && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  <i className="fas fa-graduation-cap mr-1"></i>
                                  {favorite.scholarship_level}
                                </span>
                              )}
                              {favorite.scholarship_field && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                  <i className="fas fa-book mr-1"></i>
                                  {favorite.scholarship_field}
                                </span>
                              )}
                            </div>
                            {favorite.scholarship_deadline && (
                              <div className="text-sm text-gray-600">
                                <i className="fas fa-calendar mr-1"></i>
                                Deadline:{" "}
                                {new Date(
                                  favorite.scholarship_deadline
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex flex-col items-end">
                            {favorite.scholarship_amount && (
                              <div className="text-sm font-medium text-green-600 mb-2">
                                {favorite.scholarship_amount}
                              </div>
                            )}
                            <button
                              onClick={() =>
                                handleRemoveFavorite(favorite.scholarship_id)
                              }
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              <i className="fas fa-trash mr-1"></i>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-heart text-gray-300 text-4xl mb-4"></i>
                    <p className="text-gray-500 mb-4">
                      No saved scholarships yet
                    </p>
                    <a
                      href="/#scholarships"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Browse scholarships
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Profile Overview
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <i className="fas fa-user text-gray-400 w-5"></i>
                  <span className="text-gray-700 ml-3">
                    {user.name || "Not set"}
                  </span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-envelope text-gray-400 w-5"></i>
                  <span className="text-gray-700 ml-3">{user.email}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-calendar text-gray-400 w-5"></i>
                  <span className="text-gray-700 ml-3">
                    Joined {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <a
                  href="/#scholarships"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <i className="fas fa-search text-blue-600 w-5"></i>
                  <span className="text-gray-700 ml-3">Find Scholarships</span>
                </a>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                >
                  <i className="fas fa-robot text-purple-600 w-5"></i>
                  <span className="text-gray-700 ml-3">AI Career Guidance</span>
                </button>
                <button
                  onClick={() => setShowGoalForm(true)}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                >
                  <i className="fas fa-plus text-green-600 w-5"></i>
                  <span className="text-gray-700 ml-3">Add Career Goal</span>
                </button>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            {dashboardData?.favorites?.some((fav) => {
              if (!fav.scholarship_deadline) return false;
              const deadline = new Date(fav.scholarship_deadline);
              const now = new Date();
              const diffTime = deadline - now;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 30 && diffDays > 0;
            }) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-yellow-800 mb-4">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Upcoming Deadlines
                </h3>
                <div className="space-y-2">
                  {dashboardData.favorites
                    .filter((fav) => {
                      if (!fav.scholarship_deadline) return false;
                      const deadline = new Date(fav.scholarship_deadline);
                      const now = new Date();
                      const diffTime = deadline - now;
                      const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24)
                      );
                      return diffDays <= 30 && diffDays > 0;
                    })
                    .map((fav) => {
                      const deadline = new Date(fav.scholarship_deadline);
                      const now = new Date();
                      const diffTime = deadline - now;
                      const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <div key={fav.id} className="text-sm">
                          <div className="font-medium text-yellow-800">
                            {fav.scholarship_title}
                          </div>
                          <div className="text-yellow-600">
                            {diffDays} days remaining
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Career Goal Form Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Create Career Goal
              </h3>
              <button
                onClick={() => setShowGoalForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={goalForm.goal_title}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, goal_title: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Get PhD in Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={goalForm.goal_description}
                  onChange={(e) =>
                    setGoalForm({
                      ...goalForm,
                      goal_description: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Describe your goal..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field
                  </label>
                  <input
                    type="text"
                    value={goalForm.target_field}
                    onChange={(e) =>
                      setGoalForm({ ...goalForm, target_field: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={goalForm.target_country}
                    onChange={(e) =>
                      setGoalForm({
                        ...goalForm,
                        target_country: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., United States"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Degree Level
                  </label>
                  <select
                    value={goalForm.target_degree_level}
                    onChange={(e) =>
                      setGoalForm({
                        ...goalForm,
                        target_degree_level: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select level</option>
                    <option value="Bachelor's">Bachelor's</option>
                    <option value="Master's">Master's</option>
                    <option value="PhD">PhD</option>
                    <option value="Postdoc">Postdoc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={goalForm.target_completion_date}
                    onChange={(e) =>
                      setGoalForm({
                        ...goalForm,
                        target_completion_date: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full h-[600px] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                <i className="fas fa-robot text-blue-600 mr-2"></i>
                AI Career Advisor
              </h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {streamingMessage && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                    {streamingMessage}
                  </div>
                </div>
              )}
              {isLoading && !streamingMessage && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={handleChatSubmit}
              className="p-6 border-t border-gray-200"
            >
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Ask about career guidance, scholarships, or goals..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !currentMessage.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;