"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import UpcomingDeadlines from "@/components/UpcomingDeadlines"; // Import UpcomingDeadlines

const Dashboard = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && currentUser && !currentUser.hasCompletedFirstApplication) {
      navigate("/first-application");
    }
  }, [isAuthenticated, currentUser, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {isAuthenticated && <UpcomingDeadlines />} {/* Render UpcomingDeadlines if authenticated */}
      <Card className="w-full max-w-2xl p-8 text-center shadow-lg">
        <Rocket className="mx-auto h-16 w-16 text-primary mb-6" />
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome{isAuthenticated && currentUser ? `, ${currentUser.name.split(' ')[0]}!` : " to CareerCircle!"}
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Your essential platform for navigating your job search with confidence, efficiency, and peer support.
        </p>
        <p className="text-md text-muted-foreground mb-8">
          Ready to supercharge your job search? Let's get started with your first application!
        </p>
        {isAuthenticated && currentUser && !currentUser.hasCompletedFirstApplication ? (
          <Button size="lg" asChild>
            <Link to="/first-application">
              <span>Continue First Application</span>
            </Link>
          </Button>
        ) : isAuthenticated ? (
          <Button size="lg" asChild>
            <Link to="/resumes">
              <span>Go to Resumes</span>
            </Link>
          </Button>
        ) : (
          <Button size="lg" asChild>
            <Link to="/auth">
              <span>Login or Register to Get Started</span>
            </Link>
          </Button>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;