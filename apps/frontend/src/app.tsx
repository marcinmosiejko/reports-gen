import {
  BrowserRouter as Router,
  Route,
  Routes,
  NavLink,
} from "react-router-dom";
import Reports from "./components/pages/reports";
import { buttonVariants } from "./components/ui/button";
import Home from "./components/pages/home";
import { cn } from "./lib/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Appointments from "./components/pages/appointments";

const queryClient = new QueryClient();

const navConfig = [
  { name: "Home", to: "/", Component: Home },
  { name: "Appointments", to: "/appointments", Component: Appointments },
  { name: "Reports", to: "/reports", Component: Reports },
];

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <header className="mx-auto my-2 w-full max-w-7xl">
          <nav>
            {navConfig.map(({ name, to }) => (
              <NavLink
                key={to}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: "link" }),
                    !isActive && "text-foreground",
                  )
                }
                to={to}
              >
                {name}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="flex w-full grow flex-col">
          <Routes>
            {navConfig.map(({ to, Component }) => (
              <Route path={to} element={<Component />} />
            ))}
          </Routes>
        </main>
        <footer className="text-muted-foreground mx-auto my-2 text-sm">
          foooooooter
        </footer>
      </Router>
    </QueryClientProvider>
  );
}
export default App;
