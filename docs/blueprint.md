# **App Name**: DigitFlow

## Core Features:

- Deriv WebSocket Data Stream: Establishes a real-time WebSocket connection to Deriv API (App ID 84799), maintains a 1000-tick history buffer with rolling-array memory management, prevents duplicate ticks, and automatically reconnects upon disconnection.
- Live Digit Distribution Display: Displays the last digit (0-9) distribution in real-time, showing live percentages for each digit within separate UI cards and updating instantly with every new tick.
- Adjustable Tick Analysis Window: Allows users to select and apply a custom analysis window (1 to 500 recent ticks) from the underlying 1000-tick buffer, recalculating and updating the digit percentages immediately upon selection change.
- Precise Percentage Calculation: Performs accurate digit percentage calculations, ensuring each digit's percentage is displayed with exactly one decimal place, and the sum of all percentages always totals precisely 100%.
- Dashboard Status & Performance Indicators: Provides real-time feedback on the application's status by displaying a live tick counter, connection status, the current active trading symbol, and a stream speed indicator.
- Animated & Responsive UI: Delivers a smooth, real-time user experience with subtle animations for percentage updates and ensures a fully responsive design adaptable for both desktop and mobile devices.

## Style Guidelines:

- The application features a clean, dark-themed trading dashboard to provide a professional and focused experience. The primary color is a vibrant yet deep purple-blue (#551AFF), chosen for its modern, stable, and technological feel. The background color is a heavily desaturated, dark variation of the primary hue (#211F27), providing depth and reducing eye strain. An accent color, a bright sky blue (#2EB2FF), is used to highlight interactive elements and provide clear contrast.
- The 'Inter' sans-serif font is used for all text elements. Its clean, objective, and modern aesthetic aligns perfectly with the data analysis nature of the application, ensuring readability for both headlines and numerical displays.
- Utilize minimalist, line-based icons for all dashboard indicators (e.g., connection status, tick counter) and interactive controls. This reinforces the clean, modern aesthetic of a professional data analysis tool.
- A modular, card-based layout is employed for displaying digit distribution, with each digit (0-9) represented by an individual card. Other dashboard elements are organized logically around this central display, ensuring efficient use of space and clear data hierarchy across responsive desktop and mobile views.
- Implement subtle, smooth transition animations for real-time percentage updates within the digit cards and for any changes in dashboard indicators. This enhances the sense of dynamism and fluidity without causing distraction.