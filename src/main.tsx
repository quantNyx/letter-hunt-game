import React, { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router";
import "./index.css";

// Lazy load route components
const Landing = lazy(() => import("./pages/Landing.tsx"));
const Game = lazy(() => import("./pages/Game.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center font-red-hat">
      <div className="animate-pulse text-muted-foreground text-sm tracking-wider">
        Loading...
      </div>
    </div>
  );
}

/** Wrapper so Landing can call useNavigate */
function LandingRoute() {
  const navigate = useNavigate();
  return <Landing onStartGame={() => navigate("/game")} />;
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Game] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6 font-red-hat">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <StrictMode>
      <RootErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<LandingRoute />} />
              <Route path="/game" element={<Game />} />
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center font-red-hat">
                    <div className="text-center">
                      <p className="heading-display text-4xl mb-4">404</p>
                      <p className="text-sm text-muted-foreground">Page not found</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </RootErrorBoundary>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
