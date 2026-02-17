import { useState, useEffect } from "react";
import { Cloud, Sun, Loader2, CloudRain, CloudSnow, CloudLightning } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export function WeatherWidget() {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Update time every second
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Fetch weather for a default location (e.g., Lagos, since name "Ateniola" suggests usage there or generic)
        // Using Open-Meteo (Free, no key)
        // Lagos Coords: 6.5244, 3.3792
        const fetchWeather = async () => {
            try {
                // Try to get user location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                        getWeatherData(position.coords.latitude, position.coords.longitude);
                    }, () => {
                        // Default to Lagos
                        getWeatherData(6.5244, 3.3792);
                    });
                } else {
                    getWeatherData(6.5244, 3.3792);
                }
            } catch (e) {
                console.error("Weather fetch error", e);
                setError(true);
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    const getWeatherData = async (lat: number, lon: number) => {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const data = await res.json();
            setWeather(data.current_weather);
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    const getWeatherIcon = (code: number) => {
        if (code <= 3) return <Sun className="h-8 w-8 text-yellow-500" />;
        if (code <= 57) return <Cloud className="h-8 w-8 text-gray-500" />;
        if (code <= 67) return <CloudRain className="h-8 w-8 text-blue-500" />;
        if (code <= 77) return <CloudSnow className="h-8 w-8 text-white" />;
        if (code <= 99) return <CloudLightning className="h-8 w-8 text-purple-500" />;
        return <Sun className="h-8 w-8 text-yellow-500" />;
    }

    return (
        <Card className="col-span-1 md:col-span-2 text-white bg-gradient-to-r from-blue-500 to-indigo-600 border-none shadow-lg">
            <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-lg font-medium opacity-90">{format(currentTime, "EEEE, MMMM do")}</p>
                    <h2 className="text-4xl font-bold tracking-tight">{format(currentTime, "h:mm:ss a")}</h2>
                </div>

                <div className="flex items-center gap-4">
                    {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : error ? (
                        <div className="text-xs opacity-70">Weather unavailable</div>
                    ) : (
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                {getWeatherIcon(weather?.weathercode)}
                                <span className="text-4xl font-bold">{weather?.temperature}°C</span>
                            </div>
                            <p className="text-sm opacity-80 mt-1">Wind: {weather?.windspeed} km/h</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
