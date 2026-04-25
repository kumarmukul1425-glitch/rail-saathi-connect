import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import SearchResults from "./pages/SearchResults.tsx";
import TrainDetails from "./pages/TrainDetails.tsx";
import BookTicket from "./pages/BookTicket.tsx";
import Auth from "./pages/Auth.tsx";
import MyBookings from "./pages/MyBookings.tsx";
import TravelAssistant from "./pages/TravelAssistant.tsx";
import SleepAlert from "./pages/SleepAlert.tsx";
import LiveTrainStatus from "./pages/LiveTrainStatus.tsx";
import FoodDelivery from "./pages/FoodDelivery.tsx";
import TrainTimetable from "./pages/TrainTimetable.tsx";
import Complaints from "./pages/Complaints.tsx";
import DelayCompensation from "./pages/DelayCompensation.tsx";
import AdminNotifications from "./pages/AdminNotifications.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/train/:trainNumber" element={<TrainDetails />} />
            <Route path="/timetable/:trainNumber" element={<TrainTimetable />} />
            <Route path="/book/:trainNumber" element={<BookTicket />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/assistant" element={<TravelAssistant />} />
            <Route path="/sleep-alert" element={<SleepAlert />} />
            <Route path="/live-status" element={<LiveTrainStatus />} />
            <Route path="/food" element={<FoodDelivery />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/delay-compensation" element={<DelayCompensation />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
