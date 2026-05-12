"use client";

import { Home } from "lucide-react";

interface WelcomeSectionProps {
  displayName: string;
}

export default function WelcomeSection({ displayName }: WelcomeSectionProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
        <Home className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
        <span className="leading-tight">Welcome Back, {displayName}!</span>
      </h2>
      <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
        Analyze and manage your documents with ease
      </p>
    </div>
  );
}
