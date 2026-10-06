import {
    APIProvider,
    Map,
    AdvancedMarker,
    useMap,
    useMapsLibrary
} from "@vis.gl/react-google-maps";

import {
    useEffect,
    useRef,
    useState
} from "react";


// =====================================================
// LOCATION SEARCH COMPONENT
// =====================================================

function LocationSearch({ onLocationSelect }) {

    // Reference to the search input
    const inputRef = useRef(null);

    // Get the current Google Map instance
    const map = useMap();

    // Load Google Places library
    const placesLib = useMapsLibrary("places");


    // =================================================
    // CREATE GOOGLE PLACES AUTOCOMPLETE
    // =================================================

    useEffect(() => {

        // Places library not loaded yet
        if (!placesLib) {
            return;
        }

        // Input element not available yet
        if (!inputRef.current) {
            return;
        }


        // Create Google Places Autocomplete
        const autocomplete =
            new placesLib.Autocomplete(
                inputRef.current,
                {
                    componentRestrictions: {
                        country: "in"
                    },

                    fields: [
                        "formatted_address",
                        "geometry",
                        "name",
                        "address_components"
                    ]
                }
            );


        // =================================================
        // WHEN USER SELECTS A PLACE
        // =================================================

        const listener =
            autocomplete.addListener(
                "place_changed",
                () => {

                    const place =
                        autocomplete.getPlace();


                    // Make sure Google returned coordinates
                    if (
                        !place.geometry ||
                        !place.geometry.location
                    ) {

                        console.warn(
                            "Location could not be identified. Please select a location from the suggestions."
                        );

                        return;
                    }


                    // Get latitude
                    const latitude =
                        place.geometry.location.lat();


                    // Get longitude
                    const longitude =
                        place.geometry.location.lng();


                    // =================================================
                    // DEBUG INFORMATION
                    // =================================================

                    console.log(
                        "================================="
                    );

                    console.log(
                        "Selected Place:",
                        place
                    );

                    console.log(
                        "Location Name:",
                        place.name
                    );

                    console.log(
                        "Address:",
                        place.formatted_address
                    );

                    console.log(
                        "Latitude:",
                        latitude
                    );

                    console.log(
                        "Longitude:",
                        longitude
                    );

                    console.log(
                        "Address Components:",
                        place.address_components
                    );

                    console.log(
                        "================================="
                    );


                    // =================================================
                    // MOVE MAP TO SELECTED LOCATION
                    // =================================================

                    if (map) {

                        map.panTo({
                            lat: latitude,
                            lng: longitude
                        });

                        map.setZoom(17);
                    }


                    // =================================================
                    // SEND LOCATION TO PARENT COMPONENT
                    // =================================================

                    onLocationSelect({

                        latitude: latitude,

                        longitude: longitude,

                        name:
                            place.name || "",

                        address:
                            place.formatted_address || "",

                        components:
                            place.address_components || []

                    });

                }
            );


        // =================================================
        // CLEANUP
        // =================================================

        return () => {

            listener.remove();

        };

    }, [
        placesLib,
        map,
        onLocationSelect
    ]);


    // =================================================
    // SEARCH INPUT UI
    // =================================================

    return (

        <div
            style={{
                position: "absolute",

                top: "20px",

                left: "50%",

                transform:
                    "translateX(-50%)",

                zIndex: 1000,

                width: "420px",

                maxWidth: "90%"
            }}
        >

            <input

                ref={inputRef}

                type="text"

                placeholder="Search street / area in Madurai"

                style={{

                    width: "100%",

                    padding: "14px 16px",

                    fontSize: "16px",

                    borderRadius: "8px",

                    border:
                        "1px solid #ccc",

                    outline: "none",

                    boxShadow:
                        "0 2px 8px rgba(0,0,0,0.2)",

                    boxSizing: "border-box"

                }}

            />

        </div>

    );

}


// =====================================================
// MAIN GOOGLE MAP COMPONENT
// =====================================================

function GoogleMapTest() {


    // =================================================
    // DEFAULT LOCATION - MADURAI
    // =================================================

    const defaultLocation = {

        lat: 9.9252,

        lng: 78.1198

    };


    // =================================================
    // SELECTED LOCATION STATE
    // =================================================

    const [
        selectedLocation,
        setSelectedLocation
    ] = useState(
        defaultLocation
    );


    // =================================================
    // LOCATION SELECT HANDLER
    // =================================================

    const handleLocationSelect =
        (location) => {

            console.log(
                "Location Selected:",
                location
            );


            setSelectedLocation({

                lat:
                    location.latitude,

                lng:
                    location.longitude

            });

        };


    // =================================================
    // GOOGLE MAP
    // =================================================

    return (

        <APIProvider

            apiKey={
                import.meta.env
                    .VITE_GOOGLE_MAPS_API_KEY
            }

        >

            <div
                style={{

                    width: "100%",

                    height: "100vh",

                    position: "relative"

                }}
            >

                {/* =========================================
                    LOCATION SEARCH
                ========================================= */}

                <LocationSearch
                    onLocationSelect={
                        handleLocationSelect
                    }
                />


                {/* =========================================
                    GOOGLE MAP
                ========================================= */}

                <Map

                    defaultCenter={
                        defaultLocation
                    }

                    defaultZoom={13}

                    mapId={
                        "SMART_GRIEVANCE_MAP"
                    }

                >

                    {/* =====================================
                        SELECTED LOCATION MARKER
                    ===================================== */}

                    <AdvancedMarker

                        position={
                            selectedLocation
                        }

                    />

                </Map>

            </div>

        </APIProvider>

    );

}


// =====================================================
// EXPORT
// =====================================================

export default GoogleMapTest;