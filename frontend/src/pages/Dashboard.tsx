"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const Dashboard = () => {
  const { isAuthenticated, currentUser } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
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
        {isAuthenticated ? (
          <Button size="lg" asChild>
            <Link to="/first-application">
              <span>Start Your First Application</span>
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