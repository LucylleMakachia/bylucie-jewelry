# ByLucie Jewelry

An online jewelry store web application combining a modern frontend and
backend to showcase, browse, and manage jewelry products. This project
contains both the frontend UI and a backend API, designed for
extensibility and e-commerce workflows.

------------------------------------------------------------------------

##  Overview

ByLucie Jewelry is a web platform for presenting and managing jewelry
products.

This repository contains:

-   bylucie-frontend/ --- User interface code
-   bylucie-backend/ --- Backend server and API
-   .gitignore --- Git ignored files

------------------------------------------------------------------------

##  Features

-   Jewelry product catalog
-   Product display and browsing
-   Backend API for managing products
-   Scalable full-stack architecture

------------------------------------------------------------------------

##  Architecture

Client-server structure:

Frontend:

-   Handles user interface
-   Displays products
-   Communicates with backend API

Backend:

-   Handles business logic
-   Manages product data
-   Provides API endpoints

------------------------------------------------------------------------

##  Getting Started

### Prerequisites

Install:

-   Node.js
-   pnpm

Install pnpm globally if not installed:

``` bash
npm install -g pnpm
```

------------------------------------------------------------------------

##  Frontend Setup

``` bash
cd bylucie-jewelry/bylucie-frontend
pnpm install
pnpm dev
```

------------------------------------------------------------------------

##  Backend Setup

If backend uses Node.js:

``` bash
cd bylucie-jewelry/bylucie-backend
pnpm install
pnpm dev
```

If backend uses Python:

``` bash
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
python app.py
```

------------------------------------------------------------------------

##  Project Structure

bylucie-jewelry/ bylucie-frontend/ bylucie-backend/ README.md

------------------------------------------------------------------------

##  Deployment

Build frontend:

``` bash
pnpm build
```

Deploy frontend and backend to hosting platform.

------------------------------------------------------------------------

## License

MIT License

------------------------------------------------------------------------

##  Author

Lucylle Makachia

GitHub: https://github.com/LucylleMakachia
