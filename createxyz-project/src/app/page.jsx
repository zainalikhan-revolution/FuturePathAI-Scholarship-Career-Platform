"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user } = useUser();
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitMessage, setSubmitMessage] = React.useState("");

  // AI Career Guidance Chat State
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI Career Advisor. I'm here to help you discover career paths that match your interests and find relevant scholarships. Tell me about yourself - what subjects do you enjoy? Are you interested in research, industry jobs, or entrepreneurship?",
    },
  ]);
  const [currentMessage, setCurrentMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamingMessage, setStreamingMessage] = React.useState("");

  // Favorites state
  const [favoriteStatus, setFavoriteStatus] = React.useState({});

  const handleFinish = React.useCallback((message) => {
    setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    setStreamingMessage("");
    setIsLoading(false);
  }, []);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setSubmitMessage(
        "Thank you for your message! We'll get back to you soon."
      );
      setFormData({ name: "", email: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

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
              content: `You are an AI Career Advisor for FuturePathAI, specifically designed to help students from rural and low-income backgrounds discover career opportunities and scholarships. Your role is to:

1. Ask about their interests, skills, and background
2. Suggest relevant career paths (like ML Engineer, Data Scientist, Software Developer, Research Scientist, etc.)
3. Recommend specific scholarships that match their profile
4. Provide learning resources and next steps
5. Be encouraging and supportive

Focus on careers in technology, research, and fields with good scholarship opportunities. Always be specific with your recommendations and include actionable advice.`,
            },
            ...updatedMessages,
          ],
          stream: true,
        }),
      });

      handleStreamResponse(response);
    } catch (error) {
      console.error("Error:", error);
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

  const handleAddToFavorites = async (scholarship) => {
    if (!user) {
      // Redirect to sign in if not authenticated
      window.location.href =
        "/account/signin?callbackUrl=" +
        encodeURIComponent(window.location.pathname);
      return;
    }

    const scholarshipId = scholarship.title.replace(/\s+/g, "-").toLowerCase();

    setFavoriteStatus((prev) => ({ ...prev, [scholarshipId]: "loading" }));

    try {
      const response = await fetch("/api/dashboard/add-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scholarship_id: scholarshipId,
          scholarship_title: scholarship.title,
          scholarship_provider: scholarship.provider,
          scholarship_country: scholarship.country,
          scholarship_deadline: scholarship.deadline,
          scholarship_amount: scholarship.amount,
          scholarship_level: scholarship.level,
          scholarship_field: scholarship.field,
        }),
      });

      const data = await response.json();
      if (data.error) {
        if (data.error === "Scholarship already in favorites") {
          setFavoriteStatus((prev) => ({
            ...prev,
            [scholarshipId]: "favorited",
          }));
        } else {
          throw new Error(data.error);
        }
      } else {
        setFavoriteStatus((prev) => ({
          ...prev,
          [scholarshipId]: "favorited",
        }));
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
      setFavoriteStatus((prev) => ({ ...prev, [scholarshipId]: "error" }));
      setTimeout(() => {
        setFavoriteStatus((prev) => ({ ...prev, [scholarshipId]: null }));
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-inter">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img
                  src="/BlackModernEducationLogo.png"
                  alt="FuturePathAI Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  FuturePathAI
                </h1>
                <p className="text-xs text-gray-500 font-medium -mt-1">
                  AI-Powered Education
                </p>
              </div>
            </div>
            <div className="hidden md:flex space-x-8">
              <a
                href="#home"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Home
              </a>
              <a
                href="#scholarships"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Scholarships
              </a>
              <a
                href="#features"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Features
              </a>
              <a
                href="#blog"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Blog
              </a>
              <a
                href="#about"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                About
              </a>
              <a
                href="#contact"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Contact
              </a>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <a
                    href="/dashboard"
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/account/logout"
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    Sign Out
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/account/signin"
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    Sign In
                  </a>
                  <a
                    href="/account/signup"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Sign Up
                  </a>
                </>
              )}
              <div className="md:hidden">
                <button className="text-gray-700 hover:text-blue-600 transition-colors">
                  <i className="fas fa-bars text-xl"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative py-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Main Logo and Brand */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4 bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border border-white/20">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden bg-white">
                  <img
                    src="/BlackModernEducationLogo.png"
                    alt="FuturePathAI Logo"
                    className="w-12 h-12 object-contain"
                  />
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

            {/* Intro Message */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 font-inter">
                Empowering students with AI-driven career and scholarship tools
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full"></div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Unlock Your Global Future with
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {" "}
                AI-Powered
              </span>{" "}
              Guidance
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Discover fully funded scholarships, explore global career
              opportunities, and receive personalized guidance — all powered by
              cutting-edge artificial intelligence designed for students from
              every background.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                <i className="fas fa-search mr-2"></i>
                Discover Scholarships
              </button>
              <button className="border-2 border-blue-600 text-blue-600 px-10 py-4 rounded-full text-lg font-semibold hover:bg-blue-50 transition-all duration-200 backdrop-blur-sm bg-white/50">
                <i className="fas fa-play mr-2"></i>
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-users text-white text-xl"></i>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  10,000+
                </div>
                <div className="text-gray-600 font-medium">
                  Trusted Students
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-graduation-cap text-white text-xl"></i>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  1,000+
                </div>
                <div className="text-gray-600 font-medium">Scholarships</div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-globe text-white text-xl"></i>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">50+</div>
                <div className="text-gray-600 font-medium">Countries</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose FuturePathAI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              We break down barriers and open doors to global opportunities for
              every student, regardless of background.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-300 border border-blue-100/50 shadow-lg hover:shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <i className="fas fa-robot text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                AI-Powered Matching
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI analyzes your profile and matches you with the
                most relevant scholarships and opportunities.
              </p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 transition-all duration-300 border border-purple-100/50 shadow-lg hover:shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <i className="fas fa-heart text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Built for Everyone
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Designed specifically for students from rural and low-income
                backgrounds with no tech experience required.
              </p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200/50 transition-all duration-300 border border-green-100/50 shadow-lg hover:shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <i className="fas fa-gift text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Completely Free
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Access all our tools, resources, and guidance at no cost.
                Education should never be limited by finances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scholarship Finder */}
      <section id="scholarships" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Global Scholarship Database
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access 1000+ verified scholarships from trusted sources worldwide,
              updated regularly with new opportunities.
            </p>
            <div className="flex justify-center items-center mt-6 space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                <span>1000+ Verified Scholarships</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-sync-alt text-blue-500 mr-2"></i>
                <span>Updated Daily</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-shield-alt text-purple-500 mr-2"></i>
                <span>Trusted Sources Only</span>
              </div>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Countries</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Canada</option>
                  <option>Australia</option>
                  <option>Germany</option>
                  <option>Netherlands</option>
                  <option>Sweden</option>
                  <option>Switzerland</option>
                  <option>France</option>
                  <option>Japan</option>
                  <option>South Korea</option>
                  <option>Singapore</option>
                  <option>New Zealand</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Degree Level
                </label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Levels</option>
                  <option>Bachelor's (BS)</option>
                  <option>Master's (MS)</option>
                  <option>PhD</option>
                  <option>Postdoc</option>
                  <option>Research</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Area
                </label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Subjects</option>
                  <option>Engineering & Technology</option>
                  <option>Medicine & Health Sciences</option>
                  <option>Business & Economics</option>
                  <option>Computer Science & IT</option>
                  <option>Natural Sciences</option>
                  <option>Social Sciences</option>
                  <option>Arts & Humanities</option>
                  <option>Law</option>
                  <option>Education</option>
                  <option>Agriculture</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline
                </label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Deadlines</option>
                  <option>Next 30 days</option>
                  <option>Next 3 months</option>
                  <option>Next 6 months</option>
                  <option>Next 12 months</option>
                  <option>Rolling Admissions</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search scholarships by keyword..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                <i className="fas fa-search mr-2"></i>
                Search Scholarships
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                <i className="fas fa-filter mr-2"></i>
                Clear Filters
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex items-center text-blue-800">
                <i className="fas fa-info-circle mr-2"></i>
                <span className="font-semibold">
                  Showing 1,247 scholarships matching your criteria
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-blue-600">
                <button className="hover:text-blue-800">
                  Sort by Deadline
                </button>
                <button className="hover:text-blue-800">Sort by Country</button>
                <button className="hover:text-blue-800">Sort by Amount</button>
              </div>
            </div>
          </div>

          {/* Scholarship Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Scholarship Card 1 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Fulbright Foreign Student Program
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    U.S. Department of State
                  </p>
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Fully Funded
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm">
                  <i className="fas fa-globe text-blue-600 mr-2 w-4"></i>
                  <span className="text-gray-700">🇺🇸 United States</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-graduation-cap text-purple-600 mr-2 w-4"></i>
                  <span className="text-gray-700">Master's/PhD</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-calendar text-red-600 mr-2 w-4"></i>
                  <span className="text-gray-700">Deadline: May 15, 2025</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-book text-green-600 mr-2 w-4"></i>
                  <span className="text-gray-700">All Fields</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Eligibility:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• International students (non-US citizens)</li>
                  <li>• Bachelor's degree completed</li>
                  <li>• Strong academic record</li>
                  <li>• English proficiency required</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <i className="fas fa-external-link-alt mr-1"></i>
                  Apply Now
                </button>
                <button
                  onClick={() =>
                    handleAddToFavorites({
                      title: "Fulbright Foreign Student Program",
                      provider: "U.S. Department of State",
                      country: "United States",
                      deadline: "2025-05-15",
                      amount: "Fully Funded",
                      level: "Master's/PhD",
                      field: "All Fields",
                    })
                  }
                  disabled={
                    favoriteStatus["fulbright-foreign-student-program"] ===
                    "loading"
                  }
                  className={`px-4 py-2 border rounded-lg text-sm font-semibold transition-colors ${
                    favoriteStatus["fulbright-foreign-student-program"] ===
                    "favorited"
                      ? "border-green-300 text-green-700 bg-green-50"
                      : favoriteStatus["fulbright-foreign-student-program"] ===
                        "loading"
                      ? "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                      : favoriteStatus["fulbright-foreign-student-program"] ===
                        "error"
                      ? "border-red-300 text-red-700 bg-red-50"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {favoriteStatus["fulbright-foreign-student-program"] ===
                  "loading" ? (
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                  ) : favoriteStatus["fulbright-foreign-student-program"] ===
                    "favorited" ? (
                    <i className="fas fa-heart mr-1"></i>
                  ) : favoriteStatus["fulbright-foreign-student-program"] ===
                    "error" ? (
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                  ) : (
                    <i className="far fa-heart mr-1"></i>
                  )}
                  {favoriteStatus["fulbright-foreign-student-program"] ===
                  "loading"
                    ? "Adding..."
                    : favoriteStatus["fulbright-foreign-student-program"] ===
                      "favorited"
                    ? "Saved"
                    : favoriteStatus["fulbright-foreign-student-program"] ===
                      "error"
                    ? "Error"
                    : "Save"}
                </button>
              </div>
            </div>

            {/* Scholarship Card 2 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Chevening Scholarships
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">UK Government</p>
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Fully Funded
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm">
                  <i className="fas fa-globe text-blue-600 mr-2 w-4"></i>
                  <span className="text-gray-700">🇬🇧 United Kingdom</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-graduation-cap text-purple-600 mr-2 w-4"></i>
                  <span className="text-gray-700">Master's</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-calendar text-orange-600 mr-2 w-4"></i>
                  <span className="text-gray-700">
                    Deadline: November 2, 2025
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-book text-green-600 mr-2 w-4"></i>
                  <span className="text-gray-700">All Fields</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Eligibility:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Citizens of Chevening-eligible countries</li>
                  <li>• Bachelor's degree (2:1 honors)</li>
                  <li>• 2+ years work experience</li>
                  <li>• Leadership potential</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <i className="fas fa-external-link-alt mr-1"></i>
                  Apply Now
                </button>
                <button
                  onClick={() =>
                    handleAddToFavorites({
                      title: "Chevening Scholarships",
                      provider: "UK Government",
                      country: "United Kingdom",
                      deadline: "2025-11-02",
                      amount: "Fully Funded",
                      level: "Master's",
                      field: "All Fields",
                    })
                  }
                  disabled={
                    favoriteStatus["chevening-scholarships"] === "loading"
                  }
                  className={`px-4 py-2 border rounded-lg text-sm font-semibold transition-colors ${
                    favoriteStatus["chevening-scholarships"] === "favorited"
                      ? "border-green-300 text-green-700 bg-green-50"
                      : favoriteStatus["chevening-scholarships"] === "loading"
                      ? "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                      : favoriteStatus["chevening-scholarships"] === "error"
                      ? "border-red-300 text-red-700 bg-red-50"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {favoriteStatus["chevening-scholarships"] === "loading" ? (
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                  ) : favoriteStatus["chevening-scholarships"] ===
                    "favorited" ? (
                    <i className="fas fa-heart mr-1"></i>
                  ) : favoriteStatus["chevening-scholarships"] === "error" ? (
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                  ) : (
                    <i className="far fa-heart mr-1"></i>
                  )}
                  {favoriteStatus["chevening-scholarships"] === "loading"
                    ? "Adding..."
                    : favoriteStatus["chevening-scholarships"] === "favorited"
                    ? "Saved"
                    : favoriteStatus["chevening-scholarships"] === "error"
                    ? "Error"
                    : "Save"}
                </button>
              </div>
            </div>

            {/* Scholarship Card 3 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    DAAD Scholarships
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    German Academic Exchange Service
                  </p>
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Fully Funded
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm">
                  <i className="fas fa-globe text-blue-600 mr-2 w-4"></i>
                  <span className="text-gray-700">🇩🇪 Germany</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-graduation-cap text-purple-600 mr-2 w-4"></i>
                  <span className="text-gray-700">Master's/PhD</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-calendar text-orange-600 mr-2 w-4"></i>
                  <span className="text-gray-700">
                    Deadline: October 31, 2025
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-book text-green-600 mr-2 w-4"></i>
                  <span className="text-gray-700">Engineering, Sciences</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Eligibility:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• International students</li>
                  <li>• Relevant bachelor's degree</li>
                  <li>• Strong academic performance</li>
                  <li>• German/English proficiency</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <i className="fas fa-external-link-alt mr-1"></i>
                  Apply Now
                </button>
                <button
                  onClick={() =>
                    handleAddToFavorites({
                      title: "DAAD Scholarships",
                      provider: "German Academic Exchange Service",
                      country: "Germany",
                      deadline: "2025-10-31",
                      amount: "Fully Funded",
                      level: "Master's/PhD",
                      field: "Engineering, Sciences",
                    })
                  }
                  disabled={favoriteStatus["daad-scholarships"] === "loading"}
                  className={`px-4 py-2 border rounded-lg text-sm font-semibold transition-colors ${
                    favoriteStatus["daad-scholarships"] === "favorited"
                      ? "border-green-300 text-green-700 bg-green-50"
                      : favoriteStatus["daad-scholarships"] === "loading"
                      ? "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                      : favoriteStatus["daad-scholarships"] === "error"
                      ? "border-red-300 text-red-700 bg-red-50"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {favoriteStatus["daad-scholarships"] === "loading" ? (
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                  ) : favoriteStatus["daad-scholarships"] === "favorited" ? (
                    <i className="fas fa-heart mr-1"></i>
                  ) : favoriteStatus["daad-scholarships"] === "error" ? (
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                  ) : (
                    <i className="far fa-heart mr-1"></i>
                  )}
                  {favoriteStatus["daad-scholarships"] === "loading"
                    ? "Adding..."
                    : favoriteStatus["daad-scholarships"] === "favorited"
                    ? "Saved"
                    : favoriteStatus["daad-scholarships"] === "error"
                    ? "Error"
                    : "Save"}
                </button>
              </div>
            </div>

            {/* Scholarship Card 4 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Australia Awards Scholarships
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Australian Government
                  </p>
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Fully Funded
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm">
                  <i className="fas fa-globe text-blue-600 mr-2 w-4"></i>
                  <span className="text-gray-700">🇦🇺 Australia</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-graduation-cap text-purple-600 mr-2 w-4"></i>
                  <span className="text-gray-700">Master's</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-calendar text-red-600 mr-2 w-4"></i>
                  <span className="text-gray-700">
                    Deadline: April 30, 2025
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-book text-green-600 mr-2 w-4"></i>
                  <span className="text-gray-700">Development Studies</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Eligibility:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Citizens of eligible countries</li>
                  <li>• Bachelor's degree completed</li>
                  <li>• Development sector experience</li>
                  <li>• English proficiency (IELTS 6.5+)</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <i className="fas fa-external-link-alt mr-1"></i>
                  Apply Now
                </button>
                <button
                  onClick={() =>
                    handleAddToFavorites({
                      title: "Australia Awards Scholarships",
                      provider: "Australian Government",
                      country: "Australia",
                      deadline: "2025-04-30",
                      amount: "Fully Funded",
                      level: "Master's",
                      field: "Development Studies",
                    })
                  }
                  disabled={
                    favoriteStatus["australia-awards-scholarships"] ===
                    "loading"
                  }
                  className={`px-4 py-2 border rounded-lg text-sm font-semibold transition-colors ${
                    favoriteStatus["australia-awards-scholarships"] ===
                    "favorited"
                      ? "border-green-300 text-green-700 bg-green-50"
                      : favoriteStatus["australia-awards-scholarships"] ===
                        "loading"
                      ? "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                      : favoriteStatus["australia-awards-scholarships"] ===
                        "error"
                      ? "border-red-300 text-red-700 bg-red-50"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {favoriteStatus["australia-awards-scholarships"] ===
                  "loading" ? (
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                  ) : favoriteStatus["australia-awards-scholarships"] ===
                    "favorited" ? (
                    <i className="fas fa-heart mr-1"></i>
                  ) : favoriteStatus["australia-awards-scholarships"] ===
                    "error" ? (
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                  ) : (
                    <i className="far fa-heart mr-1"></i>
                  )}
                  {favoriteStatus["australia-awards-scholarships"] === "loading"
                    ? "Adding..."
                    : favoriteStatus["australia-awards-scholarships"] ===
                      "favorited"
                    ? "Saved"
                    : favoriteStatus["australia-awards-scholarships"] ===
                      "error"
                    ? "Error"
                    : "Save"}
                </button>
              </div>
            </div>

            {/* Scholarship Card 5 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Vanier Canada Graduate Scholarships
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Government of Canada
                  </p>
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  $50,000/year
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm">
                  <i className="fas fa-globe text-blue-600 mr-2 w-4"></i>
                  <span className="text-gray-700">🇨🇦 Canada</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-graduation-cap text-purple-600 mr-2 w-4"></i>
                  <span className="text-gray-700">PhD</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-calendar text-orange-600 mr-2 w-4"></i>
                  <span className="text-gray-700">
                    Deadline: November 1, 2025
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-book text-green-600 mr-2 w-4"></i>
                  <span className="text-gray-700">
                    Health, Natural Sciences
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Eligibility:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Canadian/International students</li>
                  <li>• Nominated by Canadian institution</li>
                  <li>• Exceptional academic achievement</li>
                  <li>• Research potential & leadership</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <i className="fas fa-external-link-alt mr-1"></i>
                  Apply Now
                </button>
                <button
                  onClick={() =>
                    handleAddToFavorites({
                      title: "Vanier Canada Graduate Scholarships",
                      provider: "Government of Canada",
                      country: "Canada",
                      deadline: "2025-11-01",
                      amount: "$50,000/year",
                      level: "PhD",
                      field: "Health, Natural Sciences",
                    })
                  }
                  disabled={
                    favoriteStatus["vanier-canada-graduate-scholarships"] ===
                    "loading"
                  }
                  className={`px-4 py-2 border rounded-lg text-sm font-semibold transition-colors ${
                    favoriteStatus["vanier-canada-graduate-scholarships"] ===
                    "favorited"
                      ? "border-green-300 text-green-700 bg-green-50"
                      : favoriteStatus[
                          "vanier-canada-graduate-scholarships"
                        ] === "loading"
                      ? "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                      : favoriteStatus[
                          "vanier-canada-graduate-scholarships"
                        ] === "error"
                      ? "border-red-300 text-red-700 bg-red-50"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {favoriteStatus["vanier-canada-graduate-scholarships"] ===
                  "loading" ? (
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                  ) : favoriteStatus["vanier-canada-graduate-scholarships"] ===
                    "favorited" ? (
                    <i className="fas fa-heart mr-1"></i>
                  ) : favoriteStatus["vanier-canada-graduate-scholarships"] ===
                    "error" ? (
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                  ) : (
                    <i className="far fa-heart mr-1"></i>
                  )}
                  {favoriteStatus["vanier-canada-graduate-scholarships"] ===
                  "loading"
                    ? "Adding..."
                    : favoriteStatus["vanier-canada-graduate-scholarships"] ===
                      "favorited"
                    ? "Saved"
                    : favoriteStatus["vanier-canada-graduate-scholarships"] ===
                      "error"
                    ? "Error"
                    : "Save"}
                </button>
              </div>
            </div>

            {/* Scholarship Card 6 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Erasmus Mundus Joint Master Degrees
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    European Commission
                  </p>
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  €1,400/month
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm">
                  <i className="fas fa-globe text-blue-600 mr-2 w-4"></i>
                  <span className="text-gray-700">🇪🇺 Europe (Multiple)</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-graduation-cap text-purple-600 mr-2 w-4"></i>
                  <span className="text-gray-700">Master's</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-calendar text-red-600 mr-2 w-4"></i>
                  <span className="text-gray-700">
                    Deadline: January 15, 2025
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-book text-green-600 mr-2 w-4"></i>
                  <span className="text-gray-700">Various Programs</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Eligibility:
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Bachelor's degree completed</li>
                  <li>• Strong academic record</li>
                  <li>• Language requirements vary</li>
                  <li>• Open to all nationalities</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <i className="fas fa-external-link-alt mr-1"></i>
                  Apply Now
                </button>
                <button
                  onClick={() =>
                    handleAddToFavorites({
                      title: "Erasmus Mundus Joint Master Degrees",
                      provider: "European Commission",
                      country: "Europe (Multiple)",
                      deadline: "2025-01-15",
                      amount: "€1,400/month",
                      level: "Master's",
                      field: "Various Programs",
                    })
                  }
                  disabled={
                    favoriteStatus["erasmus-mundus-joint-master-degrees"] ===
                    "loading"
                  }
                  className={`px-4 py-2 border rounded-lg text-sm font-semibold transition-colors ${
                    favoriteStatus["erasmus-mundus-joint-master-degrees"] ===
                    "favorited"
                      ? "border-green-300 text-green-700 bg-green-50"
                      : favoriteStatus[
                          "erasmus-mundus-joint-master-degrees"
                        ] === "loading"
                      ? "border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed"
                      : favoriteStatus[
                          "erasmus-mundus-joint-master-degrees"
                        ] === "error"
                      ? "border-red-300 text-red-700 bg-red-50"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {favoriteStatus["erasmus-mundus-joint-master-degrees"] ===
                  "loading" ? (
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                  ) : favoriteStatus["erasmus-mundus-joint-master-degrees"] ===
                    "favorited" ? (
                    <i className="fas fa-heart mr-1"></i>
                  ) : favoriteStatus["erasmus-mundus-joint-master-degrees"] ===
                    "error" ? (
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                  ) : (
                    <i className="far fa-heart mr-1"></i>
                  )}
                  {favoriteStatus["erasmus-mundus-joint-master-degrees"] ===
                  "loading"
                    ? "Adding..."
                    : favoriteStatus["erasmus-mundus-joint-master-degrees"] ===
                      "favorited"
                    ? "Saved"
                    : favoriteStatus["erasmus-mundus-joint-master-degrees"] ===
                      "error"
                    ? "Error"
                    : "Save"}
                </button>
              </div>
            </div>
          </div>

          {/* Load More Button */}
          <div className="text-center mb-8">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Load More Scholarships
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Showing 6 of 1,247 scholarships
            </p>
          </div>

          {/* Call to Action */}
          <div className="bg-blue-50 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Find Your Perfect Scholarship?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Get personalized recommendations based on your profile and
              interests. Our AI will match you with the most relevant
              opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                <i className="fas fa-robot mr-2"></i>
                Get AI Recommendations
              </button>
              <button className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                <i className="fas fa-download mr-2"></i>
                Export Results
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Your Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to discover, apply, and succeed in your global
              education journey.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-brain text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                AI-Powered Career Advisor
              </h3>
              <p className="text-gray-600">
                Get personalized career guidance based on your interests,
                skills, and background using advanced AI.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-bullseye text-purple-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Personalized Recommendations
              </h3>
              <p className="text-gray-600">
                Receive tailored scholarship and opportunity recommendations
                that match your unique profile.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-file-alt text-green-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Free CV/Resume Builder
              </h3>
              <p className="text-gray-600">
                Create professional resumes and CVs with our easy-to-use builder
                designed for global applications.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-bell text-yellow-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Weekly Opportunity Alerts
              </h3>
              <p className="text-gray-600">
                Never miss a deadline with our smart notification system that
                alerts you to new opportunities.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-user-friends text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Built for Everyone
              </h3>
              <p className="text-gray-600">
                Designed specifically for students without coding or tech
                background - simple and intuitive.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-graduation-cap text-indigo-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Application Support
              </h3>
              <p className="text-gray-600">
                Get step-by-step guidance through the entire application process
                with our comprehensive resources.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Latest Insights & Tips
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay updated with the latest scholarship opportunities,
              application tips, and success stories.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600"></div>
              <div className="p-6">
                <div className="text-sm text-blue-600 font-semibold mb-2">
                  SCHOLARSHIPS
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Top Scholarships in 2025
                </h3>
                <p className="text-gray-600 mb-4">
                  Discover the most prestigious and accessible scholarships
                  available for international students this year.
                </p>
                <button className="text-blue-600 font-semibold hover:text-blue-800">
                  Read More →
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600"></div>
              <div className="p-6">
                <div className="text-sm text-purple-600 font-semibold mb-2">
                  APPLICATION TIPS
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  How to Write a Winning SOP
                </h3>
                <p className="text-gray-600 mb-4">
                  Master the art of writing compelling statements of purpose
                  that stand out to admissions committees.
                </p>
                <button className="text-purple-600 font-semibold hover:text-purple-800">
                  Read More →
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-green-400 to-green-600"></div>
              <div className="p-6">
                <div className="text-sm text-green-600 font-semibold mb-2">
                  SUCCESS STORIES
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  From Rural Village to Harvard
                </h3>
                <p className="text-gray-600 mb-4">
                  Inspiring journey of a student who overcame all odds to secure
                  a full scholarship at Harvard University.
                </p>
                <button className="text-green-600 font-semibold hover:text-green-800">
                  Read More →
                </button>
              </div>
            </div>
          </div>
          <div className="text-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Read More Articles
            </button>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story: From Rural Dreams to Global Impact
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                FuturePathAI was born from a simple belief: every student,
                regardless of their background or circumstances, deserves access
                to world-class education and global opportunities.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Our founder, who grew up in a small rural village with limited
                internet access, understands firsthand the challenges faced by
                students from underserved communities. After securing a full
                scholarship to study abroad, they realized that thousands of
                similar opportunities exist but remain hidden from those who
                need them most.
              </p>
              <div className="bg-blue-50 p-6 rounded-2xl mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Our Mission
                </h3>
                <p className="text-gray-700">
                  To democratize access to global education by connecting
                  students from rural and low-income backgrounds with fully
                  funded scholarships and career opportunities worldwide.
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Our Vision
                </h3>
                <p className="text-gray-700 font-semibold">
                  "No student left behind" - A world where talent and
                  determination, not financial circumstances, determine
                  educational opportunities.
                </p>
              </div>
            </div>
            <div className="lg:pl-8">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-heart text-white text-3xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Values
                </h3>
                <div className="space-y-4 text-left">
                  <div className="flex items-start">
                    <i className="fas fa-check-circle text-blue-600 mt-1 mr-3"></i>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Accessibility
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Making opportunities accessible to everyone, everywhere
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-check-circle text-blue-600 mt-1 mr-3"></i>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Empowerment
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Empowering students to achieve their dreams
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-check-circle text-blue-600 mt-1 mr-3"></i>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Innovation
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Using AI to break down traditional barriers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-check-circle text-blue-600 mt-1 mr-3"></i>
                    <div>
                      <h4 className="font-semibold text-gray-900">Community</h4>
                      <p className="text-gray-600 text-sm">
                        Building a supportive global community
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600">
              Have questions? We're here to help you on your journey to global
              education.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows="5"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </div>
              {submitMessage && (
                <div className="text-center text-green-600 font-medium">
                  {submitMessage}
                </div>
              )}
            </form>
            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <p className="text-gray-600 mb-2">Or reach us directly at:</p>
              <a
                href="mailto:hello@futurepathai.com"
                className="text-blue-600 font-semibold hover:text-blue-800"
              >
                hello@futurepathai.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">FuturePathAI</h3>
              <p className="text-gray-300 mb-6 max-w-md">
                Empowering students from rural and low-income backgrounds to
                discover global opportunities and achieve their educational
                dreams through AI-powered guidance.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
                >
                  <i className="fab fa-twitter"></i>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
                >
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
                >
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#home"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#scholarships"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Scholarships
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#blog"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#about"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Scholarship Database
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    CV Builder
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Application Tips
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Success Stories
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              © 2025 FuturePathAI. All rights reserved. Built with ❤️ for
              students worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainComponent;