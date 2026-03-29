# 🚗 Smart Campus Parking System

An AI-powered smart parking management system designed to optimize vehicle entry, slot allocation, and real-time parking tracking within a campus.

---

## 📌 Problem Statement

Campus parking is often inefficient due to:

* Lack of real-time slot visibility
* Manual entry/exit causing delays
* Poor space utilization
* No intelligent routing to nearest available slot

---

## 💡 Solution

This system provides a **smart, automated parking experience** using:

* QR / RFID-based vehicle entry
* AI-powered slot suggestion
* Real-time parking availability tracking
* Intelligent routing to nearest free slot

---

## ✨ Key Features

### 🚘 Smart Entry System

* QR Code scanning for users
* RFID-based entry for security/admin
* Automatic boom barrier control (concept)

### 🧠 AI Slot Suggestion

* Suggests best available parking slot
* Considers distance, availability, and zone

### 📊 Real-Time Dashboard

* Live slot availability (Free / Reserved / Occupied)
* Zone-wise parking data

### 🗺️ Navigation Support

* Guides user to nearest available parking slot

### 🔐 Admin Panel

* Manual vehicle entry (for guards)
* Vehicle number validation
* Parking status control

---

## 🏗️ System Architecture

```id="arch"}
User App (React Native / Expo)
        ↓
Backend API (Node.js)
        ↓
Database (Replit DB / MongoDB)
        ↓
AI Logic (Slot Allocation Engine)
```

---

## 🛠️ Tech Stack

* **Frontend:** React Native (Expo)
* **Backend:** Node.js / Express
* **Database:** MongoDB
* **APIs:** Maps API (for navigation)
* **Authentication:** QR / RFID simulation

---

## 📱 Screenshots

> Add your app screenshots here

* Home Screen
* Parking Zones
* AI Slot Suggestion

---

## 🚀 How to Run

```bash id="run"}
# Clone repo
git clone https://github.com/kss1510/smart-parking-system.git

# Install dependencies
npm install

# Run project
npm start
```

---

## 🎯 Future Enhancements

* Real hardware RFID integration
* FastTag-like automatic billing system
* ML-based parking prediction
* Mobile notifications for slot updates

---

## 🌍 Real-World Impact

* Reduces traffic congestion inside campus
* Saves time for students & staff
* Improves parking efficiency
* Scalable for malls, airports, smart cities

---

## 👨‍💻 Author

**Suhas Kotha**

---

## ⭐ Give a Star!

If you like this project, consider giving it a ⭐ on GitHub!
