import { useEffect, useMemo, useRef, useState } from "react";
import * as api from "./api";
import { ClassesPage } from "./pages/ClassesPage";
import { SubmissionsPage } from "./pages/SubmissionsPage";
import { UpdatesPage } from "./pages/UpdatesPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CodeLabPage } from "./pages/CodeLabPage";
import { useIsNarrow } from "./useIsNarrow";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Track = api.Track;
type Role = api.Role;
type TabId = "dashboard" | "classes" | "lab" | "submissions" | "leaderboard" | "posters" | "profile";
type LangId = "arduino" | "cpp" | "python" | "html" | "js" | "scratch";

type User = api.User;

interface ClassSession {
  id: string; day: number; title: string; track: Track | "All";
  topic: string; time: string; mentor: string; status: "done" | "live" | "upcoming";
  objectives: string[]; materials: string[]; recordingUrl?: string;
}

interface Submission {
  id: string; studentId: string; studentName: string; track: Track;
  title: string; type: "code" | "assembly" | "project" | "quiz";
  submittedAt: string; status: "pending" | "reviewed" | "approved" | "needs-revision";
  score?: number; feedback?: string; fileType: string; xpAwarded?: number;
}

interface Announcement {
  id: string; type: "urgent" | "info" | "event" | "achievement";
  title: string; body: string; date: string; pinned: boolean;
}

// ─── DATA (fallback-only; replaced by backend fetch) ───────────────────────────
const CLASSES_FALLBACK: ClassSession[] = [
  { id:"c1", day:1, title:"Orientation & Lab Setup", track:"All", topic:"Welcome to TechM4Schools Summer Bootcamp 2025", time:"9:00 AM – 11:00 AM", mentor:"Rahul Sir", status:"done", objectives:["Meet your team","Understand bootcamp structure","Set up workstations","Safety protocols"], materials:["Bootcamp handbook","Lab safety guide"] },
  { id:"c2", day:2, title:"Electronics Fundamentals", track:"Robotics", topic:"Ohm's Law, Circuits & Arduino IDE Setup", time:"9:00 AM – 12:00 PM", mentor:"Pradeep Sir", status:"done", objectives:["Understand voltage, current, resistance","Set up Arduino IDE","First blink program","Breadboard basics"], materials:["Arduino Uno","USB cable","LED","Resistors","Breadboard"] },
  { id:"c3", day:3, title:"HTML & CSS Crash Course", track:"Coding", topic:"Building your first webpage from scratch", time:"9:00 AM – 12:00 PM", mentor:"Sneha Ma'am", status:"done", objectives:["HTML structure","CSS styling","Responsive basics","Deploy to GitHub"], materials:["Laptop","VS Code","GitHub account"] },
  { id:"c4", day:4, title:"Drone Anatomy & Physics", track:"Drone", topic:"How drones fly — thrust, lift, physics of flight", time:"9:00 AM – 12:00 PM", mentor:"Vikram Sir", status:"done", objectives:["Drone parts identification","Physics of quadcopter flight","Safety rules","Pre-flight checklist"], materials:["Drone kit","Safety glasses","Pre-flight checklist sheet"] },
  { id:"c5", day:5, title:"Python for AI", track:"AI", topic:"Variables, loops, functions — the building blocks", time:"9:00 AM – 12:00 PM", mentor:"Ananya Ma'am", status:"done", objectives:["Python syntax basics","Data types","Control flow","First ML-ready script"], materials:["Laptop","Python 3 installed","Jupyter notebook"] },
  { id:"c6", day:6, title:"Design Thinking Workshop", track:"Innovation", topic:"From problem to prototype in one day", time:"9:00 AM – 12:00 PM", mentor:"Ravi Sir", status:"done", objectives:["Problem framing","User empathy","Rapid ideation","Paper prototype"], materials:["Sticky notes","Markers","Paper","Feedback cards"] },
  { id:"c7", day:7, title:"Arduino Servo & Sensors", track:"Robotics", topic:"Controlling servo motors with HC-SR04 ultrasonic sensor", time:"9:00 AM – 12:00 PM", mentor:"Pradeep Sir", status:"live", objectives:["Wire servo motor to Uno","Read ultrasonic distance","Obstacle-avoiding logic","Serial monitor debugging"], materials:["Arduino Uno","Servo motor","HC-SR04 sensor","Jumper wires","Breadboard"] },
  { id:"c8", day:8, title:"JavaScript & DOM Manipulation", track:"Coding", topic:"Making pages interactive with vanilla JS", time:"9:00 AM – 12:00 PM", mentor:"Sneha Ma'am", status:"upcoming", objectives:["Event listeners","DOM manipulation","Fetch API basics","Build a live quiz app"], materials:["Laptop","Browser DevTools"] },
  { id:"c9", day:9, title:"First Drone Flight", track:"Drone", topic:"Indoor hover, yaw, pitch, roll — controlled flying", time:"9:00 AM – 12:00 PM", mentor:"Vikram Sir", status:"upcoming", objectives:["Pre-flight check","Indoor hover test","Basic manoeuvres","Record footage"], materials:["Drone kit","Spare props","Safety nets","GoPro"] },
  { id:"c10", day:10, title:"Machine Learning Basics", track:"AI", topic:"Supervised learning, datasets, training your first model", time:"9:00 AM – 12:00 PM", mentor:"Ananya Ma'am", status:"upcoming", objectives:["What is ML?","scikit-learn intro","Train/test split","Accuracy metrics"], materials:["Laptop","Google Colab","Dataset CSV"] },
  { id:"c11", day:15, title:"Mid-Bootcamp Hackathon", track:"All", topic:"48-hour cross-track team challenge", time:"All Day", mentor:"All Mentors", status:"upcoming", objectives:["Form cross-track teams","Build working prototype","Present to judges","Win prizes"], materials:["All lab resources","3D pen","Arduino kits"] },
  { id:"c12", day:30, title:"🎓 Demo Day & Graduation", track:"All", topic:"Showcase your 30-day project to parents & industry guests", time:"10:00 AM – 6:00 PM", mentor:"All Mentors", status:"upcoming", objectives:["Live project demos","Certificate ceremony","Alumni network launch","Celebration!"], materials:["Your project","Presentation slides","Parent invite"] },
];

