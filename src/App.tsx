import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TempleChatbot } from "@/components/chat/TempleChatbot";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Panditji from "./pages/Panditji";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Donations from "./pages/Donations";
import Live from "./pages/Live";
import Gallery from "./pages/Gallery";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import About from "./pages/About";
import Admin from "./pages/Admin";
import MyBookings from "./pages/MyBookings";
import Rooms from "./pages/Rooms";
import Install from "./pages/Install";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import UpcomingEvents from "./pages/UpcomingEvents";
import PastEventLive from "./pages/PastEventLive";
import NewsEvents from "./pages/NewsEvents";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <TempleChatbot />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/panditji" element={<Panditji />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/live" element={<Live />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/yagyas" element={<Events />} />
            <Route path="/yagyas/:id" element={<EventDetail />} />
            <Route path="/upcoming-events" element={<UpcomingEvents />} />
            <Route path="/past-event-live" element={<PastEventLive />} />
            <Route path="/news" element={<NewsEvents />} />
            {/* Legacy routes for backward compatibility */}
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/install" element={<Install />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;