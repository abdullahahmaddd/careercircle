"use client";

import React from "react";

const Dashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to CareerCircle!</h1>
      <p className="text-lg text-muted-foreground text-center max-w-md">
        Your essential platform for navigating your job search with confidence, efficiency, and peer support.
      </p>
      <p className="text-md text-muted-foreground text-center max-w-md mt-2">
        Start by exploring the navigation on the left.
      </p>
    </div>
  );
};

export default Dashboard;