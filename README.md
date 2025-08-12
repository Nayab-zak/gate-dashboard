# Predictive Analytics Dashboard

This project is a Predictive Analytics Dashboard designed to visualize and analyze terminal operations data. It provides insights through various charts and heatmaps, enabling better decision-making.

## Features
- **Heatmaps**: Visualize terminal activity by hour.
- **Lollipop Charts**: Rank terminals based on performance.
- **Donut Charts**: Share of move types.
- **Stacked Area Charts**: Designation trends over time.
- **Fan Charts**: Forecasts for selected time ranges.

## Project Structure
- **backend/**: Contains the API and data processing logic.
  - `main.py`: Entry point for the backend server.
  - `routers/`: API endpoints for analytics, capacity, forecast, and metadata.
  - `utils/`: Utility functions for time-based operations.
- **frontend/**: Contains the React-based dashboard.
  - `src/app/`: Main application files.
  - `src/components/`: Reusable UI components.
  - `src/lib/`: API interaction logic.

## Prerequisites
- Docker and Docker Compose
- Node.js and npm

## Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Nayab-zak/gate-dashboard.git
   cd gate-dashboard
   ```
2. Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. Access the dashboard at `http://localhost:3000`.

## Backend Endpoints
- `/analytics`: Provides analytics data.
- `/capacity`: Capacity-related data.
- `/forecast`: Forecast data for terminals.
- `/meta`: Metadata about terminals.

## Frontend
The frontend is built with React and Tailwind CSS, providing a responsive and interactive user interface.

## License
This project is licensed under the MIT License.
