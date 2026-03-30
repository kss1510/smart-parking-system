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
* **Database:** PostgreSQL
* **APIs:** Maps API (for navigation)
* **Authentication:** QR / RFID simulation

---

## 📱 Screenshots

> Add your app screenshots here
> <img width="405" height="709" alt="image" src="https://github.com/user-attachments/assets/3726c763-e185-4eeb-a7bc-0d633270e95c" />
<img width="415" height="761" alt="image" src="https://github.com/user-attachments/assets/e771b5c7-092c-43da-9d89-1303625e84a2" />
<img width="374" height="811" alt="image" src="https://github.com/user-attachments/assets/ba37c248-5137-4e50-a2af-90842ea94845" />
<img width="334" height="710" alt="image" src="https://github.com/user-attachments/assets/66eee34f-926a-493f-8bff-75df83f0b032" />
<img width="357" height="714" alt="image" src="https://github.com/user-attachments/assets/8b0e792e-f249-46de-8644-e3fbf81bdcbd" />
<img width="381" height="680" alt="image" src="https://github.com/user-attachments/assets/5e16fd8b-c049-4758-8554-c57d41ffc533" />
<img width="363" height="717" alt="image" src="https://github.com/user-attachments/assets/92108f04-ee54-4a6d-a4f6-3f03e01c9ff4" />
<img width="717" height="1600" alt="image" src="https://github.com/user-attachments/assets/6b55c827-031f-4f3f-83f8-e5c2837af461" />
<img width="717" height="1600" alt="image" src="https://github.com/user-attachments/assets/fa30484c-8b6b-42c6-8ed0-5782ae45ac98" />
<img width="717" height="1600" alt="image" src="https://github.com/user-attachments/assets/d7318c53-ed78-4db3-9615-62fc41c3f07b" />
<img width="717" height="1600" alt="image" src="https://github.com/user-attachments/assets/401a53a5-8c13-4e08-85f1-e192f3d936a5" />




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

**Suhas Kotha, Siva Charan**

---

## ⭐ Give a Star!

If you like this project, consider giving it a ⭐ on GitHub!
