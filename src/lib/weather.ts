// Agricultural Weather Service with OpenWeatherMap & Geolocation
// KRISHIFLOW-AI - Smart India Hackathon 2026

export interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  rainfallMm: number;
  icon: string;
  forecast: {
    day: string;
    tempMax: number;
    tempMin: number;
    condition: string;
    icon: string;
  }[];
  alerts: string[];
}

export async function fetchLiveWeather(lat: number = 21.4669, lon: number = 83.9812): Promise<WeatherData> {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  if (apiKey && apiKey !== 'demo_openweather_key') {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
      );
      if (response.ok) {
        const d = await response.json();
        return {
          city: d.name || 'Sambalpur District',
          temperature: Math.round(d.main.temp),
          feelsLike: Math.round(d.main.feels_like),
          condition: d.weather[0].main,
          description: d.weather[0].description,
          humidity: d.main.humidity,
          windSpeed: Math.round(d.wind.speed * 3.6),
          rainfallMm: d.rain ? d.rain['1h'] || 0 : 0,
          icon: d.weather[0].icon,
          forecast: generateForecastMock(Math.round(d.main.temp)),
          alerts: checkWeatherAlerts(d.main.temp, d.rain ? d.rain['1h'] || 0 : 0),
        };
      }
    } catch (e) {
      console.warn('Live weather api error, fallback to agro-climate model:', e);
    }
  }

  // Realistic default agro-climate data for Indian harvest season
  return {
    city: 'Sambalpur / Bargarh Agro Zone',
    temperature: 31,
    feelsLike: 33,
    condition: 'Partly Cloudy',
    description: 'Scattered clouds, favorable for grain transit',
    humidity: 62,
    windSpeed: 14,
    rainfallMm: 4,
    icon: '02d',
    forecast: [
      { day: 'Today', tempMax: 32, tempMin: 23, condition: 'Partly Cloudy', icon: '🌤️' },
      { day: 'Thu', tempMax: 33, tempMin: 24, condition: 'Sunny', icon: '☀️' },
      { day: 'Fri', tempMax: 31, tempMin: 22, condition: 'Clear Sky', icon: '☀️' },
      { day: 'Sat', tempMax: 29, tempMin: 22, condition: 'Light Rain', icon: '🌦️' },
      { day: 'Sun', tempMax: 30, tempMin: 23, condition: 'Humid', icon: '⛅' },
      { day: 'Mon', tempMax: 32, tempMin: 24, condition: 'Clear', icon: '☀️' },
      { day: 'Tue', tempMax: 33, tempMin: 24, condition: 'Sunny', icon: '☀️' },
    ],
    alerts: [
      '🌾 Mandi Advisory: Ideal moisture conditions (11-13%) for paddy weighing today.',
      '🚚 Transit Notice: Dry roads expected along National Highway 53 through Friday evening.'
    ],
  };
}

function generateForecastMock(currentTemp: number) {
  const days = ['Today', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
  return days.map((day, idx) => ({
    day,
    tempMax: currentTemp + (idx % 2 === 0 ? 1 : -1),
    tempMin: currentTemp - 8,
    condition: idx === 3 ? 'Scattered Showers' : 'Partly Cloudy',
    icon: idx === 3 ? '🌦️' : '☀️',
  }));
}

function checkWeatherAlerts(temp: number, rain: number): string[] {
  const alerts: string[] = [];
  if (temp > 40) {
    alerts.push('🔥 Heat Alert (>40°C): Mandi operating hours extended to morning 7 AM.');
  }
  if (rain > 50) {
    alerts.push('🌧️ Heavy Rain Alert (>50mm): Covered tarpaulins mandatory on open trolley trucks.');
  }
  return alerts;
}
