"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { Link } from "react-router-dom"; // Import Link

const Dashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <Card className="w-full max-w-2xl p-8 text-center shadow-lg">
        <Rocket className="mx-auto h-16 w-16 text-primary mb-6" />
        <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to CareerCircle!</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Your essential platform for navigating your job search with confidence, efficiency, and peer support.
        </p>
        <p className="text-md text-muted-foreground mb-8">
          Ready to supercharge your job search? Let's get started with your first application!
        </p>
        <Button size="lg" asChild> {/* Use asChild to pass props to Link */}
          <Link to="/first-application">
            Start Your First Application
          </Link>
        </Button>
      </Card>
    </div>
  );
};

export default Dashboard;