const SUBMISSIONS_FALLBACK: Submission[] = [
  { id:"s1", studentId:"stu1", studentName:"Aditya Sharma", track:"Robotics", title:"LED Blink Program", type:"code", submittedAt:"Day 2, 11:45 AM", status:"approved", score:95, feedback:"Excellent work! Clean code and proper comments. Try PWM next!", fileType:"Arduino (.ino)", xpAwarded:100 },
  { id:"s2", studentId:"stu1", studentName:"Aditya Sharma", track:"Robotics", title:"Breadboard Circuit Assembly", type:"assembly", submittedAt:"Day 2, 12:00 PM", status:"approved", score:88, feedback:"Good circuit! Check your ground connections next time.", fileType:"Photo (JPG)", xpAwarded:75 },
  { id:"s3", studentId:"stu1", studentName:"Aditya Sharma", track:"Robotics", title:"Servo Motor Control", type:"code", submittedAt:"Day 7, 11:30 AM", status:"pending", fileType:"Arduino (.ino)" },
  { id:"s4", studentId:"stu2", studentName:"Priya Reddy", track:"AI", title:"Python Score Calculator", type:"code", submittedAt:"Day 5, 11:00 AM", status:"approved", score:100, feedback:"Perfect! Can you extend this to plot a histogram?", fileType:"Python (.py)", xpAwarded:130 },
  { id:"s5", studentId:"stu2", studentName:"Priya Reddy", track:"AI", title:"Obstacle Avoider (Team)", type:"assembly", submittedAt:"Day 6, 12:00 PM", status:"needs-revision", feedback:"Ultrasonic sensor not reading correctly. Check wiring of TRIG pin.", fileType:"Video (MP4)" },
];

const ANNOUNCEMENTS_FALLBACK: Announcement[] = [
  { id:"a1", type:"urgent", title:"⚡ Demo Day Registration Open!", body:"Register your project before May 25. All tracks must submit a project title and 2-line description to their mentor.", date:"Today · 9:00 AM", pinned:true },
  { id:"a2", type:"info", title:"Arduino IDE Update — Download v2.3.2", body:"Update your Arduino IDE to v2.3.2. New features: better Serial Monitor, auto-format shortcut Ctrl+T, improved board manager.", date:"Today · 8:30 AM", pinned:false },
  { id:"a3", type:"event", title:"🏆 Mid-Bootcamp Hackathon — Day 15", body:"48-hour hackathon! Form cross-track teams of 4. Theme revealed Day 14 evening. Top 3 teams win special maker kits worth ₹5,000.", date:"Yesterday", pinned:false },
  { id:"a4", type:"achievement", title:"🥇 Week 1 Results Announced", body:"Congrats Arjun Reddy (1st), Priya Sharma (2nd), Rishi Kumar (3rd)! Week 2 resets Day 8. Keep building!", date:"2 days ago", pinned:false },
  { id:"a5", type:"info", title:"Drone Track — Outdoor Session Day 9", body:"Day 9 Drone session moved outdoors to school grounds. Wear comfortable shoes, bring your kit and water bottle.", date:"3 days ago", pinned:false },
];

const LEADERBOARD_FALLBACK = [
  { rank:1, name:"Arjun Reddy", track:"AI", xp:4210, streak:12, tasks:48, avatar:"AR", color:"#7C3AED" },
  { rank:2, name:"Priya Sharma", track:"Coding", xp:3820, streak:9, tasks:44, avatar:"PS", color:"#0EA5E9" },
  { rank:3, name:"Rishi Kumar", track:"Robotics", xp:3560, streak:7, tasks:41, avatar:"RK", color:"#F59E0B" },
  { rank:4, name:"Aditya Sharma", track:"Robotics", xp:2840, streak:5, tasks:34, avatar:"AS", color:"#10B981", isMe:true },
  { rank:5, name:"Divya Nair", track:"Drone", xp:2700, streak:6, tasks:32, avatar:"DN", color:"#EF4444" },
  { rank:6, name:"Kiran Rao", track:"Innovation", xp:2550, streak:4, tasks:30, avatar:"KR", color:"#8B5CF6" },
  { rank:7, name:"Sneha Patel", track:"AI", xp:2400, streak:8, tasks:28, avatar:"SP", color:"#06B6D4" },
  { rank:8, name:"Rohit Verma", track:"Coding", xp:2200, streak:3, tasks:26, avatar:"RV", color:"#F97316" },
] as const;

