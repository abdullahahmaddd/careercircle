import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Resumes from "./pages/Resumes";
import Playlists from "./pages/Playlists";
import Pods from "./pages/Pods";
import Settings from "./pages/Settings";
import FirstApplicationWorkflow from "./pages/FirstApplicationWorkflow";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import CoverLetter from "./pages/CoverLetter"; // Import CoverLetter
import { PlaylistProvider } from "./context/PlaylistContext";
import { AuthProvider } from "./context/AuthContext";
import { PodProvider } from "./context/PodContext";
import { ResumeProvider } from "./context/ResumeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PlaylistProvider>
            <PodProvider>
              <ResumeProvider>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="resumes" element={<Resumes />} />
                    <Route path="playlists" element={<Playlists />} />
                    <Route path="pods" element={<Pods />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="first-application" element={<FirstApplicationWorkflow />} />
                    <Route path="cover-letter" element={<CoverLetter />} /> {/* New route */}
                    <Route path="auth" element={<Auth />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </ResumeProvider>
            </PodProvider>
          </PlaylistProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;