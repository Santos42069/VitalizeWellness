# 💧 Vitalize Wellness — IV Therapy Clinic Website

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000)](https://expressjs.com/)
[![OWASP](https://img.shields.io/badge/OWASP%20Top%2010-compliant-brightgreen)](https://owasp.org/)

> A modern, secure, and visually elegant static website for a luxury IV therapy clinic, featuring a fully hardened contact form backend.

---

## 📖 Overview

This repository contains the complete source code for **Vitalize Wellness**, a premium IV therapy and wellness clinic website. The frontend is built with vanilla HTML, CSS, and JavaScript, and includes a fully secure **Node.js/Express backend** that processes contact form submissions.

The backend is designed with **security-first** principles:
- **No API keys exposed** in client-side code.
- **Strict input validation** using Joi schemas.
- **Rate limiting** (IP‑based) to prevent abuse.
- **OWASP‑compliant** headers and practices.
- All sensitive credentials stored in **environment variables**.

The site is fully responsive, visually cohesive, and includes all the original static pages: Home, IV Therapies, Weight Loss, About Us, and Contact.

---

## ✨ Features

### Frontend
- Elegant, spa‑like design with a warm, luxurious aesthetic.
- Fully responsive (mobile‑first) layout.
- Smooth fade‑in animations on scroll.
- Dynamic image loading via a central configuration script.
- Interactive navigation with active state tracking.

### Backend (Secure API)
- **POST `/api/contact`** – receives form data, validates, and forwards to EmailJS.
- **Rate limiting**:
  - Global: 1000 requests/min (for static assets).
  - Form: 10 submissions per IP per 15 minutes.
- **Input validation**:
  - All required fields enforced.
  - Type checks, length limits, and regex patterns (e.g., phone, email).
  - Rejects unexpected fields (`unknown(false)`).
- **Environment‑based secrets** – no credentials hard‑coded.
- **Security middleware**:
  - Helmet.js (secure HTTP headers).
  - CORS restricted to your domain.
  - JSON payload size limited to 10KB.
- **Logging** with Winston (no sensitive data logged in production).
- **Graceful error handling** – generic error messages, no stack traces leaked.

---

## 🛠️ Tech Stack

| Layer       | Technology                                                                 |
|-------------|----------------------------------------------------------------------------|
| **Frontend**| HTML5, CSS3, Vanilla JavaScript (no frameworks)                           |
| **Backend** | Node.js, Express 4.x                                                      |
| **Validation** | Joi                                                                |
| **Security**| Helmet, Express Rate Limit, CORS, dotenv                                  |
| **Email**   | EmailJS REST API (server‑side calls)                                      |
| **Logging** | Winston                                                                   |
| **Hosting** | Any Node.js‑compatible platform (e.g., Heroku, DigitalOcean, AWS, Vercel) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vitalize-wellness.git
   cd vitalize-wellness