const CODE_TEMPLATES: Record<LangId, { label: string; icon: string; starter: string; description: string }> = {
  arduino: {
    label: "Arduino", icon: "⚡",
    description: "Arduino C/C++ — runs on Uno, Nano, Mega",
    starter: `// TechM4Schools — Arduino Day 7
// Obstacle Avoiding Robot with HC-SR04

// Pin definitions
const int TRIG_PIN = 9;
const int ECHO_PIN = 10;
const int SERVO_PIN = 6;
const int LED_PIN = 13;

// Variables
long duration;
int distance;
int servoAngle = 90;

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("TechM4Schools Robot Ready!");
}

void loop() {
  // Measure distance
  distance = measureDistance();
  
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");
  
  if (distance < 20) {
    // Obstacle detected!
    digitalWrite(LED_PIN, HIGH);
    Serial.println("OBSTACLE! Turning...");
    // TODO: Add motor turn logic here
    delay(500);
  } else {
    digitalWrite(LED_PIN, LOW);
    // TODO: Move forward
  }
  
  delay(100);
}

int measureDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  duration = pulseIn(ECHO_PIN, HIGH);
  return duration * 0.034 / 2;
}`
  },
  cpp: {
    label: "C++", icon: "🔷",
    description: "C++ for robotics logic and algorithms",
    starter: `// TechM4Schools — C++ Challenge
// PID Controller for Robot

#include <iostream>
#include <cmath>
using namespace std;

class PIDController {
private:
  double Kp, Ki, Kd;
  double prevError, integral;
  
public:
  PIDController(double p, double i, double d)
    : Kp(p), Ki(i), Kd(d), prevError(0), integral(0) {}
  
  double compute(double setpoint, double measured) {
    double error = setpoint - measured;
    integral += error;
    double derivative = error - prevError;
    prevError = error;
    return Kp * error + Ki * integral + Kd * derivative;
  }
};

int main() {
  PIDController pid(1.2, 0.01, 0.5);
  double setpoint = 100.0; // Target distance: 100cm
  double position = 0.0;
  
  cout << "TechM4Schools PID Simulation" << endl;
  
  for (int i = 0; i < 20; i++) {
    double output = pid.compute(setpoint, position);
    position += output * 0.1; // Simulate movement
    cout << "Step " << i << ": Pos=" << position 
         << " Output=" << output << endl;
  }
  
  return 0;
}`
  },
  python: {
    label: "Python", icon: "🐍",
    description: "Python for AI, data analysis, automation",
    starter: `# TechM4Schools — Python AI Challenge
# Train a simple classifier on sensor data

import json

# Simulated sensor readings dataset
# Format: [temperature, humidity, light] → condition
dataset = [
  ([25, 60, 800], "normal"),
  ([35, 80, 200], "hot_humid"),
  ([15, 30, 900], "cold_dry"),
  ([28, 65, 750], "normal"),
  ([38, 85, 100], "hot_humid"),
]

def simple_classifier(temp, humidity, light):
    """Rule-based classifier (before ML)"""
    if temp > 32 and humidity > 75:
        return "hot_humid"
    elif temp < 20 and humidity < 40:
        return "cold_dry"
    else:
        return "normal"

def calculate_accuracy(dataset):
    correct = 0
    for features, label in dataset:
        predicted = simple_classifier(*features)
        if predicted == label:
            correct += 1
        print(f"Temp:{features[0]}°C Hum:{features[1]}% → "
              f"Predicted:{predicted} Actual:{label} "
              f"{'✓' if predicted == label else '✗'}")
    return (correct / len(dataset)) * 100

print("=== TechM4Schools Sensor Classifier ===")
accuracy = calculate_accuracy(dataset)
print(f"\\nAccuracy: {accuracy:.1f}%")
print("\\nNow try: improve the rules to get 100%!")`
  },
  html: {
    label: "HTML/CSS", icon: "🌐",
    description: "Web development — HTML, CSS, JavaScript",
    starter: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My TechM4Schools Project</title>
  <style>
    :root {
      --primary: #10B981;
      --accent: #F59E0B;
      --bg: #F0FDF4;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: var(--bg);
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 500px;
      margin: 0 auto;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    h1 { color: var(--primary); margin-bottom: 8px; }
    .badge {
      display: inline-block;
      background: var(--accent);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      margin: 4px;
    }
    .sensor-box {
      background: #F0FDF4;
      border: 2px solid var(--primary);
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
      text-align: center;
    }
    .big-number {
      font-size: 48px;
      font-weight: 700;
      color: var(--primary);
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🤖 My Robot Dashboard</h1>
    <p style="color:#666;margin-bottom:16px">TechM4Schools Day 7</p>
    
    <span class="badge">Robotics Track</span>
    <span class="badge">Grade 9</span>
    
    <div class="sensor-box">
      <div style="font-size:12px;color:#666;margin-bottom:4px">DISTANCE SENSOR</div>
      <div class="big-number" id="distance">--</div>
      <div style="color:#666">cm</div>
    </div>
    
    <button onclick="readSensor()" style="
      width:100%;margin-top:16px;padding:12px;
      background:var(--primary);color:white;border:none;
      border-radius:10px;font-size:16px;cursor:pointer;
    ">📡 Read Sensor</button>
    
    <div id="log" style="margin-top:16px;font-family:monospace;font-size:12px;color:#666"></div>
  </div>
  
  <script>
    let readings = [];
    function readSensor() {
      const dist = Math.floor(Math.random() * 150 + 5);
      document.getElementById('distance').textContent = dist;
      readings.push(dist);
      const log = document.getElementById('log');
      log.innerHTML = readings.slice(-5).reverse()
        .map(r => \`Distance: \${r} cm \${r < 20 ? '⚠️ OBSTACLE' : '✅'}\`)
        .join('<br>');
    }
  </script>
</body>
</html>`
  },
  js: {
    label: "JavaScript", icon: "⚡",
    description: "JavaScript — algorithms, DOM, APIs",
    starter: `// TechM4Schools — JavaScript Challenge
// Gamification XP & Level System

class Student {
  constructor(name, track) {
    this.name = name;
    this.track = track;
    this.xp = 0;
    this.level = 1;
    this.badges = [];
    this.taskHistory = [];
  }
  
  addXP(amount, reason) {
    this.xp += amount;
    this.taskHistory.push({ amount, reason, time: new Date().toLocaleTimeString() });
    
    const newLevel = Math.floor(this.xp / 500) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      console.log(\`🎉 LEVEL UP! \${this.name} is now Level \${this.level}!\`);
      this.checkBadges();
    }
    console.log(\`+\${amount} XP → \${this.xp} total (Level \${this.level})\`);
  }
  
  checkBadges() {
    if (this.level >= 5 && !this.badges.includes("🔥 On Fire")) {
      this.badges.push("🔥 On Fire");
      console.log("Badge earned: 🔥 On Fire!");
    }
    if (this.xp >= 1000 && !this.badges.includes("⭐ Century")) {
      this.badges.push("⭐ Century");
      console.log("Badge earned: ⭐ Century!");
    }
  }
  
  getStats() {
    const xpToNext = (this.level * 500) - this.xp;
    return {
      name: this.name, track: this.track,
      xp: this.xp, level: this.level,
      xpToNextLevel: xpToNext, badges: this.badges
    };
  }
}

// Test it out!
const student = new Student("Aditya", "Robotics");
student.addXP(250, "Completed LED Blink");
student.addXP(100, "Quiz passed");
student.addXP(300, "Assembly submitted");
student.addXP(200, "Peer helped");
student.addXP(500, "Project completed");

console.log("\\n=== Final Stats ===");
console.log(JSON.stringify(student.getStats(), null, 2));`,
  },
  scratch: {
    label: "Pseudocode", icon: "📝",
    description: "Algorithm design & pseudocode planning",
    starter: `// TechM4Schools — Algorithm Design
// Plan your robot's logic before coding it

/*
PSEUDOCODE: Obstacle Avoiding Robot

ALGORITHM: SmartAvoid v1.0
AUTHOR: [Your Name]
DATE: Day 7 — Servo & Sensors

=== INPUTS ===
- Distance sensor (HC-SR04) on pins 9, 10
- 2x DC motors (left, right)
- Servo motor (for sensor scanning)

=== ALGORITHM ===

BEGIN
  SETUP:
    Initialize all pins
    Set servo to center (90°)
    Set motors to STOP
    Print "Robot Ready"
  
  LOOP:
    distance ← measureDistance()
    
    IF distance < 15 cm THEN
      STOP motors
      SCAN left (servo 0°) → leftDist
      SCAN right (servo 180°) → rightDist
      SCAN center (servo 90°)
      
      IF leftDist > rightDist THEN
        TURN LEFT for 0.5 seconds
      ELSE
        TURN RIGHT for 0.5 seconds
      END IF
      
    ELSE IF distance < 30 cm THEN
      SLOW DOWN motors to 50% speed
      
    ELSE
      MOVE FORWARD at full speed
    END IF
    
    WAIT 100ms
  END LOOP
END

=== COMPLEXITY ===
Time: O(1) per loop iteration
Space: O(1) — no data structures needed

=== NEXT STEP ===
Convert this pseudocode to Arduino C++!
*/

// Your pseudocode here:
BEGIN
  // Write your algorithm for today's project
END`
  }
};

// ─── COLORS & HELPERS ─────────────────────────────────────────────────────────
const TRACK_COLORS: Record<string, { bg: string; text: string; border: string; light: string }> = {
  Robotics:   { bg:"#FFF7ED", text:"#C2410C", border:"#FDBA74", light:"#FEF3C7" },
  Coding:     { bg:"#ECFDF5", text:"#059669", border:"#6EE7B7", light:"#D1FAE5" },
  Drone:      { bg:"#EFF6FF", text:"#1D4ED8", border:"#93C5FD", light:"#DBEAFE" },
  AI:         { bg:"#FAF5FF", text:"#7C3AED", border:"#C4B5FD", light:"#EDE9FE" },
  Innovation: { bg:"#FFF1F2", text:"#BE185D", border:"#FDA4AF", light:"#FFE4E6" },
  All:        { bg:"#F0FDF4", text:"#15803D", border:"#86EFAC", light:"#DCFCE7" },
};

const STATUS_COLORS = {
  approved:       { bg:"#ECFDF5", text:"#059669", dot:"#10B981" },
  pending:        { bg:"#FFFBEB", text:"#B45309", dot:"#F59E0B" },
  "needs-revision":{ bg:"#FEF2F2", text:"#DC2626", dot:"#EF4444" },
  reviewed:       { bg:"#EFF6FF", text:"#1D4ED8", dot:"#3B82F6" },
};

const trackIcon: Record<string, string> = {
  Robotics:"🤖", Coding:"💻", Drone:"🚁", AI:"🧠", Innovation:"💡", All:"📚"
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const Avatar = ({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", background: color,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: size * 0.35,
    fontFamily: "'DM Mono', monospace", flexShrink: 0,
  }}>{initials}</div>
);

const XPBar = ({ xp, level }: { xp: number; level: number }) => {
  const current = xp % 500;
  const pct = (current / 500) * 100;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color:"#64748B" }}>Level {level}</span>
        <span style={{ fontSize: 12, color:"#64748B" }}>{current} / 500 XP</span>
      </div>
      <div style={{ height: 8, background:"#E2E8F0", borderRadius: 8, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg, #10B981, #F59E0B)", borderRadius: 8, transition:"width 0.6s ease" }} />
      </div>
      <div style={{ fontSize: 11, color:"#10B981", marginTop: 4 }}>{500 - current} XP to Level {level + 1}</div>
    </div>
  );
};

const Badge = ({ type }: { type: "urgent"|"info"|"event"|"achievement" }) => {
  const styles = {
    urgent:      { bg:"#FEF2F2", text:"#DC2626" },
    info:        { bg:"#EFF6FF", text:"#1D4ED8" },
    event:       { bg:"#FAF5FF", text:"#7C3AED" },
    achievement: { bg:"#FFFBEB", text:"#B45309" },
  };
  const s = styles[type];
  return <span style={{ background: s.bg, color: s.text, fontSize: 10, fontWeight: 600, padding:"2px 8px", borderRadius: 20, textTransform:"uppercase", letterSpacing:"0.06em" }}>{type}</span>;
};

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [email, setEmail] = useState("admin@demo.techm4schools.local");
  const [password, setPassword] = useState("ChangeMe_Admin_12345");
  const [err, setErr] = useState("");
  const [animating, setAnimating] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) { setErr("Enter email and password"); return; }
    setAnimating(true);
    setErr("");
    try {
      const res = await api.login(email.trim(), password);
      api.setAccessToken(res.accessToken);
      onLogin(res.user);
    } catch (e: any) {
      setErr(e?.message?.includes("Invalid credentials") ? "Invalid credentials" : (e?.message ?? "Login failed"));
    } finally {
      setAnimating(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 40%, #EFF6FF 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding: 16 }}>
      <div style={{ width:"100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🚀</div>
          <div style={{ fontFamily:"'DM Mono', monospace", fontWeight: 700, fontSize: 22, color:"#0B1E3D", letterSpacing:"0.08em" }}>TECH<span style={{ color:"#10B981" }}>M4</span>SCHOOLS</div>
          <div style={{ fontSize: 14, color:"#64748B", marginTop: 4 }}>Summer Innovation Bootcamp 2025</div>
        </div>

        {/* Card */}
        <div style={{ background:"#fff", borderRadius: 24, padding: 32, boxShadow:"0 8px 48px rgba(0,0,0,0.10)", border:"1px solid #E2E8F0" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color:"#0F172A", marginBottom: 24 }}>Welcome back! 👋</div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color:"#64748B", marginBottom: 8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Email</div>
            <input value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="name@school.com"
              style={{ width:"100%", padding:"12px 16px", border:`1.5px solid ${err?"#EF4444":"#E2E8F0"}`, borderRadius: 12, fontSize: 14, outline:"none", fontFamily:"inherit", color:"#0F172A", background:"#FAFAFA" }} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color:"#64748B", marginBottom: 8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Password</div>
            <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Enter your password"
              style={{ width:"100%", padding:"12px 16px", border:`1.5px solid ${err?"#EF4444":"#E2E8F0"}`, borderRadius: 12, fontSize: 14, outline:"none", fontFamily:"inherit", color:"#0F172A", background:"#FAFAFA" }} />
            {err && <div style={{ fontSize: 12, color:"#EF4444", marginTop: 6 }}>{err}</div>}
            <div style={{ fontSize: 11, color:"#94A3B8", marginTop: 6 }}>Demo admin: `admin@demo.techm4schools.local` / `ChangeMe_Admin_12345`</div>
          </div>

          <button onClick={handleLogin} style={{
            width:"100%", padding:"14px", background: animating ? "#6EE7B7" : "#10B981",
            color:"#fff", border:"none", borderRadius: 14, fontSize: 16, fontWeight: 700,
            cursor:"pointer", transition:"all 0.2s", transform: animating ? "scale(0.98)" : "scale(1)"
          }}>
            {animating ? "Logging in..." : "Enter Bootcamp 🚀"}
          </button>
        </div>

        <div style={{ textAlign:"center", marginTop: 20, fontSize: 12, color:"#94A3B8" }}>
          TechM4Schools · Hyderabad, Telangana · June 1–30, 2025
        </div>
      </div>
    </div>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const TABS: { id: TabId; icon: string; label: string; roles: Role[] }[] = [
  { id:"dashboard",    icon:"🏠", label:"Dashboard",    roles:["student","mentor","admin"] },
  { id:"classes",      icon:"📚", label:"Classes",      roles:["student","mentor","admin"] },
  { id:"lab",          icon:"⚡", label:"Code Lab",     roles:["student","mentor","admin"] },
  { id:"submissions",  icon:"📤", label:"Submissions",  roles:["student","mentor","admin"] },
  { id:"leaderboard",  icon:"🏆", label:"Leaderboard",  roles:["student","mentor","admin"] },
  { id:"posters",      icon:"📣", label:"Updates",      roles:["student","mentor","admin"] },
  { id:"profile",      icon:"👤", label:"My Profile",   roles:["student","mentor","admin"] },
];

const Sidebar = ({ user, active, onChange, mobile, onClose }: { user: User; active: TabId; onChange: (t: TabId) => void; mobile: boolean; onClose?: () => void }) => {
  const tabs = TABS.filter(t => t.roles.includes(user.role));
  const [prog, setProg] = useState<{ totalDays: number; currentDay: number } | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, subs] = await Promise.all([api.getProgram(), api.getSubmissions()]);
        if (!alive) return;
        setProg({ totalDays: p.program.totalDays, currentDay: p.state.currentDay });
        const pending = (subs as any[]).filter((s) => s.status === "pending" && (user.role !== "student" || s.studentId === user.id)).length;
        setPendingCount(pending);
      } catch {
        setProg(null);
      }
    })();
    return () => { alive = false; };
  }, [user.id, user.role]);

  return (
    <div style={{
      width: mobile ? "100%" : 220, background:"#fff", borderRight: mobile ? "none" : "1px solid #E2E8F0",
      display:"flex", flexDirection:"column", height: mobile ? "auto" : "100vh",
      position: mobile ? "relative" : "sticky", top: 0, flexShrink: 0,
      boxShadow: mobile ? "0 4px 24px rgba(0,0,0,0.12)" : "none",
    }}>
      {/* Brand */}
      <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid #F1F5F9" }}>
        <div style={{ fontFamily:"'DM Mono', monospace", fontWeight: 700, fontSize: 14, color:"#0B1E3D", letterSpacing:"0.08em" }}>
          TECH<span style={{ color:"#10B981" }}>M4</span>SCHOOLS
        </div>
        <div style={{ fontSize: 11, color:"#94A3B8", marginTop: 3 }}>Summer Bootcamp 2025</div>
      </div>

      {/* User chip */}
      <div style={{ padding:"14px 16px", borderBottom:"1px solid #F1F5F9" }}>
        <div style={{ display:"flex", alignItems:"center", gap: 10, background:"#F8FAFC", borderRadius: 12, padding:"10px 12px" }}>
          <Avatar initials={user.avatar} color="#10B981" size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color:"#0F172A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: 11, color:"#64748B" }}>Level {user.level} · {user.xp.toLocaleString()} XP</div>
          </div>
          <div style={{ fontSize: 18 }}>🔥</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding:"10px 10px", overflowY:"auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { onChange(t.id); onClose?.(); }} style={{
            width:"100%", display:"flex", alignItems:"center", gap: 10, padding:"10px 12px",
            background: active === t.id ? "#F0FDF4" : "transparent",
            border:"none", borderRadius: 10, cursor:"pointer", textAlign:"left",
            color: active === t.id ? "#059669" : "#475569", fontWeight: active===t.id ? 600 : 400,
            fontSize: 14, transition:"all 0.15s", marginBottom: 2,
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
            {t.id === "submissions" && pendingCount > 0 && (
              <span style={{ marginLeft:"auto", background:"#FEF3C7", color:"#B45309", fontSize: 10, fontWeight: 900, padding:"2px 6px", borderRadius: 8 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Day badge */}
      <div style={{ padding:"14px 16px", borderTop:"1px solid #F1F5F9" }}>
        <div style={{ background:"linear-gradient(135deg, #0B1E3D, #1E3A5F)", borderRadius: 12, padding:"12px 14px", color:"#fff" }}>
          <div style={{ fontSize: 10, opacity: 0.7, letterSpacing:"0.08em", marginBottom: 4 }}>BOOTCAMP PROGRESS</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 8 }}>
            <span style={{ fontFamily:"'DM Mono', monospace", fontSize: 20, fontWeight: 700, color:"#F59E0B" }}>Day {prog?.currentDay ?? 1}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>of {prog?.totalDays ?? 25}</span>
          </div>
          <div style={{ height: 4, background:"rgba(255,255,255,0.15)", borderRadius: 4 }}>
            <div style={{ height:"100%", width:`${Math.round(((prog?.currentDay ?? 1) / (prog?.totalDays ?? 25)) * 100)}%`, background:"linear-gradient(90deg,#10B981,#F59E0B)", borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
            {Math.max(0, (prog?.totalDays ?? 25) - (prog?.currentDay ?? 1))} days remaining
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ user, onNav }: { user: User; onNav: (t: TabId) => void }) => {
  const tc = TRACK_COLORS[user.track];
  const [classes, setClasses] = useState<ClassSession[]>(CLASSES_FALLBACK);
  const [announcements, setAnnouncements] = useState<Announcement[]>(ANNOUNCEMENTS_FALLBACK);
  const [pendingSubs, setPendingSubs] = useState<number>(0);
  const [prog, setProg] = useState<{ totalDays: number; currentDay: number } | null>(null);
  const [today, setToday] = useState<any | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cls, ann, subs, progRes] = await Promise.all([
          api.getClasses(),
          api.getAnnouncements(),
          api.getSubmissions(),
          api.getProgram()
        ]);
        if (!alive) return;
        setClasses(cls as any);
        setAnnouncements(ann as any);
        const pending = (subs as any[]).filter((s) => s.studentId === user.id && s.status === "pending").length;
        setPendingSubs(pending);
        setProg({ totalDays: progRes.program.totalDays, currentDay: progRes.state.currentDay });
        try {
          const day = await api.getProgramDay(progRes.state.currentDay);
          if (alive) setToday(day);
        } catch {
          setToday(null);
        }
      } catch {
        // keep fallback
      }
    })();
    return () => { alive = false; };
  }, [user.id]);

  const todayClass = useMemo(() => classes.find(c => c.status === "live"), [classes]);

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ background:`linear-gradient(135deg, ${tc.bg}, #fff)`, border:`1px solid ${tc.border}`, borderRadius: 20, padding:"24px 28px", marginBottom: 20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color:"#0F172A", marginBottom: 4 }}>Good morning, {user.name.split(" ")[0]}! {user.streak >= 3 ? "🔥" : "👋"}</div>
          <div style={{ fontSize: 14, color:"#64748B" }}>
            {trackIcon[user.track]} {user.track} Track · {user.grade} · Day {prog?.currentDay ?? 1} of {prog?.totalDays ?? 25}
          </div>
          {today && (
            <div style={{ fontSize: 13, color:"#334155", marginTop: 8 }}>
              <strong>Today:</strong> {today.topic}
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap: 12, flexWrap:"wrap" }}>
          {[
            { label:"XP", value: user.xp.toLocaleString(), color:"#F59E0B", bg:"#FFFBEB" },
            { label:"Rank", value:`#${user.rank}`, color:"#7C3AED", bg:"#FAF5FF" },
            { label:"Streak", value:`${user.streak}🔥`, color:"#EF4444", bg:"#FEF2F2" },
            { label:"Level", value:`${user.level}`, color:"#10B981", bg:"#F0FDF4" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding:"10px 16px", textAlign:"center", minWidth: 70 }}>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 25-Day Progress Strip */}
      <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius: 16, padding:"18px 20px", marginBottom: 20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color:"#0F172A" }}>25-Day Progress</div>
          <div style={{ fontSize: 12, color:"#64748B" }}>
            {Math.max(0, (prog?.totalDays ?? 25) - (prog?.currentDay ?? 1))} days remaining
          </div>
        </div>
        <div style={{ overflowX:"auto", paddingBottom: 8 }}>
          <div style={{ display:"flex", gap: 6, minWidth: "max-content" }}>
            {Array.from({length:(prog?.totalDays ?? 25)},(_,i)=>i+1).map(d => {
              const cd = prog?.currentDay ?? 1;
              const status = d < cd ? "done" : d === cd ? "today" : "upcoming";
              return (
                <div key={d} style={{
                  width: 44, height: 44, borderRadius: 10, display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink: 0,
                  background: status==="today" ? "#10B981" : status==="done" ? "#F0FDF4" : "#F8FAFC",
                  border: `1.5px solid ${status==="today"?"#10B981":status==="done"?"#6EE7B7":"#E2E8F0"}`,
                  boxShadow: status==="today" ? "0 0 16px rgba(16,185,129,0.35)" : "none",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: status==="today"?"#fff":status==="done"?"#059669":"#CBD5E1" }}>{d}</div>
                  <div style={{ fontSize: 8, color: status==="today"?"rgba(255,255,255,0.8)":status==="done"?"#10B981":"#CBD5E1" }}>{status==="done"?"✓":status==="today"?"NOW":"·"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 20 }}>

        {/* Today's Class */}
        {todayClass && (
          <div style={{ background:"#fff", border:"2px solid #10B981", borderRadius: 16, padding: 20, gridColumn:"span 2" }} onClick={() => onNav("classes")} >
            <div style={{ display:"flex", alignItems:"center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, background:"#10B981", borderRadius:"50%", animation:"pulse 1.5s infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color:"#059669", textTransform:"uppercase", letterSpacing:"0.06em" }}>Live Now</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color:"#0F172A", marginBottom: 6 }}>{todayClass.title}</div>
            <div style={{ fontSize: 14, color:"#64748B", marginBottom: 12 }}>{todayClass.topic}</div>
            <div style={{ display:"flex", gap: 8, flexWrap:"wrap" }}>
              <span style={{ background:"#F0FDF4", color:"#059669", fontSize: 12, padding:"4px 10px", borderRadius: 8 }}>⏰ {todayClass.time}</span>
              <span style={{ background:"#F0FDF4", color:"#059669", fontSize: 12, padding:"4px 10px", borderRadius: 8 }}>👨‍🏫 {todayClass.mentor}</span>
              <span style={{ background:`${TRACK_COLORS[todayClass.track].bg}`, color:`${TRACK_COLORS[todayClass.track].text}`, fontSize: 12, padding:"4px 10px", borderRadius: 8 }}>{trackIcon[todayClass.track]} {todayClass.track}</span>
            </div>
          </div>
        )}

        {/* Announcements */}
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color:"#0F172A", marginBottom: 14 }}>📢 Announcements</div>
          {announcements.slice(0,3).map(a => (
            <div key={a.id} style={{ borderBottom:"1px solid #F1F5F9", paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ display:"flex", alignItems:"center", gap: 8, marginBottom: 4 }}>
                <Badge type={a.type} />
                {a.pinned && <span style={{ fontSize: 10, color:"#EF4444" }}>📌</span>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color:"#0F172A", marginBottom: 2 }}>{a.title}</div>
              <div style={{ fontSize: 11, color:"#94A3B8" }}>{a.date}</div>
            </div>
          ))}
          <button onClick={() => onNav("posters")} style={{ background:"none", border:"none", color:"#10B981", fontSize: 13, cursor:"pointer", fontWeight: 600 }}>View all →</button>
        </div>

        {/* Quick Actions */}
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color:"#0F172A", marginBottom: 14 }}>⚡ Quick Actions</div>
          <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
            {[
              { icon:"⚡", label:"Open Code Lab", sub:"Arduino, Python, HTML", color:"#F59E0B", tab:"lab" as TabId },
              { icon:"📤", label:"Submit Assignment", sub:`${pendingSubs} pending review`, color:"#EF4444", tab:"submissions" as TabId },
              { icon:"🏆", label:"Leaderboard", sub:`You're ranked #${user.rank}`, color:"#7C3AED", tab:"leaderboard" as TabId },
              { icon:"📚", label:"Class Schedule", sub:"Day 8 starts tomorrow", color:"#10B981", tab:"classes" as TabId },
            ].map(a => (
              <button key={a.tab} onClick={() => onNav(a.tab)} style={{
                display:"flex", alignItems:"center", gap: 12, padding:"10px 14px",
                background:"#FAFAFA", border:"1px solid #E2E8F0", borderRadius: 12,
                cursor:"pointer", textAlign:"left", transition:"all 0.15s",
              }}>
                <div style={{ width: 36, height: 36, background: a.color+"20", borderRadius: 10, display:"flex", alignItems:"center", justifyContent:"center", fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color:"#0F172A" }}>{a.label}</div>
                  <div style={{ fontSize: 11, color:"#94A3B8" }}>{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius: 16, padding: 20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color:"#0F172A" }}>XP Progress</div>
          <div style={{ display:"flex", gap: 6 }}>
            {user.badges.map((b, i) => (
              <div key={i} style={{ width: 32, height: 32, background:"#FFFBEB", borderRadius: 8, display:"flex", alignItems:"center", justifyContent:"center", fontSize: 16, border:"1px solid #FDE68A" }}>{b}</div>
            ))}
          </div>
        </div>
        <XPBar xp={user.xp} level={user.level} />
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
};

// NOTE: To keep setup fast, the rest of the tabs are omitted here.
// If you want the *full* original file in the Vite app, tell me and I’ll paste the remaining components (Classes, CodeLab, Submissions, Leaderboard, PostersUpdates, Profile).

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabId>("dashboard");
  const isNarrow = useIsNarrow();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <LoginScreen onLogin={u => setUser(u)} />;

  const render = () => {
    switch (tab) {
      case "dashboard":
        return <Dashboard user={user} onNav={setTab} />;
      case "classes":
        return <ClassesPage user={user} />;
      case "lab":
        return <CodeLabPage user={user} />;
      case "submissions":
        return <SubmissionsPage user={user} />;
      case "profile":
        return <ProfilePage user={user} onLogout={() => setUser(null)} />;
      case "leaderboard":
        return <LeaderboardPage user={user} />;
      case "posters":
        return <UpdatesPage user={user} />;
      default:
        return <Dashboard user={user} onNav={setTab} />;
    }
  };

  return (
    <div className="appShell" style={{ display:"flex", minHeight:"100vh", background:"#F8FAFC", fontFamily:"'DM Sans', 'Segoe UI', sans-serif" }}>
      {!isNarrow && <Sidebar user={user} active={tab} onChange={setTab} mobile={false} />}

      {isNarrow && (
        <div className="mobileHeader">
          <button className="iconBtn" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">☰</button>
          <div style={{ fontFamily:"'DM Mono', monospace", fontWeight: 900, letterSpacing:"0.08em", fontSize: 12, color:"#0B1E3D" }}>
            TECH<span style={{ color:"#10B981" }}>M4</span>SCHOOLS
          </div>
          <button className="iconBtn" onClick={() => setTab("profile")} aria-label="Profile">👤</button>
        </div>
      )}

      {isNarrow && mobileMenuOpen && (
        <div className="mobileOverlay" onClick={() => setMobileMenuOpen(false)} role="presentation">
          <div className="mobileDrawer" onClick={(e) => e.stopPropagation()}>
            <Sidebar user={user} active={tab} onChange={setTab} mobile={true} onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <main className="main" style={{ flex: 1, overflowY:"auto", padding:"28px 24px" }}>
        <div className="mainInner" style={{ maxWidth: 1100, margin:"0 auto" }}>
          {render()}
        </div>
      </main>

      {isNarrow && (
        <div className="mobileNav" role="navigation" aria-label="Bottom navigation">
          {TABS.filter(t => t.roles.includes(user.role)).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="mobileNavBtn"
              aria-current={tab === t.id ? "page" : undefined}
            >
              <div style={{ fontSize: 18, lineHeight: "18px" }}>{t.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 900, opacity: tab === t.id ? 1 : 0.7, whiteSpace:"nowrap" }}>{t.label}</div>
            </button>
          ))}
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; -webkit-font-smoothing: antialiased; }
        textarea:focus, input:focus { outline: none; border-color: #10B981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.1) !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }

        .mobileHeader{
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          z-index: 50;
          background: rgba(248,250,252,0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
        }
        .iconBtn{
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: #fff;
          cursor: pointer;
          font-weight: 900;
        }
        .mobileOverlay{
          position: fixed;
          inset: 0;
          z-index: 60;
          background: rgba(15,23,42,0.4);
          padding: 10px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }
        .mobileDrawer{
          width: min(420px, 100%);
          margin-top: 56px;
          border-radius: 16px;
          overflow: hidden;
        }
        .mobileNav{
          position: fixed;
          left: 0; right: 0; bottom: 0;
          height: 64px;
          z-index: 50;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          border-top: 1px solid #E2E8F0;
          display: flex;
          gap: 6px;
          padding: 8px 10px;
          overflow-x: auto;
        }
        .mobileNavBtn{
          min-width: 86px;
          border: 1px solid transparent;
          background: transparent;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #0F172A;
        }
        .mobileNavBtn[aria-current="page"]{
          background: #F0FDF4;
          border-color: #6EE7B7;
          color: #059669;
        }

        @media (max-width: 768px){
          .main{
            padding: 74px 12px 84px !important;
          }
        }
      `}</style>
    </div>
  );
}

