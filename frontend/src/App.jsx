import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./utils/axiosConfig";

// Route protection guards
import {
    CitizenProtectedRoute,
    OfficerProtectedRoute,
    AdminProtectedRoute,
    PetitionProtectedRoute
} from "./components/ProtectedRoute";

// Main pages
import Home from "./pages/Home";
import CitizenRegister from "./pages/CitizenRegister";
import CitizenLogin from "./pages/CitizenLogin";

// Citizen pages
import CitizenDashboard from "./pages/CitizenDashboard";
import SubmitPetition from "./pages/SubmitPetition";
import TrackPetition from "./pages/TrackPetition";

// Officer pages
import OfficerLogin from "./pages/OfficerLogin";
import OfficerDashboard from "./pages/OfficerDashboard";
import OfficerPetitions from "./pages/OfficerPetitions";
import OfficerProblemPriority from "./pages/OfficerProblemPriority";
import OfficerAreaPriority from "./pages/OfficerAreaPriority";
import OfficerMap from "./pages/OfficerMap";

import Petition from "./pages/Petition";

// Admin pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import GoogleMapTest from "./pages/GoogleMapTest";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* =================================================
                    PUBLIC ROUTES
                ================================================= */}

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/citizen-register"
                    element={<CitizenRegister />}
                />

                <Route
                    path="/citizen-login"
                    element={<CitizenLogin />}
                />

                <Route
                    path="/officer-login"
                    element={<OfficerLogin />}
                />

                <Route
                    path="/admin-login"
                    element={<AdminLogin />}
                />

                <Route
                    path="/google-map-test"
                    element={<GoogleMapTest />}
                />


                {/* =================================================
                    PROTECTED CITIZEN ROUTES
                ================================================= */}

                <Route element={<CitizenProtectedRoute />}>
                    <Route
                        path="/citizen-dashboard"
                        element={<CitizenDashboard />}
                    />
                    <Route
                        path="/submit-petition"
                        element={<SubmitPetition />}
                    />
                    <Route
                        path="/track-petition"
                        element={<TrackPetition />}
                    />
                </Route>


                {/* =================================================
                    PROTECTED OFFICER ROUTES
                ================================================= */}

                <Route element={<OfficerProtectedRoute />}>
                    <Route
                        path="/officer-dashboard"
                        element={<OfficerDashboard />}
                    />
                    <Route
                        path="/officer-petitions"
                        element={<OfficerPetitions />}
                    />
                    <Route
                        path="/officer-problem-priority"
                        element={<OfficerProblemPriority />}
                    />
                    <Route
                        path="/officer-area-priority"
                        element={<OfficerAreaPriority />}
                    />
                    <Route
                        path="/officer-map"
                        element={<OfficerMap />}
                    />
                </Route>


                {/* =================================================
                    PROTECTED ADMIN ROUTES
                ================================================= */}

                <Route element={<AdminProtectedRoute />}>
                    <Route
                        path="/admin-dashboard"
                        element={<AdminDashboard />}
                    />
                </Route>


                {/* =================================================
                    PROTECTED SINGLE PETITION (Citizen / Officer / Admin)
                ================================================= */}

                <Route element={<PetitionProtectedRoute />}>
                    <Route
                        path="/petition/:id"
                        element={<Petition />}
                    />
                </Route>

            </Routes>

        </BrowserRouter>

    );

}

export default App;